import { Link } from "react-router-dom"
import { Compass } from "lucide-react"
import { Button } from "@/components/ui/button"

const STARFIELD = Array.from({ length: 64 }, (_, index) => ({
  top: `${(index * 53 + 7) % 100}%`,
  left: `${(index * 37 + 13) % 100}%`,
  size: index % 9 === 0 ? 3 : index % 4 === 0 ? 2 : 1,
  opacity: 0.25 + ((index * 17) % 55) / 100,
  drift: index % 7 === 0,
  delay: `${-((index * 1.3) % 16)}s`,
}))

const SHOOTING_STARS = [
  { top: "14%", left: "10%", width: 150, delay: "-5.2s", duration: "6s" },
  { top: "42%", left: "58%", width: 110, delay: "-5.2s", duration: "7s" },
  { top: "72%", left: "28%", width: 180, delay: "-5s", duration: "8s" },
]

export function NotFoundPage() {
  return (
    <main className="dark relative isolate grid min-h-svh place-items-center overflow-hidden bg-background px-4 py-10 text-foreground">
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        {STARFIELD.map((star, index) => (
          <span
            key={index}
            className={`not-found-dot${star.drift ? " not-found-dot--drift" : ""}`}
            style={{
              top: star.top,
              left: star.left,
              width: star.size,
              height: star.size,
              opacity: star.opacity,
              animationDelay: star.drift ? star.delay : undefined,
              boxShadow: star.size > 1 ? "0 0 4px rgb(255 255 255 / 45%)" : undefined,
            }}
          />
        ))}
      </div>

      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        {SHOOTING_STARS.map((star, index) => (
          <span
            key={index}
            className="not-found-shooting-star absolute"
            style={{
              top: star.top,
              left: star.left,
              width: star.width,
              animationDelay: star.delay,
              animationDuration: star.duration,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 flex w-full max-w-sm flex-col items-center text-center">
        <span className="grid size-14 place-items-center rounded-full border border-primary/20 bg-primary/10 text-primary">
          <Compass className="size-7" strokeWidth={1.5} />
        </span>
        <p className="mt-5 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
          YOU ARE IN THE
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Middle of nowhere</h1>
        <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted-foreground">
          This link does not exist in Sonetopia.
        </p>
        <Button variant="outline" className="mt-5" render={<Link to="/" />}>
          Back to home
        </Button>
      </div>
    </main>
  )
}
