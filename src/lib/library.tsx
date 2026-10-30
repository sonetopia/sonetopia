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
  createAudioFromTemp,
  deleteAudio,
  getAudio,
  listAudio,
  mediaUrl,
  updateAudio,
  type AudioResponse,
  type UpdateAudioInput,
} from "@/api/audio"
import { forgetCover } from "@/lib/covers"
import { useAuth } from "@/lib/auth"
import {
  addPlaylistAudio,
  createPlaylist as createPlaylistRequest,
  deletePlaylist as deletePlaylistRequest,
  listPlaylistAudio,
  listPlaylists,
  movePlaylistAudio,
  removePlaylistAudio,
  updatePlaylist as updatePlaylistRequest,
  type PlaylistResponse,
} from "@/api/playlists"


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
  coverVersion?: number
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
    coverVersion: audio.coverVersion ?? undefined,
  }
}

async function hydrateTrack(item: AudioResponse): Promise<Track> {
  const detail = await getAudio(item.id).catch(() => null)
  return trackFromDetail(detail ?? item)
}

function toPlaylist(row: PlaylistResponse, trackIds: string[]): Playlist {
  return { id: row.id, name: row.title, trackIds, createdAt: row.createdAt }
}

async function playlistTrackIds(playlistId: string) {
  const rows = await listPlaylistAudio(playlistId).catch(() => [])
  return rows.map((row) => row.audioId)
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

export type UrlUploadInput = {
  tempId: string
  title: string
  artist: string
  kind: AudioKind
  album?: string
  year?: number
}

type LibraryValue = {
  tracks: Track[]
  playlists: Playlist[]
  loading: boolean
  error: string | null
  trackById: (id: string) => Track | undefined
  tracksByIds: (ids: string[]) => Track[]
  addUploads: (inputs: UploadInput[]) => Promise<number>
  addFetchedUpload: (input: UrlUploadInput) => Promise<void>
  removeTrack: (id: string) => Promise<void>
  setTrackDuration: (id: string, duration: number) => void
  updateTrack: (id: string, input: UpdateAudioInput) => Promise<void>
  createPlaylist: (input: { name: string }) => Promise<Playlist>
  updatePlaylist: (id: string, patch: { name?: string }) => Promise<void>
  deletePlaylist: (id: string) => Promise<void>
  addTrackToPlaylist: (playlistId: string, trackId: string) => Promise<void>
  removeTrackFromPlaylist: (playlistId: string, trackId: string) => Promise<void>
  movePlaylistTrack: (playlistId: string, from: number, to: number) => Promise<void>
}

const LibraryContext = createContext<LibraryValue | null>(null)

export function LibraryProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const userId = user?.id
  const [tracks, setTracks] = useState<Track[]>([])
  const [loadedUserId, setLoadedUserId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [playlists, setPlaylists] = useState<Playlist[]>([])

  useEffect(() => {
    if (!userId) return

    let cancelled = false

    const audio = listAudio()
      .then((items) => Promise.all(items.map(hydrateTrack)))
      .then((apiTracks) => {
        if (cancelled) return
        setTracks(apiTracks)
        setError(null)
      })

    const playlistRows = listPlaylists().then(async (rows) => {
      const memberships = await Promise.all(rows.map((row) => playlistTrackIds(row.id)))
      if (cancelled) return
      setPlaylists(rows.map((row, index) => toPlaylist(row, memberships[index])))
    })

    Promise.all([audio, playlistRows])
      .catch((cause: unknown) => {
        if (cancelled) return
        setTracks([])
        setPlaylists([])
        setError(cause instanceof Error ? cause.message : "Failed to load your library")
      })
      .finally(() => {
        if (!cancelled) setLoadedUserId(userId)
      })

    return () => {
      cancelled = true
    }
  }, [userId])

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

  const addFetchedUpload = useCallback(async (input: UrlUploadInput) => {
    const audio = await createAudioFromTemp({
      tempId: input.tempId,
      title: input.title.trim(),
      type: input.kind,
      author: input.artist.trim() || undefined,
      album: input.album?.trim() || undefined,
      year: input.year,
    })
    const track = await trackFromDetail(await getAudio(audio.id))
    setTracks((prev) => [track, ...prev])
  }, [])

  const removeTrack = useCallback(async (id: string) => {
    await deleteAudio(id)
    await forgetCover(id)
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

  const createPlaylist = useCallback<LibraryValue["createPlaylist"]>(async (input) => {
    const created = await createPlaylistRequest(input.name.trim())
    const playlist = toPlaylist(created, [])
    setPlaylists((prev) => [playlist, ...prev])
    return playlist
  }, [])

  const updatePlaylist = useCallback<LibraryValue["updatePlaylist"]>(async (id, patch) => {
    if (patch.name === undefined) return
    const updated = await updatePlaylistRequest(id, patch.name.trim())
    setPlaylists((prev) =>
      prev.map((playlist) => (playlist.id === id ? { ...playlist, name: updated.title } : playlist))
    )
  }, [])

  const deletePlaylist = useCallback(async (id: string) => {
    await deletePlaylistRequest(id)
    setPlaylists((prev) => prev.filter((playlist) => playlist.id !== id))
  }, [])

  const addTrackToPlaylist = useCallback(async (playlistId: string, trackId: string) => {
    await addPlaylistAudio(playlistId, trackId)
    setPlaylists((prev) =>
      prev.map((playlist) =>
        playlist.id === playlistId && !playlist.trackIds.includes(trackId)
          ? { ...playlist, trackIds: [...playlist.trackIds, trackId] }
          : playlist
      )
    )
  }, [])

  const removeTrackFromPlaylist = useCallback(async (playlistId: string, trackId: string) => {
    await removePlaylistAudio(playlistId, trackId)
    setPlaylists((prev) =>
      prev.map((playlist) =>
        playlist.id === playlistId
          ? { ...playlist, trackIds: playlist.trackIds.filter((t) => t !== trackId) }
          : playlist
      )
    )
  }, [])

  // `to` is the 0-based index the track should end up at, same as the API position
  const movePlaylistTrack = useCallback(
    async (playlistId: string, from: number, to: number) => {
      const playlist = playlists.find((item) => item.id === playlistId)
      if (!playlist || to < 0 || to >= playlist.trackIds.length) return
      const audioId = playlist.trackIds[from]
      if (!audioId) return
      await movePlaylistAudio(playlistId, audioId, to)
      setPlaylists((prev) =>
        prev.map((item) => {
          if (item.id !== playlistId) return item
          const trackIds = [...item.trackIds]
          const [moved] = trackIds.splice(from, 1)
          if (moved === undefined) return item
          trackIds.splice(to, 0, moved)
          return { ...item, trackIds }
        })
      )
    },
    [playlists]
  )

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
      loading: Boolean(userId) && loadedUserId !== userId,
      error: loadedUserId === userId ? error : null,
      trackById,
      tracksByIds,
      addUploads,
      addFetchedUpload,
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
      userId,
      loadedUserId,
      error,
      trackById,
      tracksByIds,
      addUploads,
      addFetchedUpload,
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
