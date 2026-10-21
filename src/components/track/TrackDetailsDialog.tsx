import { useEffect, useState } from "react"
import { LoaderCircle } from "lucide-react"
import { getAudio, type AudioResponse } from "@/api/audio"
import { AudioCover } from "@/components/shared"
import { notify } from "@/components/ui/notification-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { useIsMobile } from "@/hooks/use-mobile"
import { AUDIO_KINDS, formatDuration, type Track } from "@/lib/library"

const SNAP_POINTS = [0.4, 1]

/**
 * The peek snap point is 40% of the viewport. Base UI offsets the popup from a
 * JS-measured height that is still 0 on the first painted frame, which made the
 * sheet jump to full height before settling. Deriving the offset in CSS instead
 * (`100%` = the sheet height) keeps the peek exactly 40dvh tall from the very
 * first frame; `data-expanded` is the fully-open snap point.
 */
const SHEET_CLASS = "min-h-[40dvh] [transform:translateY(calc(var(--drawer-sheet-offset,calc(100%-40dvh))+var(--drawer-swipe-movement-y,0px)))] data-expanded:[--drawer-sheet-offset:0px]"

type TrackDetailsDialogProps = {
  track: Track
  open: boolean
  onOpenChange: (open: boolean) => void
}

type DetailState = {
  id: string
  detail: AudioResponse | null
}

function formatBytes(bytes?: number | null) {
  if (!bytes || !Number.isFinite(bytes) || bytes <= 0) return "Not set"
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function formatDateTime(value?: string | null) {
  if (!value) return "Not set"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })
}

export function TrackDetailsDialog({ track, open, onOpenChange }: TrackDetailsDialogProps) {
  const isMobile = useIsMobile()
  const [loaded, setLoaded] = useState<DetailState | null>(null)
  const [snapPoint, setSnapPoint] = useState<number | string | null>(SNAP_POINTS[0])

  useEffect(() => {
    if (!open) return
    let cancelled = false

    getAudio(track.id)
      .then((audio) => {
        if (!cancelled) setLoaded({ id: track.id, detail: audio })
      })
      .catch((cause: unknown) => {
        if (!cancelled) {
          setLoaded({ id: track.id, detail: null })
          notify.error(cause instanceof Error ? cause.message : "Could not load details")
        }
      })

    return () => {
      cancelled = true
    }
  }, [open, track.id])

  const current = open && loaded?.id === track.id ? loaded : null
  const detail = current?.detail ?? null
  const loading = open && !current

  function handleOpenChange(nextOpen: boolean) {
    // Keep the loaded detail cached: the sheet keeps the exact same height on
    // every open, so it never has to re-position itself mid-animation.
    if (!nextOpen) setSnapPoint(SNAP_POINTS[0])
    onOpenChange(nextOpen)
  }

  const artist = detail ? detail.author?.trim() || track.artist : track.artist
  const rows: { label: string; value: string }[] = [
    { label: "Title", value: (detail?.title ?? track.title) || "Not set" },
    { label: "Artist", value: artist || "Unknown artist" },
    { label: "Album", value: detail?.album?.trim() || track.album || "Not set" },
    { label: "Year", value: detail?.year != null ? String(detail.year) : "Not set" },
    { label: "Type", value: AUDIO_KINDS[track.kind].label },
    { label: "Duration", value: formatDuration(detail?.duration ?? track.duration) },
    { label: "File size", value: formatBytes(detail?.fileSize) },
    { label: "Format", value: detail?.mimeType || "Not set" },
    { label: "Added", value: formatDateTime(detail?.createdAt ?? track.addedAt) },
    { label: "Updated", value: formatDateTime(detail?.updatedAt) },
  ]

  const summary = (
    <div className="flex min-w-0 items-center gap-3 pt-1">
      <AudioCover track={track} className="size-12 rounded-lg" />
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{track.title}</p>
        <p className="truncate text-xs text-muted-foreground">{artist || "Unknown artist"}</p>
      </div>
    </div>
  )

  const body = loading ? (
    <p className="flex items-center gap-2 text-xs text-muted-foreground">
      <LoaderCircle className="size-3.5 animate-spin" />
      Loading details...
    </p>
  ) : (
    <div className="flex flex-col gap-2 text-sm">
      {rows.map((row) => (
        <div key={row.label} className="flex items-start justify-between gap-4">
          <span className="shrink-0 text-muted-foreground">{row.label}</span>
          <span className="min-w-0 text-right break-words">{row.value}</span>
        </div>
      ))}
    </div>
  )

  if (isMobile) {
    return (
      <Drawer
        open={open}
        onOpenChange={handleOpenChange}
        snapPoints={SNAP_POINTS}
        snapPoint={snapPoint}
        onSnapPointChange={setSnapPoint}
      >
        <DrawerContent showCloseButton={false} className={SHEET_CLASS}>
          <DrawerHeader>
            <DrawerTitle>Track details</DrawerTitle>
            <DrawerDescription className="sr-only">Details for {track.title}</DrawerDescription>
            {summary}
          </DrawerHeader>
          {body}
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Track details</DialogTitle>
          <DialogDescription className="sr-only">Details for {track.title}</DialogDescription>
          {summary}
        </DialogHeader>
        {body}
      </DialogContent>
    </Dialog>
  )
}
