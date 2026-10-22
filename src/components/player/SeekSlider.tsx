import { useRef, useState } from "react"
import { cn } from "cn"
import { Slider } from "@/components/ui/slider"
import { formatDuration } from "@/lib/library"

const timeLabel = (seconds: number) => (seconds > 0 ? formatDuration(seconds) : "0:00")

type SeekSliderProps = {
  value: number
  max: number
  onValueChange: (value: number) => void
  onValueCommitted?: () => void
  className?: string
  "aria-label"?: string
}

export function SeekSlider({
  value,
  max,
  onValueChange,
  onValueCommitted,
  className,
  "aria-label": ariaLabel,
}: SeekSliderProps) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const [preview, setPreview] = useState<{ left: number; seconds: number }>({ left: 0, seconds: 0 })
  const [visible, setVisible] = useState(false)

  const handlePointerMove = (clientX: number) => {
    const wrapper = wrapperRef.current
    if (!wrapper || max <= 0) return
    const track = wrapper.querySelector<HTMLElement>('[data-slot="slider-track"]') ?? wrapper
    const trackRect = track.getBoundingClientRect()
    if (trackRect.width === 0) return

    const offset = clientX - trackRect.left
    const thumb = wrapper.querySelector<HTMLElement>('[data-slot="slider-thumb"]')
    const inset = thumb ? thumb.getBoundingClientRect().width / 2 : 0
    const ratio = Math.min(1, Math.max(0, (offset - inset) / Math.max(1, trackRect.width - inset * 2)))

    const half = (tooltipRef.current?.offsetWidth ?? 0) / 2
    const left = Math.min(Math.max(offset, half), Math.max(half, trackRect.width - half))

    setPreview({ left, seconds: ratio * max })
    setVisible(true)
  }

  return (
    <div
      ref={wrapperRef}
      className="group/seek relative"
      onPointerMove={(event) => handlePointerMove(event.clientX)}
      onPointerLeave={() => setVisible(false)}
    >
      <Slider
        className={className}
        aria-label={ariaLabel}
        min={0}
        max={Math.max(max, 1)}
        step={1}
        value={value}
        onValueChange={(next) => onValueChange(next as number)}
        onValueCommitted={onValueCommitted}
        onPointerUp={onValueCommitted}
      />
      <div
        ref={tooltipRef}
        data-slot="seek-tooltip"
        aria-hidden
        className={cn(
          "pointer-events-none absolute bottom-[calc(100%+7px)] z-10 -translate-x-1/2 rounded-sm bg-foreground px-1.5 py-0.5 text-[11px] font-medium whitespace-nowrap tabular-nums text-background shadow-sm transition-opacity duration-150",
          visible ? "opacity-100" : "opacity-0"
        )}
        style={{ left: preview.left }}
      >
        {timeLabel(preview.seconds)}
      </div>
    </div>
  )
}