import { useEffect, useRef, useState, type DragEvent } from "react"
import { cn } from "cn"
import {
  ChevronDown,
  Pause,
  Play,
  Repeat,
  Repeat1,
  Shuffle,
  SkipBack,
  SkipForward,
  X,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { Slider } from "@/components/ui/slider"
import { SeekSlider } from "@/components/player/SeekSlider"
import { AudioCover, CoverPlayButton } from "@/components/shared"
import { QueueTrackActions } from "@/components/queue/QueueTrackActions"
import { usePlayer } from "@/components/player/PlayerProvider"
import { AUDIO_KINDS, formatDuration } from "@/lib/library"
import type { RepeatMode } from "@/lib/playback"

const REPEAT_LABEL: Record<RepeatMode, string> = {
  off: "off",
  all: "all tracks",
  one: "this track",
}

const timeLabel = (seconds: number) => (seconds > 0 ? formatDuration(seconds) : "0:00")
const QUEUE_ROW_HEIGHT = 60
const QUEUE_OVERSCAN = 6

type NowPlayingViewProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function NowPlayingView({ open, onOpenChange }: NowPlayingViewProps) {
  const {
    current,
    currentIndex,
    isPlaying,
    position,
    duration,
    volume,
    repeat,
    shuffle,
    queue,
    toggle,
    next,
    previous,
    seek,
    setVolume,
    toggleShuffle,
    cycleRepeat,
    jumpTo,
    reorderQueue,
    clearQueue,
  } = usePlayer()
  const [scrub, setScrub] = useState<number | null>(null)
  const queueRef = useRef<HTMLUListElement>(null)
  const [queueScrollTop, setQueueScrollTop] = useState(0)
  const [queueViewportHeight, setQueueViewportHeight] = useState(480)
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null)
  const [dropIndex, setDropIndex] = useState<number | null>(null)

  useEffect(() => {
    if (!open) return
    const list = queueRef.current
    if (!list) return

    const frame = requestAnimationFrame(() => {
      setQueueViewportHeight(list.clientHeight)
      if (currentIndex < 0) return
      const target = currentIndex * QUEUE_ROW_HEIGHT - list.clientHeight / 2 + QUEUE_ROW_HEIGHT / 2
      list.scrollTop = Math.max(0, target)
      setQueueScrollTop(list.scrollTop)
    })
    const observer = new ResizeObserver(() => setQueueViewportHeight(list.clientHeight))
    observer.observe(list)

    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
    }
  }, [open, currentIndex])

  if (!current) return null

  const firstVisible = Math.floor(queueScrollTop / QUEUE_ROW_HEIGHT)
  const queueStart = Math.min(queue.length, Math.max(0, firstVisible - QUEUE_OVERSCAN))
  const queueEnd = Math.min(
    queue.length,
    queueStart + Math.ceil(queueViewportHeight / QUEUE_ROW_HEIGHT) + QUEUE_OVERSCAN * 2
  )
  const visibleQueue = queue.slice(queueStart, queueEnd)

  function handleDragStart(event: DragEvent<HTMLDivElement>, index: number) {
    setDraggingIndex(index)
    setDropIndex(index)
    event.dataTransfer.effectAllowed = "move"
    event.dataTransfer.setData("text/plain", String(index))
  }

  function handleDragOver(event: DragEvent<HTMLLIElement>, index: number) {
    if (draggingIndex === null) return
    event.preventDefault()
    event.dataTransfer.dropEffect = "move"
    if (dropIndex !== index) setDropIndex(index)
  }

  function handleDrop(event: DragEvent<HTMLLIElement>, index: number) {
    event.preventDefault()
    if (draggingIndex !== null) reorderQueue(draggingIndex, index)
    setDraggingIndex(null)
    setDropIndex(null)
  }

  function handleDragEnd() {
    setDraggingIndex(null)
    setDropIndex(null)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="flex !h-[calc(100svh-1rem)] !w-[calc(100vw-1rem)] !max-w-none flex-col gap-0 overflow-hidden p-0"
      >
        <DialogTitle className="sr-only">Now playing</DialogTitle>
        <DialogDescription className="sr-only">
          Full player with playback controls and the upcoming queue.
        </DialogDescription>

        <div className="flex shrink-0 items-center justify-between gap-3 border-b px-4 py-2.5">
          <div className="flex min-w-0 items-center gap-2">
            <Badge variant="secondary">{AUDIO_KINDS[current.kind].label}</Badge>
            <span className="truncate text-xs text-muted-foreground">
              {queue.length > 0 ? `${currentIndex + 1} of ${queue.length} in queue` : "Single track"}
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Close full player"
            onClick={() => onOpenChange(false)}
          >
            <ChevronDown />
          </Button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
          <section className="flex shrink-0 flex-col items-center justify-center gap-3 bg-linear-to-b from-accent/60 to-transparent p-4 text-center sm:gap-4 sm:p-6 lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
            <AudioCover
              track={current}
              className="size-24 shrink-0 rounded-2xl sm:size-36 lg:size-44"
            />

            <div className="w-full max-w-lg space-y-1">
              <h2 className="font-heading truncate text-lg font-semibold sm:text-xl">
                {current.title}
              </h2>
              <p className="truncate text-sm text-muted-foreground">{current.artist}</p>
            </div>

            <div className="w-full max-w-lg space-y-1.5">
              <SeekSlider
                className="w-full"
                aria-label="Playback position"
                max={duration}
                value={scrub ?? position}
                onValueChange={(next) => {
                  setScrub(next)
                  seek(next)
                }}
                onValueCommitted={() => setScrub(null)}
              />
              <div className="flex justify-between text-[11px] tabular-nums text-muted-foreground">
                <span>{timeLabel(scrub ?? position)}</span>
                <span>{timeLabel(duration)}</span>
              </div>
            </div>

            <div className="flex items-center gap-1 sm:gap-2">
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Shuffle"
                aria-pressed={shuffle}
                className={cn(shuffle && "text-primary aria-pressed:hover:text-primary")}
                onClick={toggleShuffle}
              >
                <Shuffle className="size-5" />
              </Button>
              <Button variant="ghost" size="icon" aria-label="Previous track" onClick={previous}>
                <SkipBack className="size-5" />
              </Button>
              <Button
                size="icon-lg"
                className="rounded-full p-5"
                aria-label={isPlaying ? "Pause" : "Play"}
                onClick={toggle}
              >
                {isPlaying ? <Pause className="size-6" /> : <Play className="size-6" />}
              </Button>
              <Button variant="ghost" size="icon" aria-label="Next track" onClick={next}>
                <SkipForward className="size-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Repeat: ${REPEAT_LABEL[repeat]}`}
                aria-pressed={repeat !== "off"}
                className={cn(repeat !== "off" && "text-primary aria-pressed:hover:text-primary")}
                onClick={cycleRepeat}
              >
                {repeat === "one" ? <Repeat1 className="size-5" /> : <Repeat className="size-5" />}
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Slider
                className="w-40"
                aria-label="Volume"
                min={0}
                max={100}
                step={1}
                value={Math.round(volume * 100)}
                onValueChange={(value) => setVolume((value as number) / 100)}
              />
            </div>
          </section>

          <aside className="flex min-h-0 flex-1 flex-col border-t lg:w-96 lg:flex-none lg:border-t-0 lg:border-l">
            <div className="flex shrink-0 items-center justify-between gap-2 px-4 py-3">
              <div>
                <p className="text-sm font-medium">Queue</p>
                <p className="text-xs text-muted-foreground">
                  {queue.length} track{queue.length === 1 ? "" : "s"} · position {currentIndex + 1}
                </p>
              </div>
              {queue.length > 0 ? (
                <Button variant="ghost" size="xs" onClick={clearQueue}>
                  <X />
                  Clear
                </Button>
              ) : null}
            </div>
            <ul
              ref={queueRef}
              onScroll={(event) => setQueueScrollTop(event.currentTarget.scrollTop)}
              className="scrollbar-thin min-h-0 flex-1 overflow-y-auto px-2 pb-3"
            >
              {queue.length === 0 ? (
                <li className="px-2 py-8 text-center text-xs text-muted-foreground">
                  Nothing queued yet. Add tracks from your library or a playlist.
                </li>
              ) : (
                <>
                  {queueStart > 0 ? (
                    <li aria-hidden style={{ height: queueStart * QUEUE_ROW_HEIGHT }} />
                  ) : null}
                  {visibleQueue.map((track, offset) => {
                    const index = queueStart + offset
                    const active = index === currentIndex
                    const play = () => (active ? toggle() : jumpTo(index))
                    return (
                      <li
                        key={`${track.id}-${index}`}
                        aria-current={active ? "true" : undefined}
                        onDragOver={(event) => handleDragOver(event, index)}
                        onDrop={(event) => handleDrop(event, index)}
                        style={{ height: QUEUE_ROW_HEIGHT }}
                        className={cn(
                          "flex items-center gap-2 rounded-lg p-2 pr-0.5 hover:bg-accent/60",
                          active && "bg-accent/60",
                          draggingIndex === index && "opacity-50",
                          dropIndex === index && draggingIndex !== index && "ring-2 ring-primary/40"
                        )}
                      >
                        <CoverPlayButton
                          track={track}
                          playing={active && isPlaying}
                          onToggle={play}
                          className="size-10"
                        />
                        <div
                          draggable
                          onDragStart={(event) => handleDragStart(event, index)}
                          onDragEnd={handleDragEnd}
                          title="Drag to reorder"
                          className="flex min-w-0 flex-1 cursor-grab select-none items-center gap-2 active:cursor-grabbing"
                        >
                          <div className="min-w-0 flex-1 flex flex-col gap-0.25 overflow-hidden">
                            <p className={cn("truncate text-sm", active && "font-medium text-primary")}>
                              {track.title}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">
                              {active ? (isPlaying ? "Playing \u00b7 " : "Paused \u00b7 ") : null}
                              {track.artist}
                            </p>
                          </div>
                          <span className="text-xs tabular-nums text-muted-foreground">
                            {formatDuration(track.duration)}
                          </span>
                        </div>
                        <QueueTrackActions index={index} isLast={index === queue.length - 1} />
                      </li>
                    )
                  })}
                  {queueEnd < queue.length ? (
                    <li aria-hidden style={{ height: (queue.length - queueEnd) * QUEUE_ROW_HEIGHT }} />
                  ) : null}
                </>
              )}
            </ul>
          </aside>
        </div>
      </DialogContent>
    </Dialog>
  )
}
