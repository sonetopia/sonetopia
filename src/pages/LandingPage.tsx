import { Link } from "react-router-dom"
import {
  ArrowRight,
  AudioLines,
  CircleCheck,
  HardDrive,
  HardDriveUpload,
  Headphones,
  ListMusic,
  Play,
  ShieldCheck,
  Smartphone,
  X,
  type LucideIcon,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/lib/auth"

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
    icon: Headphones,
    title: "Keeps playing in the background",
    body: "One player across the whole app. Leave the page, lock the screen, and playback continues with lock-screen controls.",
  },
  {
    icon: ListMusic,
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
    icon: Play,
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

export function LandingPage() {
  const { user } = useAuth()
  const primaryTo = user ? "/dashboard" : "/register"
  const primaryLabel = user ? "Open your library" : "Create your library"

  return (
    <div className="mx-auto w-full max-w-6xl space-y-20 px-4 py-12 sm:py-16">
      <section className="flex flex-col items-center gap-6 text-center">
        <Badge variant="secondary">Private audio library</Badge>
        <h1 className="font-heading max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">
          Your audio, everywhere — without eating your storage.
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
          Sonetopia is your own audio library in the browser. Built for phones that never shipped an
          audio player, iPhone included, and for Android users who would rather stream their library
          than keep gigabytes of offline files on the device.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button size="lg" render={<Link to={primaryTo} />}>
            {primaryLabel}
            <ArrowRight />
          </Button>
          {user ? null : (
            <Button size="lg" variant="outline" render={<Link to="/login" />}>
              Sign in
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          No feed. No other people's uploads. Just your audio.
        </p>
      </section>

      <section className="space-y-6">
        <div className="space-y-2 text-center">
          <h2 className="font-heading text-2xl font-semibold tracking-tight">
            Why people use Sonetopia
          </h2>
          <p className="text-sm text-muted-foreground">
            Not a competitor to streaming services — a home for the audio you already have.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <Card key={feature.title} size="sm">
              <CardHeader>
                <span className="grid size-9 place-items-center rounded-lg bg-accent text-accent-foreground">
                  <feature.icon className="size-4" />
                </span>
                <CardTitle>{feature.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">{feature.body}</CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section id="how-it-works" className="scroll-mt-20 space-y-6">
        <div className="space-y-2 text-center">
          <h2 className="font-heading text-2xl font-semibold tracking-tight">How it works</h2>
          <p className="text-sm text-muted-foreground">Three steps, then just listening.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {STEPS.map((step) => (
            <div key={step.title} className="space-y-2 rounded-xl border bg-card p-5">
              <span className="grid size-9 place-items-center rounded-lg bg-primary/12 text-primary">
                <step.icon className="size-4" />
              </span>
              <p className="font-medium">{step.title}</p>
              <p className="text-sm text-muted-foreground">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-6 rounded-2xl border bg-card p-6 sm:p-10 lg:grid-cols-2">
        <div className="space-y-3">
          <h2 className="font-heading text-xl font-semibold">What Sonetopia is</h2>
          <ul className="space-y-2">
            {IS_LIST.map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm">
                <CircleCheck className="mt-0.5 size-4 shrink-0 text-primary" />
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="space-y-3">
          <h2 className="font-heading text-xl font-semibold">What it is not</h2>
          <ul className="space-y-2">
            {IS_NOT_LIST.map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                <X className="mt-0.5 size-4 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="flex flex-col items-center gap-4 rounded-2xl bg-accent/60 p-8 text-center sm:p-12">
        <h2 className="font-heading text-2xl font-semibold tracking-tight">
          Start your private library today
        </h2>
        <p className="max-w-xl text-sm text-muted-foreground">
          Bring your files, build playlists, and listen from any browser — with a real queue,
          shuffle, repeat, and background playback.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button size="lg" render={<Link to={primaryTo} />}>
            {primaryLabel}
            <ArrowRight />
          </Button>
          <Button size="lg" variant="outline" render={<a href="#how-it-works" />}>
            See how it works
          </Button>
        </div>
      </section>
    </div>
  )
}