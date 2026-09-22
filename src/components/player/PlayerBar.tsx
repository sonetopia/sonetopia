import { useState } from "react"
import { cn } from "cn"
import {
  Maximize2,
  Pause,
  Play,
  Repeat,
  Repeat1,
  Shuffle,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { AudioCover } from "@/components/shared"
import { NowPlayingView } from "@/components/player/NowPlayingView"
import { usePlayer } from "@/components/player/PlayerProvider"
import type { RepeatMode } from "@/lib/playback"

const REPEAT_LABEL: Record<RepeatMode, string> = {
  off: "off",
  all: "all tracks",
  one: "this track",
}

export function PlayerBar() {
  const {
    current,
    isPlaying,
    position,
    duration,
    volume,
    repeat,
    shuffle,
    toggle,
    next,
    previous,
    seek,
    setVolume,
    toggleShuffle,
    cycleRepeat,
  } = usePlayer()
  const [scrub, setScrub] = useState<number | null>(null)
  const [expanded, setExpanded] = useState(false)

  // the controller only exists while something is loaded
  if (!current) return null

  return (
    <>
      <div className="fixed inset-x-0 bottom-0 z-40 bg-card/95 shadow-[0_-1px_0_0_var(--color-border),0_-10px_30px_-18px_rgb(0_0_0/0.45)] backdrop-blur">
        <Slider
          className="w-full"
          aria-label="Playback position"
          min={0}
          max={Math.max(duration, 1)}
          step={1}
          value={scrub ?? position}
          onValueChange={(value) => setScrub(value as number)}
          onValueCommitted={(value) => {
            seek(value as number)
            setScrub(null)
          }}
        />

        <div className="mx-auto flex w-full max-w-[1500px] items-center gap-2 px-3 pb-2 sm:gap-3 sm:px-5">
          <div className="flex items-center gap-0.5 sm:gap-1">
            <Button variant="ghost" size="icon-lg" aria-label="Previous track" onClick={previous}>
              <SkipBack />
            </Button>
            <Button
              size="lg"
              className="rounded-full"
              aria-label={isPlaying ? "Pause" : "Play"}
              onClick={toggle}
            >
              {isPlaying ? <Pause /> : <Play />}
            </Button>
            <Button variant="ghost" size="icon-lg" aria-label="Next track" onClick={next}>
              <SkipForward />
            </Button>
          </div>

          <button
            type="button"
            onClick={() => setExpanded(true)}
            aria-label="Open full player"
            className="flex min-w-0 flex-1 cursor-pointer items-center justify-center gap-3 rounded-lg px-2 py-2"
          >
            <AudioCover track={current} className="size-10" />
            <span className="min-w-0 text-left">
              <span className="block truncate text-sm font-medium">{current.title}</span>
              <span className="block truncate text-xs text-muted-foreground">{current.artist}</span>
            </span>
          </button>

          <div className="flex items-center gap-0.5 sm:gap-1">
            <Button
              variant="ghost"
              size="icon-lg"
              aria-label="Shuffle"
              aria-pressed={shuffle}
              className={cn(shuffle && "text-primary")}
              onClick={toggleShuffle}
            >
              <Shuffle />
            </Button>
            <Button
              variant="ghost"
              size="icon-lg"
              aria-label={`Repeat: ${REPEAT_LABEL[repeat]}`}
              aria-pressed={repeat !== "off"}
              className={cn(repeat !== "off" && "text-primary")}
              onClick={cycleRepeat}
            >
              {repeat === "one" ? <Repeat1 /> : <Repeat />}
            </Button>
            <Button
              variant="ghost"
              size="icon-lg"
              aria-label={volume > 0 ? "Mute" : "Unmute"}
              onClick={() => setVolume(volume > 0 ? 0 : 0.8)}
            >
              {volume > 0 ? <Volume2 /> : <VolumeX />}
            </Button>
            <Slider
              className="hidden w-20 sm:block lg:w-24"
              aria-label="Volume"
              min={0}
              max={100}
              step={1}
              value={Math.round(volume * 100)}
              onValueChange={(value) => setVolume((value as number) / 100)}
            />
            <Button
              variant="ghost"
              size="icon-lg"
              aria-label="Open full player"
              onClick={() => setExpanded(true)}
            >
              <Maximize2 />
            </Button>
          </div>
        </div>
      </div>

      <NowPlayingView open={expanded} onOpenChange={setExpanded} />
    </>
  )
}