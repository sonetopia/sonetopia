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
  kind: AudioKind
  src: string
  duration: number
  tags: string[]
  addedAt: string
  coverUrl?: string
  origin: "demo" | "upload"
}

export type Playlist = {
  id: string
  name: string
  description: string
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

export function formatDuration(seconds?: number) {
  if (!seconds || !Number.isFinite(seconds) || seconds <= 0) return "--:--"
  const total = Math.round(seconds)
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`
}

export function formatTotalDuration(tracks: Track[]) {
  const seconds = tracks.reduce((sum, track) => sum + (track.duration || 0), 0)
  if (seconds < 3600) return `${Math.round(seconds / 60)} min`
  return `${Math.floor(seconds / 3600)} h ${Math.round((seconds % 3600) / 60)} min`
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

const sample = (n: number) =>
  `https://www.soundhelix.com/examples/mp3/SoundHelix-Song-${n}.mp3`
const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString()

// ponytail: demo tracks point at public sample audio so the player is usable before the Spring API exists
export const SEED_TRACKS: Track[] = [
  {
    id: "demo-1",
    title: "Lofi Sunrise",
    artist: "Evening Collective",
    kind: "music",
    src: sample(1),
    duration: 372,
    tags: ["lofi", "chill"],
    addedAt: daysAgo(1),
    origin: "demo",
  },
  {
    id: "demo-2",
    title: "Deep Focus (Instrumental)",
    artist: "Studio Anonymous",
    kind: "instrumental",
    src: sample(2),
    duration: 425,
    tags: ["focus", "work"],
    addedAt: daysAgo(2),
    origin: "demo",
  },
  {
    id: "demo-3",
    title: "Episode 01 — Building Small Habits",
    artist: "Sonetopia Podcast",
    kind: "podcast",
    src: sample(3),
    duration: 1840,
    tags: ["productivity"],
    addedAt: daysAgo(3),
    origin: "demo",
  },
  {
    id: "demo-4",
    title: "Rain on a Tin Roof",
    artist: "Ambience Lab",
    kind: "ambience",
    src: sample(4),
    duration: 2400,
    tags: ["sleep", "rain"],
    addedAt: daysAgo(4),
    origin: "demo",
  },
  {
    id: "demo-5",
    title: "Nocturne in E-flat",
    artist: "F. Chopin",
    kind: "instrumental",
    src: sample(5),
    duration: 268,
    tags: ["classical", "piano"],
    addedAt: daysAgo(6),
    origin: "demo",
  },
  {
    id: "demo-6",
    title: "White Noise — Desk Fan",
    artist: "Ambience Lab",
    kind: "ambience",
    src: sample(6),
    duration: 3600,
    tags: ["white noise", "sleep"],
    addedAt: daysAgo(8),
    origin: "demo",
  },
  {
    id: "demo-7",
    title: "Chapter 1 — The Journey Begins",
    artist: "Spoken Books",
    kind: "audiobook",
    src: sample(7),
    duration: 1500,
    tags: ["novel"],
    addedAt: daysAgo(12),
    origin: "demo",
  },
  {
    id: "demo-8",
    title: "Neon Drive",
    artist: "Retro Kid",
    kind: "music",
    src: sample(8),
    duration: 310,
    tags: ["synthwave", "driving"],
    addedAt: daysAgo(15),
    origin: "demo",
  },
]

export const SEED_PLAYLISTS: Playlist[] = [
  {
    id: "pl-focus",
    name: "Deep Work",
    description: "Instrumentals and lofi for long work sessions.",
    trackIds: ["demo-2", "demo-1", "demo-8"],
    createdAt: daysAgo(10),
  },
  {
    id: "pl-sleep",
    name: "Sleep Tight",
    description: "Ambience to fall asleep to.",
    trackIds: ["demo-4", "demo-6"],
    createdAt: daysAgo(7),
  },
  {
    id: "pl-podcast",
    name: "Morning Podcast",
    description: "Listen while walking in the morning.",
    trackIds: ["demo-3"],
    createdAt: daysAgo(3),
  },
]

export type UploadInput = {
  file: File
  title: string
  artist: string
  kind: AudioKind
  tags: string[]
}

type LibraryValue = {
  tracks: Track[]
  playlists: Playlist[]
  trackById: (id: string) => Track | undefined
  tracksByIds: (ids: string[]) => Track[]
  addUploads: (inputs: UploadInput[]) => number
  removeTrack: (id: string) => void
  setTrackDuration: (id: string, duration: number) => void
  createPlaylist: (input: { name: string; description: string }) => Playlist
  updatePlaylist: (id: string, patch: { name?: string; description?: string }) => void
  deletePlaylist: (id: string) => void
  addTrackToPlaylist: (playlistId: string, trackId: string) => void
  removeTrackFromPlaylist: (playlistId: string, trackId: string) => void
  movePlaylistTrack: (playlistId: string, from: number, to: number) => void
}

const LibraryContext = createContext<LibraryValue | null>(null)
const PLAYLIST_KEY = "sonetopia:playlists"

export function LibraryProvider({ children }: { children: ReactNode }) {
  const [tracks, setTracks] = useState<Track[]>(SEED_TRACKS)
  const [playlists, setPlaylists] = useState<Playlist[]>(() => {
    const stored = loadJSON<Playlist[] | null>(PLAYLIST_KEY, null)
    return stored?.length ? stored : SEED_PLAYLISTS
  })

  useEffect(() => saveJSON(PLAYLIST_KEY, playlists), [playlists])

  // ponytail: uploads live in memory (blob URLs) until the Spring API can store files
  const addUploads = useCallback((inputs: UploadInput[]) => {
    const now = new Date()
    const created: Track[] = inputs.map((input, index) => ({
      id: `up-${now.getTime()}-${index}`,
      title: input.title.trim() || input.file.name,
      artist: input.artist.trim() || "Unknown artist",
      kind: input.kind,
      src: URL.createObjectURL(input.file),
      duration: 0,
      tags: input.tags,
      addedAt: now.toISOString(),
      origin: "upload",
    }))
    setTracks((prev) => [...created, ...prev])
    return created.length
  }, [])

  const removeTrack = useCallback((id: string) => {
    setTracks((prev) => {
      const target = prev.find((track) => track.id === id)
      if (target?.origin === "upload") URL.revokeObjectURL(target.src)
      return prev.filter((track) => track.id !== id)
    })
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

  const createPlaylist = useCallback<LibraryValue["createPlaylist"]>((input) => {
    const playlist: Playlist = {
      id: `pl-${Date.now()}`,
      name: input.name.trim(),
      description: input.description.trim(),
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
      trackById,
      tracksByIds,
      addUploads,
      removeTrack,
      setTrackDuration,
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
      trackById,
      tracksByIds,
      addUploads,
      removeTrack,
      setTrackDuration,
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