import { useState } from "react"
import { Link } from "react-router-dom"
import { Check, Download, LoaderCircle, Music2, TriangleAlert } from "lucide-react"
import type { AudioSearchResult } from "@/api/audio"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { formatDuration } from "@/lib/library"
import type { SearchState } from "@/lib/audio-search"

// The API sends machine ids ("youtube_music"); brand casing can't be derived, so map it.
const SOURCE_LABELS: Record<string, string> = {
  youtube_music: "YouTube Music",
  youtube: "YouTube",
  soundcloud: "SoundCloud",
}

export function sourceLabel(source: string) {
  const key = source.trim().toLowerCase()
  return (
    SOURCE_LABELS[key] ?? key.replace(/[_-]+/g, " ").replace(/\b\w/g, (char) => char.toUpperCase())
  )
}

function ResultThumbnail({ src }: { src: string | null }) {
  const [failed, setFailed] = useState(false)

  if (!src || failed) {
    return (
      <span className="grid size-full place-items-center bg-muted text-muted-foreground">
        <Music2 className="size-5" />
      </span>
    )
  }

  return (
    <img
      src={src}
      alt=""
      loading="lazy"
      referrerPolicy="no-referrer"
      className="size-full object-cover"
      onError={() => setFailed(true)}
    />
  )
}

function ResultSkeletons() {
  return (
    <ul className="flex flex-col divide-y" aria-hidden>
      {Array.from({ length: 4 }, (_, index) => (
        <li key={index} className="flex items-center gap-3 p-3">
          <Skeleton className="aspect-video w-24 shrink-0 sm:w-28" />
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/3" />
          </div>
          <Skeleton className="h-8 w-8 shrink-0 sm:w-20" />
        </li>
      ))}
    </ul>
  )
}

function ErrorRow({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex items-center gap-3 p-4 text-sm" role="alert">
      <TriangleAlert className="size-4 shrink-0 text-destructive" />
      <p className="min-w-0 flex-1 text-muted-foreground">{message}</p>
      <Button type="button" variant="outline" size="sm" onClick={onRetry}>
        Try again
      </Button>
    </div>
  )
}

function ResultRow({
  item,
  busy,
  onImport,
}: {
  item: AudioSearchResult
  busy: boolean
  onImport: (item: AudioSearchResult) => void
}) {
  const label = item.title?.trim() || item.url
  // Null and 0 both mean "unknown" here, never render "0:00" or "--:--".
  const duration = item.duration && item.duration > 0 ? formatDuration(item.duration) : null
  const uploader = item.uploader?.trim() || null

  return (
    <li className="flex items-center gap-3 p-3">
      <div className="aspect-video w-24 shrink-0 overflow-hidden rounded-md bg-muted sm:w-28">
        <ResultThumbnail src={item.thumbnail} />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="line-clamp-2 text-sm leading-snug font-medium" title={label}>
          {label}
        </p>
        <p className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted-foreground">
          {uploader ? <span className="truncate">{uploader}</span> : null}
          {duration ? (
            <span className="shrink-0">
              {uploader ? "· " : ""}
              {duration}
            </span>
          ) : null}
          <Badge variant="secondary" className="shrink-0">
            {sourceLabel(item.source)}
          </Badge>
          {item.inLibrary ? (
            <Badge variant="outline" className="shrink-0">
              <Check />
              In library
            </Badge>
          ) : null}
        </p>
      </div>
      {item.inLibrary ? (
        item.libraryAudioId ? (
          <Link
            to={`/library?audio=${encodeURIComponent(item.libraryAudioId)}`}
            className={buttonVariants({ variant: "ghost", size: "sm" })}
            aria-label={`Open ${label} in library`}
          >
            Open
          </Link>
        ) : null
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={busy}
          aria-label={`Import ${label}`}
          onClick={() => onImport(item)}
        >
          <Download />
          <span className="hidden sm:inline">Import</span>
        </Button>
      )}
    </li>
  )
}

type SearchResultsProps = {
  state: SearchState
  busy: boolean
  onImport: (item: AudioSearchResult) => void
  onLoadMore: () => void
  onRetry: () => void
}

export function SearchResults({ state, busy, onImport, onLoadMore, onRetry }: SearchResultsProps) {
  const { status, results, error, errorOnMore, hasMore, query } = state

  if (status === "idle") return null

  if (status === "loading") {
    return (
      <div className="border-t" role="status" aria-label="Searching">
        <ResultSkeletons />
      </div>
    )
  }

  if (status === "error" && !errorOnMore) {
    return (
      <div className="border-t">
        <ErrorRow message={error ?? "Search failed"} onRetry={onRetry} />
      </div>
    )
  }

  if (results.length === 0) {
    return (
      <p className="border-t p-6 text-center text-sm text-muted-foreground">
        No results for “{query}”. Try different keywords or paste a link.
      </p>
    )
  }

  return (
    <div className="border-t">
      <ul className="flex flex-col divide-y">
        {results.map((item) => (
          <ResultRow key={item.url} item={item} busy={busy} onImport={onImport} />
        ))}
      </ul>
      {status === "error" ? (
        <div className="border-t">
          <ErrorRow message={error ?? "Could not load more results"} onRetry={onRetry} />
        </div>
      ) : hasMore ? (
        <div className="flex justify-center border-t p-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={status === "loadingMore"}
            onClick={onLoadMore}
          >
            {status === "loadingMore" ? <LoaderCircle className="animate-spin" /> : null}
            {status === "loadingMore" ? "Loading..." : "Load more"}
          </Button>
        </div>
      ) : (
        <p className="border-t p-3 text-center text-xs text-muted-foreground">
          That’s all the results.
        </p>
      )}
    </div>
  )
}
