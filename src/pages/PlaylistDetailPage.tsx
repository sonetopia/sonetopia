import { useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import {
  ArrowDown,
  ArrowUp,
  ListMusic,
  ListPlus,
  MoreHorizontal,
  Pencil,
  Play,
  Plus,
  Shuffle,
  Trash2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover"
import { AudioCover, EmptyState, PageHeader } from "@/components/shared"
import { TrackList } from "@/components/track/TrackList"
import { PlaylistDeleteDialog } from "@/components/playlist/PlaylistDeleteDialog"
import { PlaylistForm } from "@/components/playlist/PlaylistForm"
import { usePlayer } from "@/components/player/PlayerProvider"
import { formatTotalDuration, useLibrary, type Track } from "@/lib/library"

const randomStartIndex = (length: number) => Math.floor(Math.random() * length)

function AddTrackPopover({
  playlistId,
  excludedIds,
  className,
}: {
  playlistId: string
  excludedIds: string[]
  className?: string
}) {
  const { tracks, addTrackToPlaylist } = useLibrary()
  const available = tracks.filter((track) => !excludedIds.includes(track.id))

  return (
    <Popover>
      <PopoverTrigger render={<Button variant="outline" size="sm" className={className} />}>
        <Plus />
        Add audio
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80 max-w-[calc(100vw-2rem)]">
        <PopoverHeader>
          <PopoverTitle>Add to playlist</PopoverTitle>
          <PopoverDescription>Pick tracks from your library.</PopoverDescription>
        </PopoverHeader>
        <div className="flex max-h-64 flex-col overflow-y-auto">
          {available.length === 0 ? (
            <p className="px-1.5 py-2 text-xs text-muted-foreground">
              Every track is already in this playlist.
            </p>
          ) : (
            available.map((track) => (
              <button
                key={track.id}
                type="button"
                onClick={() => void addTrackToPlaylist(playlistId, track.id).catch(console.error)}
                className="flex items-center gap-2 rounded-md px-1.5 py-1.5 text-left text-sm hover:bg-accent"
              >
                <AudioCover track={track} className="size-8" />
                <span className="min-w-0 flex-1 truncate">{track.title}</span>
                <Plus className="size-4 shrink-0 text-muted-foreground" />
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

export function PlaylistDetailPage() {
  const { id = "" } = useParams()
  const navigate = useNavigate()
  const {
    playlists,
    loading,
    tracksByIds,
    removeTrackFromPlaylist,
    movePlaylistTrack,
    updatePlaylist,
  } = useLibrary()
  const { playTracks, enqueueNext, shuffle, toggleShuffle } = usePlayer()
  const [deleteOpen, setDeleteOpen] = useState(false)

  const playlist = playlists.find((item) => item.id === id)

  if (!playlist) {
    if (loading) {
      return (
        <EmptyState
          icon={ListMusic}
          title="Loading playlist"
          description="Fetching your playlists from the server."
        />
      )
    }

    return (
      <EmptyState
        icon={ListMusic}
        title="Playlist not found"
        description="It may have been deleted."
        action={
          <Button variant="outline" render={<Link to="/dashboard" />}>
            Back to dashboard
          </Button>
        }
      />
    )
  }

  const playlistTracks = tracksByIds(playlist.trackIds)

  function playFromRandomStart() {
    if (playlistTracks.length === 0) return
    if (!shuffle) toggleShuffle()
    playTracks(playlistTracks, randomStartIndex(playlistTracks.length))
  }

  return (
    <div className="space-y-5">
      <PageHeader title={playlist.name}>
        <PlaylistForm
          initial={{ name: playlist.name }}
          onSubmit={(values) => updatePlaylist(playlist.id, values)}
          trigger={
            <Button variant="outline" size="sm">
              <Pencil />
              Edit
            </Button>
          }
        />
        <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)}>
          <Trash2 />
          Delete
        </Button>
      </PageHeader>

      <div className="flex flex-col gap-3 rounded-xl border bg-card p-3 sm:flex-row sm:items-center">
        <div className="flex min-w-0 items-center gap-3 sm:flex-1">
          <span className="grid size-14 shrink-0 place-items-center rounded-xl bg-accent text-accent-foreground">
            <ListMusic className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">
              {playlistTracks.length} tracks · {formatTotalDuration(playlistTracks)}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              Created {new Date(playlist.createdAt).toLocaleDateString("en-US")}
            </p>
          </div>
        </div>

        {/* stacked on phones so the counts never collide with the actions */}
        <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:shrink-0 sm:items-center">
          <Button
            size="sm"
            className="w-full sm:w-auto"
            disabled={playlistTracks.length === 0}
            onClick={() => playTracks(playlistTracks, 0)}
          >
            <Play />
            Play all
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="w-full sm:w-auto"
            disabled={playlistTracks.length === 0}
            onClick={playFromRandomStart}
          >
            <Shuffle />
            Shuffle
          </Button>
          <AddTrackPopover
            playlistId={playlist.id}
            excludedIds={playlist.trackIds}
            className="col-span-2 w-full sm:w-auto"
          />
        </div>
      </div>

      <TrackList
        tracks={playlistTracks}
        onPlay={(_, index) => playTracks(playlistTracks, index)}
        emptyTitle="This playlist is empty"
        emptyDescription="Add tracks from your library with the Add audio button."
        rowActions={(track: Track, index: number) => (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${track.title}`} />
              }
            >
              <MoreHorizontal />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-50">
              <DropdownMenuItem onClick={() => enqueueNext(track)}>
                <ListPlus />
                Play next
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={index === 0}
                onClick={() => void movePlaylistTrack(playlist.id, index, index - 1).catch(console.error)}
              >
                <ArrowUp />
                Move up
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={index === playlistTracks.length - 1}
                onClick={() => void movePlaylistTrack(playlist.id, index, index + 1).catch(console.error)}
              >
                <ArrowDown />
                Move down
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onClick={() => void removeTrackFromPlaylist(playlist.id, track.id).catch(console.error)}
              >
                <Trash2 />
                Remove from playlist
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      />

      <PlaylistDeleteDialog
        playlist={playlist}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onDeleted={() => navigate("/dashboard")}
      />
    </div>
  )
}