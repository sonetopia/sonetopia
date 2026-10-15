import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import {
  AudioLines,
  BookOpen,
  Guitar,
  Mic,
  Music,
  Waves,
  type LucideIcon,
} from "lucide-react"
import {
  createAudio,
  deleteAudio,
  getAudio,
  getAudioCover,
  listAudio,
  mediaUrl,
  updateAudio,
  type AudioResponse,
  type UpdateAudioInput,
} from "@/api/audio"
import { loadJSON, saveJSON } from "@/lib/persist"

export type AudioKind =
  | "music"
  | "podcast"
  | "instrumental"
  | "ambience"
  | "audiobook"
  | "other"

export type Track = {
  id: string
  title: string
  artist: string
  album: string
  kind: AudioKind
  src: string
  duration: number
  tags: string[]
  addedAt: string
  coverUrl?: string
}

export type Playlist = {
  id: string
  name: string
  trackIds: string[]
  createdAt: string
}

export const AUDIO_KINDS: Record<
  AudioKind,
  { label: string; icon: LucideIcon; cover: string }
> = {
  music: {
    label: "Music",
    icon: Music,
    cover: "from-amber-200 to-orange-300 text-orange-900/70",
  },
  podcast: {
    label: "Podcast",
    icon: Mic,
    cover: "from-orange-200 to-rose-200 text-rose-900/70",
  },
  instrumental: {
    label: "Instrumental",
    icon: Guitar,
    cover: "from-yellow-100 to-amber-300 text-amber-900/70",
  },
  ambience: {
    label: "Ambience",
    icon: Waves,
    cover: "from-orange-100 to-amber-200 text-amber-800/70",
  },
  audiobook: {
    label: "Audiobook",
    icon: BookOpen,
    cover: "from-amber-100 to-orange-200 text-orange-900/70",
  },
  other: {
    label: "Other",
    icon: AudioLines,
    cover: "from-stone-200 to-amber-200 text-stone-700",
  },
}

export const KIND_OPTIONS = Object.entries(AUDIO_KINDS).map(([value, meta]) => ({
  value: value as AudioKind,
  label: meta.label,
}))

/** `m:ss`, or `h:mm:ss` once the duration passes 59 minutes. */
export function formatDuration(seconds?: number) {
  if (!seconds || !Number.isFinite(seconds) || seconds <= 0) return "--:--"
  const total = Math.round(seconds)
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const secs = String(total % 60).padStart(2, "0")
  if (hours > 0) return `${hours}:${String(minutes).padStart(2, "0")}:${secs}`
  return `${minutes}:${secs}`
}

export function formatTotalDuration(tracks: Track[]) {
  const seconds = tracks.reduce((sum, track) => sum + (track.duration || 0), 0)
  if (seconds < 3600) return `${Math.round(seconds / 60)} min`
  return `${Math.floor(seconds / 3600)} h ${Math.round((seconds % 3600) / 60)} min`
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

const AUDIO_KIND_VALUES = Object.keys(AUDIO_KINDS) as AudioKind[]

function toAudioKind(type: string | null | undefined): AudioKind {
  const normalised = type?.trim().toLowerCase()
  return AUDIO_KIND_VALUES.find((kind) => kind === normalised) ?? "other"
}

async function trackFromDetail(audio: AudioResponse): Promise<Track> {
  const cover =
    (audio.coverVersion ?? 0) > 0 ? await getAudioCover(audio.id).catch(() => null) : null
  return {
    id: audio.id,
    title: audio.title,
    artist: audio.author?.trim() || "Unknown artist",
    album: audio.album?.trim() ?? "",
    kind: toAudioKind(audio.type),
    src: mediaUrl(audio.signedUrl) ?? "",
    duration: audio.duration ?? 0,
    tags: [],
    addedAt: audio.createdAt,
    coverUrl: mediaUrl(cover?.signedUrl),
  }
}

async function hydrateTrack(item: AudioResponse): Promise<Track> {
  const detail = await getAudio(item.id).catch(() => null)
  return trackFromDetail(detail ?? item)
}

export type UploadInput = {
  file: File
  title: string
  artist: string
  kind: AudioKind
  album?: string
  year?: number
  cover?: File
}

type LibraryValue = {
  tracks: Track[]
  playlists: Playlist[]
  loading: boolean
  error: string | null
  trackById: (id: string) => Track | undefined
  tracksByIds: (ids: string[]) => Track[]
  addUploads: (inputs: UploadInput[]) => Promise<number>
  removeTrack: (id: string) => Promise<void>
  setTrackDuration: (id: string, duration: number) => void
  updateTrack: (id: string, input: UpdateAudioInput) => Promise<void>
  createPlaylist: (input: { name: string }) => Playlist
  updatePlaylist: (id: string, patch: { name?: string }) => void
  deletePlaylist: (id: string) => void
  addTrackToPlaylist: (playlistId: string, trackId: string) => void
  removeTrackFromPlaylist: (playlistId: string, trackId: string) => void
  movePlaylistTrack: (playlistId: string, from: number, to: number) => void
}

const LibraryContext = createContext<LibraryValue | null>(null)
const PLAYLIST_KEY = "sonetopia:playlists"

export function LibraryProvider({ children }: { children: ReactNode }) {
  const [tracks, setTracks] = useState<Track[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [playlists, setPlaylists] = useState<Playlist[]>(() => {
    const stored = loadJSON<Playlist[] | null>(PLAYLIST_KEY, null)
    return stored ?? []
  })

  useEffect(() => saveJSON(PLAYLIST_KEY, playlists), [playlists])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    listAudio()
      .then((items) => Promise.all(items.map(hydrateTrack)))
      .then((apiTracks) => {
        if (cancelled) return
        setTracks(apiTracks)
      })
      .catch((cause: unknown) => {
        if (!cancelled) setError(cause instanceof Error ? cause.message : "Failed to load your library")
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const addUploads = useCallback(async (inputs: UploadInput[]) => {
    const created: Track[] = []
    const failures: string[] = []
    for (const input of inputs) {
      try {
        const audio = await createAudio({
          file: input.file,
          title: input.title.trim() || input.file.name,
          type: input.kind,
          author: input.artist.trim() || undefined,
          album: input.album?.trim() || undefined,
          year: input.year,
          cover: input.cover,
        })
        const track = await trackFromDetail(await getAudio(audio.id))
        created.push(track)
        setTracks((prev) => [track, ...prev])
      } catch (cause) {
        failures.push(`${input.title}: ${cause instanceof Error ? cause.message : "upload failed"}`)
      }
    }
    if (failures.length > 0) throw new Error(failures.join("; "))
    return created.length
  }, [])

  const removeTrack = useCallback(async (id: string) => {
    await deleteAudio(id)
    setTracks((prev) => prev.filter((track) => track.id !== id))
    setPlaylists((prev) =>
      prev.map((playlist) =>
        playlist.trackIds.includes(id)
          ? { ...playlist, trackIds: playlist.trackIds.filter((t) => t !== id) }
          : playlist
      )
    )
  }, [])

  const setTrackDuration = useCallback((id: string, duration: number) => {
    setTracks((prev) =>
      prev.map((track) => (track.id === id ? { ...track, duration } : track))
    )
  }, [])

  const updateTrack = useCallback(async (id: string, input: UpdateAudioInput) => {
    await updateAudio(id, input)
    const updated = await trackFromDetail(await getAudio(id))
    setTracks((prev) =>
      prev.map((track) =>
        track.id === id ? { ...updated, duration: updated.duration || track.duration } : track
      )
    )
  }, [])

  const createPlaylist = useCallback<LibraryValue["createPlaylist"]>((input) => {
    const playlist: Playlist = {
      id: `pl-${Date.now()}`,
      name: input.name.trim(),
      trackIds: [],
      createdAt: new Date().toISOString(),
    }
    setPlaylists((prev) => [playlist, ...prev])
    return playlist
  }, [])

  const updatePlaylist = useCallback<LibraryValue["updatePlaylist"]>((id, patch) => {
    setPlaylists((prev) =>
      prev.map((playlist) => (playlist.id === id ? { ...playlist, ...patch } : playlist))
    )
  }, [])

  const deletePlaylist = useCallback((id: string) => {
    setPlaylists((prev) => prev.filter((playlist) => playlist.id !== id))
  }, [])

  const addTrackToPlaylist = useCallback((playlistId: string, trackId: string) => {
    setPlaylists((prev) =>
      prev.map((playlist) =>
        playlist.id === playlistId && !playlist.trackIds.includes(trackId)
          ? { ...playlist, trackIds: [...playlist.trackIds, trackId] }
          : playlist
      )
    )
  }, [])

  const removeTrackFromPlaylist = useCallback((playlistId: string, trackId: string) => {
    setPlaylists((prev) =>
      prev.map((playlist) =>
        playlist.id === playlistId
          ? { ...playlist, trackIds: playlist.trackIds.filter((t) => t !== trackId) }
          : playlist
      )
    )
  }, [])

  const movePlaylistTrack = useCallback((playlistId: string, from: number, to: number) => {
    setPlaylists((prev) =>
      prev.map((playlist) => {
        if (playlist.id !== playlistId) return playlist
        if (to < 0 || to >= playlist.trackIds.length) return playlist
        const trackIds = [...playlist.trackIds]
        const [moved] = trackIds.splice(from, 1)
        trackIds.splice(to, 0, moved)
        return { ...playlist, trackIds }
      })
    )
  }, [])

  const trackById = useCallback(
    (id: string) => tracks.find((track) => track.id === id),
    [tracks]
  )

  const tracksByIds = useCallback(
    (ids: string[]) =>
      ids.map((id) => tracks.find((track) => track.id === id)).filter(Boolean) as Track[],
    [tracks]
  )

  const value = useMemo<LibraryValue>(
    () => ({
      tracks,
      playlists,
      loading,
      error,
      trackById,
      tracksByIds,
      addUploads,
      removeTrack,
      setTrackDuration,
      updateTrack,
      createPlaylist,
      updatePlaylist,
      deletePlaylist,
      addTrackToPlaylist,
      removeTrackFromPlaylist,
      movePlaylistTrack,
    }),
    [
      tracks,
      playlists,
      loading,
      error,
      trackById,
      tracksByIds,
      addUploads,
      removeTrack,
      setTrackDuration,
      updateTrack,
      createPlaylist,
      updatePlaylist,
      deletePlaylist,
      addTrackToPlaylist,
      removeTrackFromPlaylist,
      movePlaylistTrack,
    ]
  )

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>
}

export function useLibrary() {
  const context = useContext(LibraryContext)
  if (!context) throw new Error("useLibrary must be used inside LibraryProvider")
  return context
}