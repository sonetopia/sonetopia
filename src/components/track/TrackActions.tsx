import { useState } from "react"
import { Info, ListMusic, ListPlus, MoreHorizontal, Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { usePlayer } from "@/components/player/PlayerProvider"
import { useLibrary, type Track } from "@/lib/library"
import { EditAudioDialog } from "@/components/track/EditAudioDialog"
import { TrackDetailsDialog } from "@/components/track/TrackDetailsDialog"
import { TrackDeleteDialog } from "@/components/track/TrackDeleteDialog"

export function TrackActions({ track }: { track: Track }) {
  const { playlists, addTrackToPlaylist } = useLibrary()
  const { enqueueNext, addToQueue } = usePlayer()
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)

  return (
    <>
      <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="ghost" size="icon-sm" aria-label={`Actions for ${track.title}`} />}
      >
        <MoreHorizontal />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-40" align="end">
        <DropdownMenuItem onClick={() => enqueueNext(track)}>
          <ListPlus />
          Play next
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => addToQueue(track)}>
          <ListMusic />
          Add to queue
        </DropdownMenuItem>
        {playlists.length > 0 ? (
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <ListMusic />
              Add to playlist
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              {playlists.map((playlist) => (
                <DropdownMenuItem
                  key={playlist.id}
                  disabled={playlist.trackIds.includes(track.id)}
                  onClick={() => addTrackToPlaylist(playlist.id, track.id)}
                >
                  {playlist.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        ) : null}
        <DropdownMenuItem onClick={() => setDetailsOpen(true)}>
          <Info />
          Show details
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setEditOpen(true)}>
          <Pencil />
          Edit
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={() => setDeleteOpen(true)}>
          <Trash2 />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
      </DropdownMenu>
      <TrackDetailsDialog track={track} open={detailsOpen} onOpenChange={setDetailsOpen} />
      <TrackDeleteDialog track={track} open={deleteOpen} onOpenChange={setDeleteOpen} />
      <EditAudioDialog track={track} open={editOpen} onOpenChange={setEditOpen} />
    </>
  )
}