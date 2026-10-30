import { ConfirmDialog } from "@/components/ui/confirmation-dialog"
import { useLibrary, type Track } from "@/lib/library"
import { usePlayer } from "@/components/player/PlayerProvider"
import { Trash2Icon } from "lucide-react"

type TrackDeleteDialogProps = {
  track: Track
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TrackDeleteDialog({ track, open, onOpenChange }: TrackDeleteDialogProps) {
  const { removeTrack } = useLibrary()
  const { removeTrackFromQueue } = usePlayer()

  return (
    <ConfirmDialog
      open={open}
      variant="destructive"
      onOpenChange={onOpenChange}
      icon={<Trash2Icon />}
      title="Delete Track"
      description={`Are you sure you want to delete "${track?.title}"? This action cannot be undone.`}
      confirmLabel="Delete"
      onConfirm={async () => {
        await removeTrack(track.id)
        removeTrackFromQueue(track.id)
      }}
      pendingLabel="Deleting..."
    />
  )
}