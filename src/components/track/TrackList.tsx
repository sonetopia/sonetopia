import type { ReactNode } from "react"
import { cn } from "cn"
import { AudioLines } from "lucide-react"
import { CoverPlayButton, EmptyState, KindBadge } from "@/components/shared"
import { usePlayer } from "@/components/player/PlayerProvider"
import { formatDuration, type Track } from "@/lib/library"

type TrackListProps = {
  tracks: Track[]
  onPlay: (track: Track, index: number) => void
  /** When provided, artist and album names become buttons that search for them. */
  onSearch?: (value: string) => void
  rowActions?: (track: Track, index: number) => ReactNode
  showTags?: boolean
  emptyTitle?: string
  emptyDescription?: string
  emptyAction?: ReactNode
  className?: string
}

/** Artist / album text: a search shortcut when the list is searchable. */
function MetaValue({ value, onSearch }: { value: string; onSearch?: (value: string) => void }) {
  if (!onSearch) return <span className="min-w-0 truncate">{value}</span>
  return (
    <button
      type="button"
      onClick={() => onSearch(value)}
      title={`Search ${value}`}
      className="min-w-0 cursor-pointer truncate hover:text-foreground hover:underline focus-visible:text-foreground focus-visible:underline"
    >
      {value}
    </button>
  )
}

export function TrackList({
  tracks,
  onPlay,
  onSearch,
  rowActions,
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
    <ul className={cn("flex flex-col gap-1", className)}>
      {tracks.map((track, index) => {
        const active = current?.id === track.id
        const playing = active && isPlaying
        return (
          <li
            key={`${track.id}-${index}`}
            className={cn(
              "group flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-accent/50 sm:gap-3",
              active && "bg-accent/70 hover:bg-accent/70"
            )}
          >
            <CoverPlayButton
              track={track}
              playing={playing}
              onToggle={() => (active ? toggle() : onPlay(track, index))}
              className="size-9"
            />
            <div className="min-w-0 flex-1">
              <div className="flex min-w-0 flex-col gap-[2px]">
                <button
                  type="button"
                  onClick={() => (active ? toggle() : onPlay(track, index))}
                  title={playing ? `Pause ${track.title}` : `Play ${track.title}`}
                  className={cn(
                    "block w-full min-w-0 cursor-pointer truncate text-left text-sm font-medium hover:underline focus-visible:underline",
                    active && "text-primary"
                  )}
                >
                  {track.title}
                </button>
                <p className="flex min-w-0 items-center gap-1 truncate text-xs text-muted-foreground">
                  {track.artist ? (
                    <MetaValue value={track.artist} onSearch={onSearch} />
                  ) : (
                    <span className="min-w-0 truncate">Unknown artist</span>
                  )}
                  {track.album ? (
                    <>
                      <span aria-hidden="true" className="shrink-0">
                        ·
                      </span>
                      <MetaValue value={track.album} onSearch={onSearch} />
                    </>
                  ) : null}
                </p>
              </div>
            </div>
            {showTags && track.tags[0] ? (
              <span className="hidden text-xs text-muted-foreground lg:inline">
                #{track.tags[0]}
              </span>
            ) : null}
            <KindBadge kind={track.kind} className="hidden sm:inline-flex" />
            <span className="w-14 text-right text-xs tabular-nums text-muted-foreground">
              {formatDuration(track.duration)}
            </span>
            {rowActions ? <div className="flex items-center">{rowActions(track, index)}</div> : null}
          </li>
        )
      })}
    </ul>
  )
}