import { useState, type FormEvent, type ReactElement } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export type PlaylistFormValues = {
  name: string
}

type PlaylistFormProps = {
  trigger: ReactElement
  initial?: PlaylistFormValues
  submitLabel?: string
  onSubmit: (values: PlaylistFormValues) => void
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
  const isValid = values.name.trim().length > 0

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (next) setValues(initial ?? { name: "" })
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!isValid) return
    onSubmit({ name: values.name.trim() })
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={trigger} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initial ? "Edit playlist" : "New playlist"}</DialogTitle>
          <DialogDescription>
            Playlists only store references to your audio, so no file is duplicated.
          </DialogDescription>
        </DialogHeader>
        <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="playlist-name">Name</Label>
            <Input
              id="playlist-name"
              value={values.name}
              maxLength={60}
              autoFocus
              placeholder="For example: Deep Work"
              onChange={(event) => setValues((prev) => ({ ...prev, name: event.target.value }))}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!isValid}>
              {submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}