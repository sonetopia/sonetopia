import { useEffect, useRef, useState } from "react"
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
    clearQueue,
  } = usePlayer()
  const [scrub, setScrub] = useState<number | null>(null)
  const activeRef = useRef<HTMLLIElement>(null)

  useEffect(() => {
    if (!open) return
    const frame = requestAnimationFrame(() => {
      activeRef.current?.scrollIntoView({ block: "nearest" })
    })
    return () => cancelAnimationFrame(frame)
  }, [open, currentIndex])

  if (!current) return null

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
            <ul className="scrollbar-thin min-h-0 flex-1 overflow-y-auto px-2 pb-3">
              {queue.length === 0 ? (
                <li className="px-2 py-8 text-center text-xs text-muted-foreground">
                  Nothing queued yet. Add tracks from your library or a playlist.
                </li>
              ) : (
                queue.map((track, index) => {
                  const active = index === currentIndex
                  const play = () => (active ? toggle() : jumpTo(index))
                  return (
                    <li
                      key={`${track.id}-${index}`}
                      ref={active ? activeRef : undefined}
                      aria-current={active ? "true" : undefined}
                      className={cn(
                        "flex items-center gap-2 rounded-lg p-2 pr-0.5 hover:bg-accent/60",
                        active && "bg-accent/60"
                      )}
                    >
                      <CoverPlayButton
                        track={track}
                        playing={active && isPlaying}
                        onToggle={play}
                        className="size-10"
                      />
                      <div className="min-w-0 flex-1">
                        <p className={cn("truncate text-sm mb-[0.075rem]", active && "font-medium text-primary")}>
                          {track.title}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {active ? (isPlaying ? "Playing · " : "Paused · ") : null}
                          {track.artist}
                        </p>
                      </div>
                      <span className="text-xs tabular-nums text-muted-foreground">
                        {formatDuration(track.duration)}
                      </span>
                      <QueueTrackActions index={index} isLast={index === queue.length - 1} />
                    </li>
                  )
                })
              )}
            </ul>
          </aside>
        </div>
      </DialogContent>
    </Dialog>
  )
}