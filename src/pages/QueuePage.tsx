import { Link } from "react-router-dom"
import { ListMusic, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/shared"
import { TrackList } from "@/components/track/TrackList"
import { QueueTrackActions } from "@/components/queue/QueueTrackActions"
import { usePlayer } from "@/components/player/PlayerProvider"
import { formatTotalDuration } from "@/lib/library"

export function QueuePage() {
  const { queue, current, currentIndex, jumpTo, clearQueue } = usePlayer()

  return (
    <div className="space-y-5">
      <PageHeader
        title="Queue"
        description="What plays next, in order. Drag-free reordering with the row menu."
      >
        {queue.length > 0 ? (
          <Button variant="outline" onClick={clearQueue}>
            <X />
            Clear queue
          </Button>
        ) : null}
      </PageHeader>

      {current ? (
        <p className="flex flex-wrap items-center gap-2 rounded-xl border bg-card p-3 text-sm">
          <span className="text-xs font-medium text-muted-foreground">Now playing</span>
          <span className="min-w-0 flex-1 truncate font-medium text-primary">{current.title}</span>
          <span className="text-xs text-muted-foreground">{current.artist}</span>
        </p>
      ) : null}

      <TrackList
        tracks={queue}
        onPlay={(_, index) => jumpTo(index)}
        showTags={false}
        emptyTitle="Your queue is empty"
        emptyDescription="Pick something from your library or a playlist to start listening."
        emptyAction={
          <Button variant="outline" render={<Link to="/library" />}>
            <ListMusic />
            Browse audio
          </Button>
        }
        rowActions={(_, index) => (
          <QueueTrackActions index={index} isLast={index === queue.length - 1} />
        )}
      />

      {queue.length > 0 ? (
        <p className="text-xs text-muted-foreground">
          {queue.length} tracks · {formatTotalDuration(queue)} total · position {currentIndex + 1}
        </p>
      ) : null}
    </div>
  )
}