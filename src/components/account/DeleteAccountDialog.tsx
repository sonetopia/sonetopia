import { useState, type FormEvent } from "react"
import { useNavigate } from "react-router-dom"
import { deleteCurrentUser } from "@/api/auth"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { notify } from "@/components/ui/notification-toast"
import { useAuth } from "@/lib/auth"

type DeleteAccountDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DeleteAccountDialog({ open, onOpenChange }: DeleteAccountDialogProps) {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [confirmation, setConfirmation] = useState("")
  const [pending, setPending] = useState(false)

  const email = user?.email ?? ""
  const matches = Boolean(email) && confirmation.trim().toLowerCase() === email.toLowerCase()

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!email || !matches || pending) return

    setPending(true)
    try {
      await deleteCurrentUser()
      notify.success("Your account has been deleted.")
      signOut()
      onOpenChange(false)
      navigate("/", { replace: true })
    } catch (cause) {
      notify.error(cause instanceof Error ? cause.message : "Could not delete your account")
    } finally {
      setPending(false)
    }
  }

  if (!email) return null

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen, eventDetails) => {
        if (!nextOpen && pending) {
          eventDetails.cancel()
          return
        }
        if (!nextOpen) setConfirmation("")
        onOpenChange(nextOpen)
      }}
    >
      <DialogContent className="sm:max-w-md" showCloseButton={!pending}>
        <form className="space-y-5" onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Delete your account</DialogTitle>
            <DialogDescription>
              Your account, uploaded audio, playlists, and all associated data will be
              permanently deleted. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <Field>
            <FieldLabel htmlFor="delete-account-email">Confirm your email</FieldLabel>
            <Input
              id="delete-account-email"
              type="email"
              value={confirmation}
              autoComplete="off"
              disabled={pending}
              onChange={(event) => setConfirmation(event.target.value)}
            />
            <FieldDescription>
              Type <span className="font-medium text-foreground">{email}</span> to confirm.
            </FieldDescription>
          </Field>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="destructive" disabled={!matches || pending}>
              {pending ? "Deleting..." : "Delete account"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
