import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { ChevronLeft, ChevronRight, HardDriveUpload } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { PageHeader } from "@/components/shared"
import { TrackActions } from "@/components/track/TrackActions"
import { TrackList } from "@/components/track/TrackList"
import { TrackFilters, type KindFilter, type SortKey } from "@/components/library/TrackFilters"
import { usePlayer } from "@/components/player/PlayerProvider"
import { useLibrary } from "@/lib/library"

const PAGE_SIZES = [10, 20, 50, 100]
const PAGE_SIZE_ITEMS = PAGE_SIZES.map((size) => ({ value: String(size), label: String(size) }))

export function LibraryPage() {
  const { tracks, loading, error } = useLibrary()
  const { playTracks } = usePlayer()
  const [query, setQuery] = useState("")
  const [kind, setKind] = useState<KindFilter>("all")
  const [sort, setSort] = useState<SortKey>("recent")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase()
    const result = tracks.filter((track) => {
      if (kind !== "all" && track.kind !== kind) return false
      if (!keyword) return true
      return [track.title, track.artist, track.album].some((value) =>
        value.toLowerCase().includes(keyword)
      )
    })

    switch (sort) {
      case "title":
        return result.sort((a, b) => a.title.localeCompare(b.title))
      case "artist":
        return result.sort((a, b) => a.artist.localeCompare(b.artist))
      case "duration":
        return result.sort((a, b) => b.duration - a.duration)
      default:
        return result.sort((a, b) => b.addedAt.localeCompare(a.addedAt))
    }
  }, [tracks, query, kind, sort])

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize))
  const currentPage = Math.min(page, pageCount)
  const pageTracks = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filtered.slice(start, start + pageSize)
  }, [filtered, currentPage, pageSize])

  function updateQuery(value: string) {
    setQuery(value)
    setPage(1)
  }

  const uploadButton = (
    <Button render={<Link to="/upload" />}>
      <HardDriveUpload />
      Upload audio
    </Button>
  )

  return (
    <div className="space-y-4">
      <PageHeader
        title="Library"
      >
        {uploadButton}
      </PageHeader>

      <TrackFilters
        query={query}
        onQueryChange={updateQuery}
        kind={kind}
        onKindChange={(value) => {
          setKind(value)
          setPage(1)
        }}
        sort={sort}
        onSortChange={(value) => {
          setSort(value)
          setPage(1)
        }}
        resultCount={filtered.length}
      />

      <TrackList
        tracks={pageTracks}
        onPlay={(_, index) => playTracks(filtered, (currentPage - 1) * pageSize + index)}
        onSearch={updateQuery}
        rowActions={(track) => <TrackActions track={track} />}
        emptyTitle={loading ? "Loading audio" : error ? "Could not load your library" : "No matching audio"}
        emptyDescription={loading ? "Fetching tracks from the server." : (error ?? "Try a different keyword or clear the filters.")}
        emptyAction={loading ? null : tracks.length === 0 ? uploadButton : null}
      />

      {filtered.length > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Show</span>
            <Select
              items={PAGE_SIZE_ITEMS}
              value={String(pageSize)}
              onValueChange={(value) => {
                setPageSize(Number(value))
                setPage(1)
              }}
            >
              <SelectTrigger size="sm" aria-label="Items per page">
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="start">
                <SelectGroup>
                  {PAGE_SIZE_ITEMS.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <span>per page</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Page {currentPage} of {pageCount}</span>
            <Button
              variant="outline"
              size="icon-sm"
              aria-label="Previous page"
              disabled={currentPage <= 1}
              onClick={() => setPage(currentPage - 1)}
            >
              <ChevronLeft />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              aria-label="Next page"
              disabled={currentPage >= pageCount}
              onClick={() => setPage(currentPage + 1)}
            >
              <ChevronRight />
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  )
}