import type { ReactNode } from "react"
import { Link } from "react-router-dom"
import { cn } from "cn"
import { AudioLines, Pause, Play, type LucideIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { AUDIO_KINDS, type AudioKind, type Track } from "@/lib/library"
import { useCoverUrl } from "@/lib/covers"
import { useIsMobile } from "@/hooks/use-mobile"

export function Brand({
  subtitle = "Your sound, everywhere.",
  className,
}: {
  subtitle?: string
  className?: string
}) {
  return (
    <Link to="/" className={cn("flex items-center gap-2", className)}>
      <span className="grid size-8 shrink-0 place-items-center rounded-lg text-primary-foreground">
        <img src="/logo-orange-small.png" alt="Sonetopia" className="size-7" />
      </span>
      <span className="leading-tight">
        <span className="block font-heading text-sm font-semibold">Sonetopia</span>
        {!useIsMobile() && (
          <span className="block text-[11px] text-muted-foreground">{subtitle}</span>
        )}
      </span>
    </Link>
  )
}

export function AudioCover({ track, className }: { track: Track; className?: string }) {
  const meta = AUDIO_KINDS[track.kind]
  const Icon = meta.icon
  const coverUrl = useCoverUrl(track)

  if (coverUrl) {
    return (
      <img
        src={coverUrl}
        alt=""
        className={cn("size-10 shrink-0 rounded-md object-cover", className)}
      />
    )
  }

  return (
    <div
      aria-hidden
      className={cn(
        "grid size-10 shrink-0 place-items-center rounded-md bg-linear-to-br",
        meta.cover,
        className
      )}
    >
      <Icon className="size-4" />
    </div>
  )
}

/** Cover with a hover/focus play-pause overlay. */
export function CoverPlayButton({
  track,
  playing = false,
  onToggle,
  className,
}: {
  track: Track
  playing?: boolean
  onToggle: () => void
  className?: string
}) {
  return (
    <div className={cn("group/cover relative size-10 shrink-0", className)}>
      <AudioCover track={track} className="size-full" />
      <button
        type="button"
        onClick={onToggle}
        aria-label={playing ? `Pause ${track.title}` : `Play ${track.title}`}
        className="absolute inset-0 grid cursor-pointer place-items-center rounded-md bg-black/0 text-white transition-colors hover:bg-black/45 focus-visible:bg-black/45 focus-visible:outline-none"
      >
        <span className="grid place-items-center opacity-0 transition-opacity group-hover/cover:opacity-100 group-focus-within/cover:opacity-100">
          {playing ? <Pause className="size-5" /> : <Play className="size-5" />}
        </span>
      </button>
    </div>
  )
}

export function KindBadge({ kind, className }: { kind: AudioKind; className?: string }) {
  const meta = AUDIO_KINDS[kind]
  const Icon = meta.icon

  return (
    <Badge variant="secondary" className={cn("gap-1 font-normal", className)}>
      <Icon />
      {meta.label}
    </Badge>
  )
}

export function PageHeader({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children?: ReactNode
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-3">
      <div className="space-y-1">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">{title}</h1>
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {children ? <div className="flex flex-wrap items-center gap-2">{children}</div> : null}
    </header>
  )
}

export function SectionHeader({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children?: ReactNode
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-2">
      <div className="space-y-0.5">
        <h2 className="font-heading text-lg font-semibold tracking-tight">{title}</h2>
        {description ? <p className="text-xs text-muted-foreground">{description}</p> : null}
      </div>
      {children ? <div className="flex items-center gap-2">{children}</div> : null}
    </div>
  )
}

export function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon
  label: string
  value: string
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border bg-card p-3">
      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-accent text-accent-foreground">
        <Icon className="size-4" />
      </span>
      <div className="leading-tight">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{value}</p>
      </div>
    </div>
  )
}

export function EmptyState({
  icon: Icon = AudioLines,
  title,
  description,
  action,
}: {
  icon?: LucideIcon
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed px-6 py-12 text-center">
      <span className="grid size-10 place-items-center rounded-full bg-muted text-muted-foreground">
        <Icon className="size-5" />
      </span>
      <div className="space-y-1">
        <p className="text-sm font-medium">{title}</p>
        {description ? (
          <p className="mx-auto max-w-sm text-xs text-muted-foreground mt-3 mb-1">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  )
}
