import { useState, type ReactNode } from "react"
import { LoaderCircle } from "lucide-react"
import { notify } from "@/components/ui/notification-toast"
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
 * Alert dialog for confirming an action. Owns the pending state of
 * `onConfirm`, so an async failure keeps the dialog open and reports the
 * reason through a toast instead of closing silently.
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

  async function handleConfirm() {
    if (pending) return
    setPending(true)
    try {
      await onConfirm()
      onOpenChange(false)
    } catch (cause) {
      notify.error(cause instanceof Error ? cause.message : "Something went wrong")
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
