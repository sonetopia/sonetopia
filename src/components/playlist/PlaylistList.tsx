import type { ReactNode } from "react"
import { Link } from "react-router-dom"
import { cn } from "cn"
import { ListMusic, MoreHorizontal, Pencil, Play, Shuffle, Trash2 } from "lucide-react"
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
import { AudioCover, EmptyState } from "@/components/shared"
import { PlaylistForm } from "@/components/playlist/PlaylistForm"
import { usePlayer } from "@/components/player/PlayerProvider"
import { formatTotalDuration, useLibrary, type Playlist, type Track } from "@/lib/library"

function PlaylistCover({ tracks }: { tracks: Track[] }) {
  if (tracks.length === 0) {
    return (
      <span className="grid size-14 shrink-0 place-items-center rounded-xl bg-muted text-muted-foreground">
        <ListMusic className="size-5" />
      </span>
    )
  }

  return (
    <span className="grid size-14 shrink-0 grid-cols-2 gap-0.5 overflow-hidden rounded-xl">
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
  const { tracksByIds, deletePlaylist, updatePlaylist } = useLibrary()
  const { playTracks } = usePlayer()

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
        "py-1 ps-[1px]",
        layout === "rail"
          ? "flex gap-3 overflow-x-auto"
          : "grid gap-3 sm:grid-cols-2 2xl:grid-cols-3"
      )}
    >
      {playlists.map((playlist) => {
        const tracks = tracksByIds(playlist.trackIds)
        return (
          <Card key={playlist.id} className={cn(layout === "rail" && "w-72 shrink-0")}>
            <CardHeader>
              <div className="flex min-w-0 items-start gap-3">
                <PlaylistCover tracks={tracks} />
                <div className="min-w-0 space-y-1">
                  <CardTitle className="truncate">
                    <Link to={`/playlists/${playlist.id}`} className="hover:underline">
                      {playlist.name}
                    </Link>
                  </CardTitle>
                  <CardDescription>
                    {tracks.length} tracks · {formatTotalDuration(tracks)}
                  </CardDescription>
                  <p className="line-clamp-2 text-xs text-muted-foreground">
                    {playlist.description || "No description"}
                  </p>
                </div>
              </div>
              <CardAction>
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <Button
                        variant="ghost"
                        size="icon-sm"
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
                      onClick={() => deletePlaylist(playlist.id)}
                    >
                      <Trash2 />
                      Delete playlist
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardAction>
            </CardHeader>
            <CardFooter className="gap-2">
              <Button size="sm" disabled={tracks.length === 0} onClick={() => playTracks(tracks, 0)}>
                <Play />
                Play
              </Button>
              <PlaylistForm
                initial={{ name: playlist.name, description: playlist.description }}
                onSubmit={(values) => updatePlaylist(playlist.id, values)}
                trigger={
                  <Button size="sm" variant="ghost">
                    <Pencil />
                    Edit
                  </Button>
                }
              />
            </CardFooter>
          </Card>
        )
      })}
    </div>
  )
}