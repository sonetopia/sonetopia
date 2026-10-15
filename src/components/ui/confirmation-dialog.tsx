import { useState, type ReactNode } from "react"
import { CircleAlert, LoaderCircle } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

type ConfirmDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  icon?: ReactNode
  variant?: "default" | "destructive"
  confirmLabel?: string
  cancelLabel?: string
  pendingLabel?: string
  onConfirm: () => void | Promise<void>
}

/**
 * Alert dialog for confirming an action. Owns the pending/error state of
 * `onConfirm`, so an async failure keeps the dialog open and shows the reason
 * instead of closing silently.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  icon,
  variant = "default",
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  pendingLabel = "Working...",
  onConfirm,
}: ConfirmDialogProps) {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleConfirm() {
    if (pending) return
    setPending(true)
    setError(null)
    try {
      await onConfirm()
      onOpenChange(false)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Something went wrong")
    } finally {
      setPending(false)
    }
  }

  return (
    <AlertDialog
      open={open}
      onOpenChange={(nextOpen, eventDetails) => {
        // Keep the dialog locked while the action is running.
        if (!nextOpen && pending) {
          eventDetails.cancel()
          return
        }
        if (!nextOpen) setError(null)
        onOpenChange(nextOpen)
      }}
    >
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          {icon ? (
            <AlertDialogMedia
              className={
                variant === "destructive"
                  ? "bg-destructive/10 text-destructive dark:bg-destructive/20 dark:text-destructive"
                  : undefined
              }
            >
              {icon}
            </AlertDialogMedia>
          ) : null}
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description ? <AlertDialogDescription>{description}</AlertDialogDescription> : null}
        </AlertDialogHeader>

        {error ? (
          <p className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-2 text-xs text-destructive">
            <CircleAlert className="size-3.5 shrink-0" />
            {error}
          </p>
        ) : null}

        <AlertDialogFooter>
          <AlertDialogCancel variant="outline" disabled={pending}>
            {cancelLabel}
          </AlertDialogCancel>
          <AlertDialogAction variant={variant} disabled={pending} onClick={handleConfirm}>
            {pending ? <LoaderCircle className="size-4 animate-spin" /> : null}
            {pending ? pendingLabel : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}