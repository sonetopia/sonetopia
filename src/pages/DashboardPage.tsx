import { useMemo } from "react"
import { Link } from "react-router-dom"
import { ArrowRight, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SectionHeader } from "@/components/shared"
import { PlaylistList } from "@/components/playlist/PlaylistList"
import { PlaylistForm } from "@/components/playlist/PlaylistForm"
import { QuickPicksList } from "@/components/dashboard/QuickPicksList"
import { useLibrary } from "@/lib/library"
import { shuffledOrder } from "@/lib/playback"

const QUICK_PICK_COUNT = 6

export function DashboardPage() {
  const { tracks, playlists, createPlaylist } = useLibrary()

  // reshuffled whenever the library changes, stable across re-renders
  const quickPicks = useMemo(
    () =>
      shuffledOrder(tracks.length, -1)
        .slice(0, QUICK_PICK_COUNT)
        .map((index) => tracks[index]),
    [tracks]
  )

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <SectionHeader title="Your playlists" description="Scroll sideways when the list grows">
          <Button variant="ghost" size="sm" render={<Link to="/library" />}>
            Explore library
            <ArrowRight />
          </Button>
        </SectionHeader>
        <PlaylistList
          layout="rail"
          playlists={playlists}
          emptyAction={
            <PlaylistForm
              submitLabel="Create playlist"
              onSubmit={(values) => createPlaylist(values)}
              trigger={
                <Button variant="outline">
                  <Plus />
                  New playlist
                </Button>
              }
            />
          }
        />
      </section>

      <section className="space-y-3">
        <SectionHeader title="Quick picks">
          <Button variant="ghost" size="sm" render={<Link to="/upload" />}>
            Upload new audio
            <ArrowRight />
          </Button>
        </SectionHeader>
        <QuickPicksList
          tracks={quickPicks}
          emptyAction={<Button render={<Link to="/upload" />}>Upload audio</Button>}
        />
      </section>
    </div>
  )
}