import { CircleCheck } from "lucide-react"
import { AuthForm } from "@/components/auth/AuthForm"

const BENEFITS = [
  "Unlimited playlists and a real playback queue",
  "Background playback with lock-screen controls",
  "Shuffle, repeat, and per-type filtering",
  "Audio files of any kind, not just music",
]

export function RegisterPage() {
  return (
    <div className="mx-auto grid w-full max-w-5xl gap-10 px-4 py-12 sm:py-20 lg:grid-cols-2 lg:items-center">
      <div className="order-2 space-y-5 lg:order-1">
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          A library for the audio you already own
        </h1>
        <p className="text-sm text-muted-foreground">
          Sonetopia does not sell music and does not host other people's catalogues. It gives your
          own files a proper player — on phones that lack one, and on devices where storage is
          tight.
        </p>
        <ul className="space-y-2">
          {BENEFITS.map((benefit) => (
            <li key={benefit} className="flex items-start gap-2 text-sm">
              <CircleCheck className="mt-0.5 size-4 shrink-0 text-primary" />
              {benefit}
            </li>
          ))}
        </ul>
      </div>
      <div className="order-1 flex justify-center lg:order-2">
        <AuthForm mode="sign-up" />
      </div>
    </div>
  )
}