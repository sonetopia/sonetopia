import { Link } from "react-router-dom"
import { useEffect, useRef, useState } from "react"
import {
  ArrowRight,
  AudioLines,
  CircleCheck,
  HardDrive,
  HardDriveUpload,
  Headphones,
  ListMusic,
  Pause,
  Play,
  ShieldCheck,
  SkipForward,
  Shuffle,
  Smartphone,
  X,
  type LucideIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useIsMobile } from "@/hooks/use-mobile"

const FEATURES: { icon: LucideIcon; title: string; body: string }[] = [
  {
    icon: Smartphone,
    title: "No built-in player? No problem",
    body: "Some phones ship without a way to play your own audio files. Sonetopia runs in the browser and becomes the player your device never had.",
  },
  {
    icon: HardDrive,
    title: "Reclaim your storage",
    body: "Instead of keeping large offline copies on a phone with finite space, stream from your library and keep only what you truly need offline.",
  },
  {
    icon: AudioLines,
    title: "Every kind of audio",
    body: "Music, podcasts, instrumentals, audiobooks, white noise, field recordings, ambience — if it is audio, it belongs here.",
  },
  {
    icon: Play,
    title: "Keeps playing in the background",
    body: "One player across the whole app. Leave the page, lock the screen, and playback continues with lock-screen controls.",
  },
  {
    icon: Shuffle,
    title: "Playlists, queue, shuffle, repeat",
    body: "Organize tracks into playlists, line up a real queue, shuffle a playlist, or repeat a single track for a focus session.",
  },
  {
    icon: ShieldCheck,
    title: "Private by design",
    body: "There is no explore feed and no one else's uploads. Your library is yours alone — nothing is public and nothing is recommended.",
  },
]

const STEPS: { icon: LucideIcon; title: string; body: string }[] = [
  {
    icon: HardDriveUpload,
    title: "1. Upload your audio",
    body: "Drop files from your device and tag them by type: music, podcast, audiobook, or ambience.",
  },
  {
    icon: ListMusic,
    title: "2. Organize your library",
    body: "Group tracks into playlists for deep work, sleep, workouts, or your morning commute.",
  },
  {
    icon: Headphones,
    title: "3. Listen anywhere",
    body: "Play from any device with a browser, keep it running in the background, and pick up where you left off.",
  },
]

const IS_LIST = [
  "A private library for audio you already own",
  "An alternative player for devices without one",
  "A way to stop hoarding offline copies of files",
]

const IS_NOT_LIST = [
  "A streaming catalog of other people's work",
  "An explore feed, chart, or recommendation engine",
  "A social network for sharing someone else's music",
]

type SoundEffect = {
  audio: string
  title: string
}

export function LandingPage() {
  const isMobile = useIsMobile()
  const [soundEffects, setSoundEffects] = useState<SoundEffect[]>([])
  const [activeSoundEffect, setActiveSoundEffect] = useState<SoundEffect | null>(null)
  const [isSoundEffectPlaying, setIsSoundEffectPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const primaryButton = (
    <Button size="lg" render={<Link to="/" />}>
      Go the app
      <ArrowRight />
    </Button>
  )

  useEffect(() => {
    let isMounted = true

    fetch("/sfx/map.json")
      .then((response) => response.json() as Promise<SoundEffect[]>)
      .then((sounds) => {
        if (isMounted) setSoundEffects(sounds)
      })
      .catch(() => undefined)

    return () => {
      isMounted = false
    }
  }, [])

  const playRandomSoundEffect = () => {
    if (soundEffects.length === 0) return

    const currentIndex = activeSoundEffect ? soundEffects.indexOf(activeSoundEffect) : -1
    let nextIndex = Math.floor(Math.random() * soundEffects.length)

    if (soundEffects.length > 1 && nextIndex === currentIndex) {
      nextIndex = (nextIndex + 1) % soundEffects.length
    }

    const nextSoundEffect = soundEffects[nextIndex]
    const audio = audioRef.current ?? new Audio()
    audioRef.current = audio
    audio.src = `/sfx/${nextSoundEffect.audio}`
    audio.onended = () => setIsSoundEffectPlaying(false)
    audio.onerror = () => setIsSoundEffectPlaying(false)
    audio.currentTime = 0
    setActiveSoundEffect(nextSoundEffect)

    void audio.play().then(
      () => setIsSoundEffectPlaying(true),
      () => setIsSoundEffectPlaying(false),
    )
  }

  const handlePlayButtonClick = () => {
    if (isSoundEffectPlaying) {
      audioRef.current?.pause()
      setIsSoundEffectPlaying(false)
      return
    }

    if (audioRef.current && activeSoundEffect && !audioRef.current.ended) {
      void audioRef.current.play().then(
        () => setIsSoundEffectPlaying(true),
        () => setIsSoundEffectPlaying(false),
      )
      return
    }

    playRandomSoundEffect()
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:py-12">
      <section className="grid min-h-[min(680px,calc(100svh-9rem))] items-center gap-12 border-b pb-16 lg:grid-cols-[1.1fr_0.9fr] lg:gap-20">
        <div className="space-y-8">
          <p className="text-xs font-medium uppercase tracking-[0.24em] text-primary">{isMobile ? "Your sound, everywhere." : "Private audio library"}</p>
          <h1 className="font-heading max-w-3xl text-5xl -ms-1 font-semibold leading-[0.98] tracking-[-0.04em] sm:text-7xl">
            Keep listening. Keep your space.
          </h1>
          <p className="max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
            Sonetopia is a quiet home for the audio you already own. Upload once, then listen from
            any browser without filling your phone with copies.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            {primaryButton}
          </div>
        </div>

        <div className="relative overflow-hidden rounded-[2rem] bg-foreground p-6 text-background sm:p-8">
          <div className="absolute inset-x-0 top-0 h-1 bg-primary" />
          <div className="flex min-h-72 flex-col justify-between gap-10">
            <div className="flex items-center justify-between text-xs text-background/60">
              <span>NOW PLAYING</span>
              <span>01 / 03</span>
            </div>
            <div className="space-y-5">
              <div className="flex h-20 items-end gap-1.5" aria-hidden="true">
                {[35, 54, 42, 72, 48, 86, 60, 35, 67, 46, 78, 52, 40, 62, 30, 74, 48, 58].map(
                  (height, index) => (
                    <span key={index} className="w-full rounded-full bg-primary" style={{ height: `${height}%` }} />
                  ),
                )}
              </div>
              <div>
                <p className="text-2xl font-medium tracking-tight">A room of your own</p>
                <p className="mt-1 text-sm text-background/60">Your library, wherever you are</p>
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-background/15 pt-4 text-sm text-background/60">
              <span>{activeSoundEffect?.title ?? "Sonetopia"}</span>
              <div className="flex items-center gap-3">
                {isSoundEffectPlaying && (
                  <button
                    type="button"
                    className="cursor-default text-background/60 transition-colors hover:text-background"
                    aria-label="Skip audio"
                    onClick={playRandomSoundEffect}
                  >
                    <SkipForward className="size-4 fill-current" />
                  </button>
                )}
                <button
                  type="button"
                  className="cursor-default text-primary"
                  aria-label={isSoundEffectPlaying ? "Pause audio" : "Play a random audio"}
                  onClick={handlePlayButtonClick}
                >
                  {isSoundEffectPlaying ? (
                    <Pause className="size-4 fill-current" />
                  ) : (
                    <Play className="size-4 fill-current" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-12 border-b py-20 lg:grid-cols-[0.7fr_1.3fr]">
        <div className="space-y-3">
          <p className="text-xs font-medium uppercase tracking-[0.24em] text-primary">Why Sonetopia</p>
          <h2 className="font-heading max-w-xs text-3xl font-semibold leading-tight tracking-[-0.03em]">
            Made for listening, not scrolling.
          </h2>
        </div>
        <div className="grid gap-x-10 gap-y-6 sm:grid-cols-2">
          {FEATURES.map((feature) => (
            <div key={feature.title} className="space-y-3 border-t pt-4">
              <div className="flex items-center gap-3">
                <feature.icon className="size-5 text-primary" />
                <h3 className="font-medium">{feature.title}</h3>
              </div>
              <p className="text-sm leading-6 text-muted-foreground">{feature.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="how-it-works" className="scroll-mt-20 border-b pt-20 pb-10">
        <div className="mb-10 flex items-end justify-between gap-6">
          <div className="space-y-3">
            <p className="text-xs font-medium uppercase tracking-[0.24em] text-primary">A simple ritual</p>
            <h2 className="font-heading text-3xl font-semibold tracking-[-0.03em]">From file to favorite.</h2>
          </div>
          <span className="hidden text-sm text-muted-foreground sm:block">Three steps, then just listening.</span>
        </div>
        <div className="grid gap-8 sm:grid-cols-3">
          {STEPS.map((step) => (
            <div key={step.title} className="space-y-4 border-t pt-8">
              <div className="flex items-center justify-between">
                <step.icon className="size-5 text-primary" />
                <span className="font-mono text-xs text-muted-foreground">0{STEPS.indexOf(step) + 1}</span>
              </div>
              <p className="font-medium">{step.title.replace(/^\d+\. /, "")}</p>
              <p className="text-sm leading-6 text-muted-foreground">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-10 py-20 lg:grid-cols-2">
        <div className="space-y-4">
          <h2 className="font-heading text-2xl font-semibold tracking-[-0.02em]">Yours, by design.</h2>
          <ul className="space-y-3">
            {IS_LIST.map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm">
                <CircleCheck className="mt-0.5 size-4 shrink-0 text-primary" />
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="space-y-4 lg:border-l lg:pl-10">
          <h2 className="font-heading text-2xl font-semibold tracking-[-0.02em] text-muted-foreground">Nothing else.</h2>
          <ul className="space-y-3">
            {IS_NOT_LIST.map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm text-muted-foreground">
                <X className="mt-0.5 size-4 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="flex flex-col gap-6 items-center border-t pt-12 sm:flex-row sm:justify-between">
        <div className="space-y-2">
          <h2 className="font-heading text-3xl font-semibold tracking-[-0.03em]">Bring your sound with you.</h2>
          <p className="max-w-lg text-sm leading-6 text-muted-foreground">A private library, and more room on your device.</p>
        </div>
        {primaryButton}
      </section>
    </div>
  )
}
