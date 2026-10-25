import { useMemo } from "react"
import { Link, useNavigate } from "react-router-dom"
import { ArrowRight, Info, LogIn, Plus } from "lucide-react"
import { useAuthDialog } from "@/components/auth/AuthDialog"
import { Button } from "@/components/ui/button"
import { SectionHeader } from "@/components/shared"
import { PlaylistList } from "@/components/playlist/PlaylistList"
import { PlaylistForm } from "@/components/playlist/PlaylistForm"
import { QuickPicksList } from "@/components/dashboard/QuickPicksList"
import { useAuth } from "@/lib/auth"
import { useLibrary } from "@/lib/library"
import { shuffleWithFirst } from "@/lib/playback"

const QUICK_PICK_COUNT = 6

export function DashboardPage() {
  const { tracks, playlists, createPlaylist } = useLibrary()
  const { user } = useAuth()
  const { openAuth } = useAuthDialog()
  const navigate = useNavigate()

  // reshuffled whenever the library changes, stable across re-renders
  const quickPicks = useMemo(
    () => shuffleWithFirst(tracks, -1).slice(0, QUICK_PICK_COUNT),
    [tracks]
  )

  const signInAction = (
    <div className="flex items-center gap-2">
      <Button onClick={() => openAuth("sign-in")}>
        <LogIn />
        Sign in
      </Button>
      <Button variant="outline" onClick={() => navigate("/about")}>
        <Info />
        About Sonetopia
      </Button>
    </div>
  )

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <SectionHeader title="Your playlists">
          <Button variant="ghost" size="sm" render={<Link to="/library" />}>
            Explore library
            <ArrowRight />
          </Button>
        </SectionHeader>
        <PlaylistList
          layout="rail"
          playlists={playlists}
          emptyAction={
            user ? (
              <PlaylistForm
                submitLabel="Create playlist"
                onSubmit={async (values) => {
                  await createPlaylist(values)
                }}
                trigger={
                  <Button variant="outline">
                    <Plus />
                    New playlist
                  </Button>
                }
              />
            ) : (
              signInAction
            )
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
          emptyAction={
            user ? <Button render={<Link to="/upload" />}>Upload audio</Button> : signInAction
          }
          emptyTitle={user ? undefined : "Sign in to see your quick picks"}
          emptyDescription={
            user ? undefined : "Your library stays private and appears here after you sign in."
          }
        />
      </section>
    </div>
  )
}
