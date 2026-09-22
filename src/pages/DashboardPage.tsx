import { Link } from "react-router-dom"
import { ArrowRight, AudioLines, Clock, Library, ListMusic, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PageHeader, SectionHeader, StatCard } from "@/components/shared"
import { PlaylistList } from "@/components/playlist/PlaylistList"
import { PlaylistForm } from "@/components/playlist/PlaylistForm"
import { TrackActions } from "@/components/track/TrackActions"
import { TrackList } from "@/components/track/TrackList"
import { usePlayer } from "@/components/player/PlayerProvider"
import { useAuth } from "@/lib/auth"
import { KIND_OPTIONS, formatTotalDuration, useLibrary } from "@/lib/library"

const VIEW_ALL = (
  <Button variant="ghost" size="sm" render={<Link to="/library" />}>
    View all
    <ArrowRight />
  </Button>
)

export function DashboardPage() {
  const { tracks, playlists, createPlaylist } = useLibrary()
  const { user } = useAuth()
  const { playTracks } = usePlayer()

  const recent = [...tracks].sort((a, b) => b.addedAt.localeCompare(a.addedAt)).slice(0, 6)
  const kindsUsed = new Set(tracks.map((track) => track.kind)).size
  const firstName = user?.name.split(" ")[0] ?? "there"

  return (
    <div className="space-y-8">
      <PageHeader
        title={`Welcome back, ${firstName}`}
        description="Your private library at a glance. Nothing here is public, nothing leaves your account."
      >
        <Button render={<Link to="/upload" />}>Upload audio</Button>
      </PageHeader>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Library} label="Tracks" value={`${tracks.length}`} />
        <StatCard icon={Clock} label="Total duration" value={formatTotalDuration(tracks)} />
        <StatCard icon={ListMusic} label="Playlists" value={`${playlists.length}`} />
        <StatCard
          icon={AudioLines}
          label="Formats in library"
          value={`${kindsUsed} of ${KIND_OPTIONS.length}`}
        />
      </div>

      <section className="space-y-3">
        <SectionHeader
          title="Your playlists"
          description="Scroll sideways when the list grows"
        >
          <PlaylistForm
            submitLabel="Create playlist"
            onSubmit={(values) => createPlaylist(values)}
            trigger={
              <Button size="sm">
                <Plus />
                New playlist
              </Button>
            }
          />
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
        <SectionHeader title="Recently added" description="The latest files in your library">
          {VIEW_ALL}
        </SectionHeader>
        <TrackList
          tracks={recent}
          showAddedAt
          onPlay={(_, index) => playTracks(recent, index)}
          rowActions={(track) => <TrackActions track={track} />}
          emptyTitle="Your library is empty"
          emptyDescription="Upload your first audio file to get started."
          emptyAction={
            <Button render={<Link to="/upload" />}>Upload audio</Button>
          }
        />
      </section>
    </div>
  )
}