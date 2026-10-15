import { ConfirmDialog } from "@/components/ui/confirmation-dialog"
import { useLibrary, type Track } from "@/lib/library"
import { Trash2Icon } from "lucide-react"

type TrackDeleteDialogProps = {
  track: Track
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TrackDeleteDialog({ track, open, onOpenChange }: TrackDeleteDialogProps) {
  const { removeTrack } = useLibrary()

  return (
    <ConfirmDialog
      open={open}
      variant="destructive"
      onOpenChange={onOpenChange}
      icon={<Trash2Icon />}
      title="Delete Track"
      description={`Are you sure you want to delete "${track?.title}"? This action cannot be undone.`}
      confirmLabel="Delete"
      onConfirm={() => removeTrack(track.id)}
      pendingLabel="Deleting..."
    />
  );
}