import { Trash2Icon } from "lucide-react"
import { ConfirmDialog } from "@/components/ui/confirmation-dialog"
import { useLibrary, type Playlist } from "@/lib/library"

type PlaylistDeleteDialogProps = {
  /** Null while the dialog is closed, so the parent can keep it mounted. */
  playlist: Playlist | null
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Called after the playlist was deleted on the server. */
  onDeleted?: () => void
}

export function PlaylistDeleteDialog({
  playlist,
  open,
  onOpenChange,
  onDeleted,
}: PlaylistDeleteDialogProps) {
  const { deletePlaylist } = useLibrary()

  return (
    <ConfirmDialog
      open={open}
      variant="destructive"
      onOpenChange={onOpenChange}
      icon={<Trash2Icon />}
      title="Delete playlist"
      description={`Are you sure you want to delete "${playlist?.name ?? "this playlist"}"? The audio files stay in your library.`}
      confirmLabel="Delete"
      pendingLabel="Deleting..."
      onConfirm={async () => {
        if (!playlist) return
        await deletePlaylist(playlist.id)
        onDeleted?.()
      }}
    />
  )
}