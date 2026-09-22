import type { ReactNode } from "react"
import { cn } from "cn"
import { AudioLines, Pause, Play } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AudioCover, EmptyState, KindBadge } from "@/components/shared"
import { usePlayer } from "@/components/player/PlayerProvider"
import { formatDate, formatDuration, type Track } from "@/lib/library"

type TrackListProps = {
  tracks: Track[]
  onPlay: (track: Track, index: number) => void
  rowActions?: (track: Track, index: number) => ReactNode
  showAddedAt?: boolean
  showTags?: boolean
  emptyTitle?: string
  emptyDescription?: string
  emptyAction?: ReactNode
  className?: string
}

export function TrackList({
  tracks,
  onPlay,
  rowActions,
  showAddedAt = false,
  showTags = true,
  emptyTitle = "Nothing here yet",
  emptyDescription,
  emptyAction,
  className,
}: TrackListProps) {
  const { current, isPlaying, toggle } = usePlayer()

  if (tracks.length === 0) {
    return (
      <EmptyState
        icon={AudioLines}
        title={emptyTitle}
        description={emptyDescription}
        action={emptyAction}
      />
    )
  }

  return (
    <ul className={cn("flex flex-col gap-0.5", className)}>
      {tracks.map((track, index) => {
        const active = current?.id === track.id
        return (
          <li
            key={`${track.id}-${index}`}
            className={cn(
              "group flex items-center gap-2 rounded-xl px-2 py-1.5 transition-colors hover:bg-accent/50 sm:gap-3",
              active && "bg-accent/70 hover:bg-accent/70"
            )}
          >
            <Button
              variant="ghost"
              size="icon-sm"
              className="text-muted-foreground"
              aria-label={active && isPlaying ? `Pause ${track.title}` : `Play ${track.title}`}
              onClick={() => (active ? toggle() : onPlay(track, index))}
            >
              {active && isPlaying ? <Pause /> : <Play />}
            </Button>
            <AudioCover track={track} className="size-9" />
            <div className="min-w-0 flex-1">
              <p className={cn("truncate text-sm font-medium", active && "text-primary")}>
                {track.title}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {track.artist}
                {showAddedAt ? ` · ${formatDate(track.addedAt)}` : ""}
              </p>
            </div>
            {showTags && track.tags[0] ? (
              <span className="hidden text-xs text-muted-foreground lg:inline">
                #{track.tags[0]}
              </span>
            ) : null}
            <KindBadge kind={track.kind} className="hidden sm:inline-flex" />
            <span className="w-12 text-right text-xs tabular-nums text-muted-foreground">
              {formatDuration(track.duration)}
            </span>
            {rowActions ? <div className="flex items-center">{rowActions(track, index)}</div> : null}
          </li>
        )
      })}
    </ul>
  )
}