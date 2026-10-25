import { Search, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { KIND_OPTIONS, type AudioKind } from "@/lib/library"

export type KindFilter = AudioKind | "all"
export type SortKey = "recent" | "title" | "artist" | "duration"

export const KIND_ITEMS = [{ value: "all", label: "All types" }, ...KIND_OPTIONS]

const SORT_ITEMS = [
  { value: "recent", label: "Newest" },
  { value: "title", label: "Title A-Z" },
  { value: "artist", label: "Artist A-Z" },
  { value: "duration", label: "Longest first" },
]

type TrackFiltersProps = {
  query: string
  onQueryChange: (value: string) => void
  kind: KindFilter
  onKindChange: (value: KindFilter) => void
  sort: SortKey
  onSortChange: (value: SortKey) => void
  resultCount: number
}

export function TrackFilters({
  query,
  onQueryChange,
  kind,
  onKindChange,
  sort,
  onSortChange,
  resultCount,
}: TrackFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative basis-full sm:min-w-52 sm:flex-1">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search title, artist, or album"
          aria-label="Search audio"
          className="pl-8"
        />
        {query ? (
          <Button
            variant="ghost"
            size="icon-xs"
            className="absolute inset-y-0 right-1.5 z-10 my-auto"
            aria-label="Clear search"
            onClick={() => onQueryChange("")}
          >
            <X />
          </Button>
        ) : null}
      </div>

      <Select
        items={KIND_ITEMS}
        value={kind}
        onValueChange={(value) => onKindChange(value as KindFilter)}
      >
        <SelectTrigger
          aria-label="Filter by audio type"
          className="min-w-0 flex-1 basis-0 sm:flex-none sm:basis-auto"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {KIND_ITEMS.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>

      <Select
        items={SORT_ITEMS}
        value={sort}
        onValueChange={(value) => onSortChange(value as SortKey)}
      >
        <SelectTrigger
          aria-label="Sort audio"
          className="min-w-0 flex-1 basis-0 sm:flex-none sm:basis-auto"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {SORT_ITEMS.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>

      <span className="min-w-0 flex-1 basis-0 text-center text-xs sm:flex-none sm:basis-auto border h-8 rounded-lg px-3 py-1 flex items-center justify-center">
        {resultCount} tracks
      </span>
    </div>
  )
}