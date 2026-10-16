import { useState, type FormEvent, type ReactElement } from "react"
import { CircleAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Field, FieldLabel } from "@/components/ui/field"

export type PlaylistFormValues = {
  name: string
}

type PlaylistFormProps = {
  trigger: ReactElement
  initial?: PlaylistFormValues
  submitLabel?: string
  /** Awaited: the dialog only closes when saving succeeded. */
  onSubmit: (values: PlaylistFormValues) => void | Promise<void>
}

export function PlaylistForm({
  trigger,
  initial,
  submitLabel = "Save",
  onSubmit,
}: PlaylistFormProps) {
  const [open, setOpen] = useState(false)
  const [values, setValues] = useState<PlaylistFormValues>(
    initial ?? { name: "" }
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isValid = values.name.trim().length > 0

  function handleOpenChange(next: boolean) {
    if (saving) return
    setOpen(next)
    if (next) {
      setValues(initial ?? { name: "" })
      setError(null)
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!isValid || saving) return

    setSaving(true)
    setError(null)
    try {
      await onSubmit({ name: values.name.trim() })
      setOpen(false)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save the playlist")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={trigger} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initial ? "Edit playlist" : "New playlist"}</DialogTitle>
        </DialogHeader>
        <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
          <Field className="flex flex-col gap-1.5">
            <FieldLabel htmlFor="playlist-name">Name</FieldLabel>
            <Input
              id="playlist-name"
              value={values.name}
              maxLength={60}
              autoFocus
              disabled={saving}
              autoComplete="off"
              onChange={(event) => setValues((prev) => ({ ...prev, name: event.target.value }))}
            />
          </Field>

          {error ? (
            <p className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-2 text-xs text-destructive">
              <CircleAlert className="size-3.5 shrink-0" />
              {error}
            </p>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={saving}
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!isValid || saving}>
              {saving ? "Saving..." : submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}