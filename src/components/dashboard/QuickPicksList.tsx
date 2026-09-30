import type { ReactNode } from "react"
import { cn } from "cn"
import { CoverPlayButton, EmptyState } from "@/components/shared"
import { TrackActions } from "@/components/track/TrackActions"
import { usePlayer } from "@/components/player/PlayerProvider"
import type { Track } from "@/lib/library"

type QuickPicksListProps = {
  tracks: Track[]
  emptyAction?: ReactNode
}

/** Compact pick tiles: play button, cover, title + artist, and the track menu. */
export function QuickPicksList({ tracks, emptyAction }: QuickPicksListProps) {
  const { current, isPlaying, toggle, playTracks } = usePlayer()

  if (tracks.length === 0) {
    return (
      <EmptyState
        title="Your library is empty"
        description="Upload your first audio file to get started."
        action={emptyAction}
      />
    )
  }

  return (
    <div className="grid grid-cols-1 gap-1 sm:grid-cols-2 lg:grid-cols-3">
      {tracks.map((track, index) => {
        const active = current?.id === track.id
        return (
          <div
            key={track.id}
            className={cn(
              "flex min-w-0 items-center gap-2 rounded-lg p-1.5 pr-1",
              active && "border-primary/40 bg-accent/60"
            )}
          >
            <CoverPlayButton
              track={track}
              playing={active && isPlaying}
              onToggle={() => (active ? toggle() : playTracks(tracks, index))}
            />
            <div className="min-w-0 flex-1">
              <p
                className={cn("truncate text-sm font-medium", active && "text-primary")}
                title={track.title}
              >
                {track.title}
              </p>
              <p className="truncate text-xs text-muted-foreground">{track.artist}</p>
            </div>
            <TrackActions track={track} />
          </div>
        )
      })}
    </div>
  )
}