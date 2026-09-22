import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { HardDriveUpload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/shared"
import { TrackActions } from "@/components/track/TrackActions"
import { TrackList } from "@/components/track/TrackList"
import { TrackFilters, type KindFilter, type SortKey } from "@/components/library/TrackFilters"
import { usePlayer } from "@/components/player/PlayerProvider"
import { useLibrary } from "@/lib/library"

export function LibraryPage() {
  const { tracks } = useLibrary()
  const { playTracks } = usePlayer()
  const [query, setQuery] = useState("")
  const [kind, setKind] = useState<KindFilter>("all")
  const [sort, setSort] = useState<SortKey>("recent")

  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase()
    const result = tracks.filter((track) => {
      if (kind !== "all" && track.kind !== kind) return false
      if (!keyword) return true
      return [track.title, track.artist, ...track.tags].some((value) =>
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

  const uploadButton = (
    <Button render={<Link to="/upload" />}>
      <HardDriveUpload />
      Upload audio
    </Button>
  )

  return (
    <div className="space-y-5">
      <PageHeader
        title="Audio"
        description="Everything you have stored: music, podcasts, instrumentals, ambience, and more."
      >
        {uploadButton}
      </PageHeader>

      <TrackFilters
        query={query}
        onQueryChange={setQuery}
        kind={kind}
        onKindChange={setKind}
        sort={sort}
        onSortChange={setSort}
        resultCount={filtered.length}
      />

      <TrackList
        tracks={filtered}
        showAddedAt
        onPlay={(_, index) => playTracks(filtered, index)}
        rowActions={(track) => <TrackActions track={track} />}
        emptyTitle="No matching audio"
        emptyDescription="Try a different keyword or clear the filters."
        emptyAction={tracks.length === 0 ? uploadButton : null}
      />
    </div>
  )
}