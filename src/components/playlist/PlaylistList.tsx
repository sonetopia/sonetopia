import { useState, type ReactNode } from "react"
import { Link } from "react-router-dom"
import { cn } from "cn"
import { ListMusic, MoreHorizontal, Play, Shuffle, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { PlaylistDeleteDialog } from "@/components/playlist/PlaylistDeleteDialog"
import { AudioCover, EmptyState } from "@/components/shared"
import { usePlayer } from "@/components/player/PlayerProvider"
import { formatTotalDuration, useLibrary, type Playlist, type Track } from "@/lib/library"

/** Fills its box edge to edge: single cover, 2x2 collage, or a placeholder. */
function PlaylistCover({ tracks }: { tracks: Track[] }) {
  if (tracks.length === 0) {
    return (
      <span className="grid size-full place-items-center bg-muted text-muted-foreground">
        <ListMusic className="size-6" />
      </span>
    )
  }

  if (tracks.length === 1) {
    return <AudioCover track={tracks[0]} className="size-full rounded-none" />
  }

  if (tracks.length === 2) {
    return (
      <span className="grid size-full grid-cols-2 grid-rows-1 gap-px bg-muted">
        {tracks.slice(0, 2).map((track) => (
          <AudioCover key={track.id} track={track} className="size-full rounded-none" />
        ))}
      </span>
    )
  }

  return (
    <span className="grid size-full grid-cols-2 grid-rows-2 gap-px bg-muted">
      {tracks.slice(0, 4).map((track) => (
        <AudioCover key={track.id} track={track} className="size-full rounded-none" />
      ))}
    </span>
  )
}

type PlaylistListProps = {
  playlists: Playlist[]
  emptyAction?: ReactNode
  layout?: "grid" | "rail"
}

export function PlaylistList({ playlists, emptyAction, layout = "grid" }: PlaylistListProps) {
  const { tracksByIds } = useLibrary()
  const { playTracks } = usePlayer()
  const [deleteTarget, setDeleteTarget] = useState<Playlist | null>(null)

  if (playlists.length === 0) {
    return (
      <EmptyState
        icon={ListMusic}
        title="No playlists yet"
        description="Group audio by mood or activity."
        action={emptyAction}
      />
    )
  }

  return (
    <div
      className={cn(
        "py-1 scrollbar-none ps-[1px]",
        layout === "rail"
          ? "flex gap-3 overflow-x-auto"
          : "grid gap-3 sm:grid-cols-4 2xl:grid-cols-6"
      )}
    >
      {playlists.map((playlist) => {
        const tracks = tracksByIds(playlist.trackIds)
        return (
          <Card
            key={playlist.id}
            className={cn("gap-0 p-0", layout === "rail" ? "w-60 shrink-0" : "w-full")}
          >
            <CardHeader className="relative block aspect-[3/2] p-0">
              <div className="absolute inset-0">
                <PlaylistCover tracks={tracks} />
              </div>
              <CardAction className="absolute top-2 right-2 z-10">
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <Button
                        variant="secondary"
                        size="icon-sm"
                        className="bg-background/70 backdrop-blur-sm hover:bg-background"
                        aria-label={`Actions for playlist ${playlist.name}`}
                      />
                    }
                  >
                    <MoreHorizontal />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="min-w-[150px]">
                    <DropdownMenuItem
                      disabled={tracks.length === 0}
                      onClick={() => playTracks(tracks, 0)}
                    >
                      <Play />
                      Play
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      disabled={tracks.length === 0}
                      onClick={() => playTracks(tracks, 0)}
                    >
                      <Shuffle />
                      Shuffle
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={() => setDeleteTarget(playlist)}
                    >
                      <Trash2 />
                      Delete playlist
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardAction>
            </CardHeader>

            <CardFooter className="min-w-0 flex-col items-start gap-0.5">
              <CardTitle className="w-full min-w-0 truncate">
                <Link
                  to={`/playlists/${playlist.id}`}
                  title={playlist.name}
                  className="hover:underline"
                >
                  {playlist.name}
                </Link>
              </CardTitle>
              <CardDescription className="w-full min-w-0 truncate">
                {tracks.length} tracks · {formatTotalDuration(tracks)}
              </CardDescription>
            </CardFooter>
          </Card>
        )
      })}

      <PlaylistDeleteDialog
        playlist={deleteTarget}
        open={deleteTarget !== null}
        onOpenChange={(next) => {
          if (!next) setDeleteTarget(null)
        }}
      />
    </div>
  )
}