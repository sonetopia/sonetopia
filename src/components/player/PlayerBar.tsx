import { useEffect, useRef, useState } from "react"
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
import { SeekSlider } from "@/components/player/SeekSlider"
import { AudioCover } from "@/components/shared"
import { NowPlayingView } from "@/components/player/NowPlayingView"
import { usePlayer } from "@/components/player/PlayerProvider"
import { useIsMobile } from "@/hooks/use-mobile"
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
  const isMobile = useIsMobile(640)
  const barRef = useRef<HTMLDivElement>(null)
  const [scrub, setScrub] = useState<number | null>(null)
  const [expanded, setExpanded] = useState(false)

  // publish the real bar height so the sidebar and page padding can stay clear of it
  useEffect(() => {
    const bar = barRef.current
    if (!bar) return
    const apply = () =>
      document.documentElement.style.setProperty("--player-bar-height", `${bar.offsetHeight}px`)
    apply()
    const observer = new ResizeObserver(apply)
    observer.observe(bar)
    return () => {
      observer.disconnect()
      document.documentElement.style.removeProperty("--player-bar-height")
    }
  }, [current, isMobile])

  // the controller only exists while something is loaded
  if (!current) return null

  return (
    <>
      <div
        ref={barRef}
        className="fixed inset-x-0 bottom-0 z-40 bg-card/95 shadow-[0_-1px_0_0_var(--color-border),0_-10px_30px_-18px_rgb(0_0_0/0.45)] backdrop-blur">
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

        <div className="mx-auto flex w-full max-w-[1500px] items-center gap-2 px-3 pt-1 pb-2 sm:gap-3 sm:px-5">
          {isMobile ? null : (
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon-lg" aria-label="Previous track" onClick={previous}>
                <SkipBack className="size-5" />
              </Button>
              <Button
                size="icon-lg"
                className="rounded-full"
                aria-label={isPlaying ? "Pause" : "Play"}
                onClick={toggle}
              >
                {isPlaying ? <Pause className="size-5" /> : <Play className="size-5" />}
              </Button>
              <Button variant="ghost" size="icon-lg" aria-label="Next track" onClick={next}>
                <SkipForward className="size-5" />
              </Button>
            </div>
          )}

          <button
            type="button"
            onClick={() => setExpanded(true)}
            aria-label="Open full player"
            className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 rounded-lg px-1 py-1.5 sm:justify-center sm:px-2"
          >
            <AudioCover track={current} className="size-11 shrink-0 rounded-xl sm:size-10" />
            <span className="min-w-0 text-left">
              <span className="block truncate text-sm font-medium">{current.title}</span>
              <span className="block truncate text-xs text-muted-foreground">{current.artist}</span>
            </span>
          </button>

          {isMobile ? (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon-lg"
                aria-label={isPlaying ? "Pause" : "Play"}
                onClick={toggle}
              >
                {isPlaying ? <Pause className="size-5" /> : <Play className="size-5" />}
              </Button>
              <Button variant="ghost" size="icon-lg" aria-label="Next track" onClick={next}>
                <SkipForward className="size-5" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon-lg"
                aria-label="Shuffle"
                aria-pressed={shuffle}
                className={cn(shuffle && "text-primary aria-pressed:hover:text-primary")}
                onClick={toggleShuffle}
              >
                <Shuffle className="size-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon-lg"
                aria-label={`Repeat: ${REPEAT_LABEL[repeat]}`}
                aria-pressed={repeat !== "off"}
                className={cn(repeat !== "off" && "text-primary aria-pressed:hover:text-primary")}
                onClick={cycleRepeat}
              >
                {repeat === "one" ? <Repeat1 className="size-5" /> : <Repeat className="size-5" />}
              </Button>
              <Button
                variant="ghost"
                size="icon-lg"
                aria-label={volume > 0 ? "Mute" : "Unmute"}
                onClick={() => setVolume(volume > 0 ? 0 : 1)}
              >
                {volume > 0 ? <Volume2 className="size-5" /> : <VolumeX className="size-5" />}
              </Button>
              <Button
                variant="ghost"
                size="icon-lg"
                aria-label="Open full player"
                onClick={() => setExpanded(true)}
              >
                <Maximize2 className="size-5" />
              </Button>
            </div>
          )}
        </div>
      </div>

      <NowPlayingView open={expanded} onOpenChange={setExpanded} />
    </>
  )
}