import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"
import { AUDIO_KINDS, useLibrary, type Track } from "@/lib/library"
import { shuffleWithFirst, stepIndex, type RepeatMode } from "@/lib/playback"
import { loadJSON, saveJSON } from "@/lib/persist"

type PlayerPrefs = {
  volume: number
  repeat: RepeatMode
  shuffle: boolean
}

const DEFAULT_PREFS: PlayerPrefs = { volume: 0.8, repeat: "off", shuffle: false }
const PLAYER_KEY = "sonetopia:player"

type PlayerValue = {
  queue: Track[]
  current?: Track
  currentIndex: number
  isPlaying: boolean
  position: number
  duration: number
  volume: number
  repeat: RepeatMode
  shuffle: boolean
  nowPlayingOpen: boolean
  setNowPlayingOpen: (open: boolean) => void
  playTrack: (track: Track) => void
  playTracks: (tracks: Track[], startIndex?: number, shuffleOverride?: boolean) => void
  toggle: () => void
  next: () => void
  previous: () => void
  seek: (seconds: number) => void
  setVolume: (volume: number) => void
  toggleShuffle: () => void
  cycleRepeat: () => void
  enqueueNext: (track: Track) => void
  addToQueue: (track: Track) => void
  jumpTo: (index: number) => void
  reorderQueue: (from: number, to: number) => void
  moveInQueue: (index: number, direction: -1 | 1) => void
  removeFromQueue: (index: number) => void
  clearQueue: () => void
}

const PlayerContext = createContext<PlayerValue | null>(null)

export function PlayerProvider({ children }: { children: ReactNode }) {
  const { setTrackDuration } = useLibrary()
  const audioRef = useRef<HTMLAudioElement>(null)
  const loadedRef = useRef<string | null>(null)

  const [prefs, setPrefs] = useState<PlayerPrefs>(() =>
    loadJSON<PlayerPrefs>(PLAYER_KEY, DEFAULT_PREFS)
  )
  const [queue, setQueue] = useState<Track[]>([])
  const [currentIndex, setCurrentIndex] = useState(-1)
  const [isPlaying, setIsPlaying] = useState(false)
  const [position, setPosition] = useState(0)
  const [duration, setDuration] = useState(0)
  const [nowPlayingOpen, setNowPlayingOpen] = useState(false)

  const { volume, repeat, shuffle } = prefs
  const current = currentIndex >= 0 ? queue[currentIndex] : undefined

  useEffect(() => saveJSON(PLAYER_KEY, prefs), [prefs])

  const updatePrefs = useCallback(
    (patch: Partial<PlayerPrefs>) => setPrefs((prev) => ({ ...prev, ...patch })),
    []
  )

  const step = useCallback(
    (delta: 1 | -1) => stepIndex(queue.length, currentIndex, delta, repeat),
    [queue.length, currentIndex, repeat]
  )

  const playTracks = useCallback(
    (tracks: Track[], startIndex = 0, shuffleOverride = shuffle) => {
      if (tracks.length === 0) return
      // surface the full player when playback starts from an empty state
      if (currentIndex < 0) setNowPlayingOpen(true)
      setQueue(shuffleOverride ? shuffleWithFirst(tracks, startIndex) : tracks)
      setCurrentIndex(shuffleOverride ? 0 : startIndex)
      setIsPlaying(true)
    },
    [shuffle, currentIndex]
  )

  const playTrack = useCallback((track: Track) => playTracks([track], 0), [playTracks])

  const next = useCallback(() => {
    const target = step(1)
    if (target === -1) {
      setIsPlaying(false)
      return
    }
    setCurrentIndex(target)
    setIsPlaying(true)
  }, [step])

  const previous = useCallback(() => {
    const audio = audioRef.current
    if (audio && audio.currentTime > 3) {
      audio.currentTime = 0
      return
    }
    const target = step(-1)
    if (target === -1) {
      if (audio) audio.currentTime = 0
      return
    }
    setCurrentIndex(target)
    setIsPlaying(true)
  }, [step])

  const toggle = useCallback(() => {
    if (currentIndex === -1) return
    setIsPlaying((prev) => !prev)
  }, [currentIndex])

  const seek = useCallback((seconds: number) => {
    const audio = audioRef.current
    if (!audio) return
    audio.currentTime = seconds
    setPosition(seconds)
  }, [])

  // load a new source only when the track identity changes, so re-renders never restart playback
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    if (!current) {
      loadedRef.current = null
      audio.removeAttribute("src")
      return
    }
    if (loadedRef.current === current.id) return
    loadedRef.current = current.id
    audio.src = current.src
    audio.currentTime = 0
    setPosition(0)
    setDuration(current.duration || 0)
    if (isPlaying) void audio.play().catch(() => setIsPlaying(false))
  }, [current, isPlaying])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    if (isPlaying) void audio.play().catch(() => setIsPlaying(false))
    else audio.pause()
  }, [isPlaying])

  useEffect(() => {
    const audio = audioRef.current
    if (audio) audio.volume = volume
  }, [volume])

  // OS / lock-screen controls keep working while the tab is in the background
  useEffect(() => {
    if (!("mediaSession" in navigator)) return
    if (!current) {
      navigator.mediaSession.metadata = null
      return
    }
    navigator.mediaSession.metadata = new MediaMetadata({
      title: current.title,
      artist: current.artist,
      album: AUDIO_KINDS[current.kind].label,
      artwork: current.coverUrl
        ? [{ src: current.coverUrl }]
        : [
            { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
            { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
          ],
    })
    navigator.mediaSession.setActionHandler("play", () => setIsPlaying(true))
    navigator.mediaSession.setActionHandler("pause", () => setIsPlaying(false))
    navigator.mediaSession.setActionHandler("nexttrack", next)
    navigator.mediaSession.setActionHandler("previoustrack", previous)
    navigator.mediaSession.setActionHandler("seekto", (details) => {
      if (typeof details.seekTime === "number") seek(details.seekTime)
    })
    const actions = ["play", "pause", "nexttrack", "previoustrack", "seekto"] as const
    return () => {
      for (const action of actions) navigator.mediaSession.setActionHandler(action, null)
    }
  }, [current, next, previous, seek])

  useEffect(() => {
    if ("mediaSession" in navigator) {
      navigator.mediaSession.playbackState = isPlaying ? "playing" : "paused"
    }
  }, [isPlaying])

  const setVolume = useCallback(
    (value: number) => updatePrefs({ volume: Math.min(1, Math.max(0, value)) }),
    [updatePrefs]
  )

  const toggleShuffle = useCallback(() => {
    if (!shuffle && currentIndex >= 0) {
      setQueue(shuffleWithFirst(queue, currentIndex))
      setCurrentIndex(0)
    }
    updatePrefs({ shuffle: !shuffle })
  }, [shuffle, queue, currentIndex, updatePrefs])

  const cycleRepeat = useCallback(
    () => updatePrefs({ repeat: repeat === "off" ? "all" : repeat === "all" ? "one" : "off" }),
    [repeat, updatePrefs]
  )

  const enqueueNext = useCallback(
    (track: Track) => {
      if (queue.length === 0 || currentIndex < 0) {
        setQueue([track])
        setCurrentIndex(0)
        setIsPlaying(true)
        return
      }
      setQueue((prev) => {
        const copy = [...prev]
        copy.splice(currentIndex + 1, 0, track)
        return copy
      })
    },
    [currentIndex, queue.length]
  )

  const addToQueue = useCallback((track: Track) => {
    setQueue((prev) => [...prev, track])
    setCurrentIndex((prevIndex) => (prevIndex === -1 ? 0 : prevIndex))
    setIsPlaying(true)
  }, [])

  const jumpTo = useCallback((index: number) => {
    setCurrentIndex(index)
    setIsPlaying(true)
  }, [])

  const reorderQueue = useCallback(
    (from: number, to: number) => {
      if (from === to || from < 0 || to < 0 || from >= queue.length || to >= queue.length) return

      setQueue((prev) => {
        const copy = [...prev]
        const [moved] = copy.splice(from, 1)
        copy.splice(to, 0, moved)
        return copy
      })
      setCurrentIndex((prevIndex) => {
        if (prevIndex === from) return to
        if (from < prevIndex && to >= prevIndex) return prevIndex - 1
        if (from > prevIndex && to <= prevIndex) return prevIndex + 1
        return prevIndex
      })
    },
    [queue.length]
  )

  const moveInQueue = useCallback(
    (index: number, direction: -1 | 1) => reorderQueue(index, index + direction),
    [reorderQueue]
  )

  const removeFromQueue = useCallback(
    (index: number) => {
      setQueue((prev) => prev.filter((_, i) => i !== index))
      if (index === currentIndex) {
        setCurrentIndex(-1)
        setIsPlaying(false)
      } else if (index < currentIndex) {
        setCurrentIndex((prev) => prev - 1)
      }
    },
    [currentIndex]
  )

  const clearQueue = useCallback(() => {
    setQueue([])
    setCurrentIndex(-1)
    setIsPlaying(false)
    updatePrefs({ shuffle: false })
  }, [updatePrefs])

  const value = useMemo<PlayerValue>(
    () => ({
      queue,
      current,
      currentIndex,
      isPlaying,
      position,
      duration,
      volume,
      repeat,
      shuffle,
      nowPlayingOpen,
      setNowPlayingOpen,
      playTrack,
      playTracks,
      toggle,
      next,
      previous,
      seek,
      setVolume,
      toggleShuffle,
      cycleRepeat,
      enqueueNext,
      addToQueue,
      jumpTo,
      reorderQueue,
      moveInQueue,
      removeFromQueue,
      clearQueue,
    }),
    [
      queue,
      current,
      currentIndex,
      isPlaying,
      position,
      duration,
      volume,
      repeat,
      shuffle,
      nowPlayingOpen,
      setNowPlayingOpen,
      playTrack,
      playTracks,
      toggle,
      next,
      previous,
      seek,
      setVolume,
      toggleShuffle,
      cycleRepeat,
      enqueueNext,
      addToQueue,
      jumpTo,
      reorderQueue,
      moveInQueue,
      removeFromQueue,
      clearQueue,
    ]
  )

  return (
    <PlayerContext.Provider value={value}>
      {children}
      <audio
        ref={audioRef}
        loop={repeat === "one"}
        preload="metadata"
        onTimeUpdate={(event) => setPosition(event.currentTarget.currentTime)}
        onLoadedMetadata={(event) => {
          const total = event.currentTarget.duration
          if (!Number.isFinite(total)) return
          setDuration(total)
          if (current && Math.abs(total - current.duration) > 1) {
            setTrackDuration(current.id, total)
          }
        }}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={next}
      />
    </PlayerContext.Provider>
  )
}

export function usePlayer() {
  const context = useContext(PlayerContext)
  if (!context) throw new Error("usePlayer harus dipakai di dalam PlayerProvider")
  return context
}
