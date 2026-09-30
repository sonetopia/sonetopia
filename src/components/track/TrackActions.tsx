import { ListMusic, ListPlus, MoreHorizontal, Trash2 } from "lucide-react"
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

export function TrackActions({ track }: { track: Track }) {
  const { playlists, addTrackToPlaylist, removeTrack } = useLibrary()
  const { enqueueNext, addToQueue } = usePlayer()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="ghost" size="icon-sm" aria-label={`Actions for ${track.title}`} />}
      >
        <MoreHorizontal />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-50" align="end">
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
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={() => removeTrack(track.id)}>
          <Trash2 />
          Remove from library
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}