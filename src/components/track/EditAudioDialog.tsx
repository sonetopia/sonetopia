import { useEffect, useRef, useState, type FormEvent } from "react"
import { ImagePlus } from "lucide-react"
import { getAudio, getAudioCover } from "@/api/audio"
import { getStorageUsage } from "@/api/auth"
import { Button } from "@/components/ui/button"
import { notify } from "@/components/ui/notification-toast"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  Field,
  FieldLabel,
  FieldGroup
} from "@/components/ui/field"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { KIND_OPTIONS, useLibrary, type AudioKind, type Track } from "@/lib/library"
import { COVER_ACCEPT, coverFileError, storageQuotaError } from "@/lib/storage"

const FORM_ID = "edit-audio-form"

type EditAudioDialogProps = {
  track: Track
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditAudioDialog({ track, open, onOpenChange }: EditAudioDialogProps) {
  const { updateTrack } = useLibrary()
  const coverRef = useRef<HTMLInputElement>(null)
  const audioRef = useRef<HTMLInputElement>(null)

  const [title, setTitle] = useState("")
  const [author, setAuthor] = useState("")
  const [album, setAlbum] = useState("")
  const [year, setYear] = useState("")
  const [kind, setKind] = useState<AudioKind>("other")
  const [cover, setCover] = useState<File | null>(null)
  const [replacement, setReplacement] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    let cancelled = false

    setTitle(track.title)
    setKind(track.kind)
    setAuthor("")
    setAlbum("")
    setYear("")
    setCover(null)
    setReplacement(null)
    setLoading(true)
    if (coverRef.current) coverRef.current.value = ""
    if (audioRef.current) audioRef.current.value = ""

    getAudio(track.id)
      .then((audio) => {
        if (cancelled) return
        setTitle(audio.title)
        setAuthor(audio.author ?? "")
        setAlbum(audio.album ?? "")
        setYear(audio.year != null ? String(audio.year) : "")
      })
      .catch((cause: unknown) => {
        if (!cancelled) {
          notify.error(cause instanceof Error ? cause.message : "Could not load this audio")
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [open, track.id, track.kind, track.title])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (saving || title.trim().length === 0) return

    setSaving(true)
    try {
      if (cover) {
        const [usage, previousCoverSize] = await Promise.all([
          getStorageUsage({ notifyUnauthorized: false }).catch(() => null),
          getAudioCover(track.id)
            .then((current) => current.fileSize ?? 0)
            .catch(() => 0),
        ])
        const quotaError = usage
          ? storageQuotaError(usage, Math.max(0, cover.size - previousCoverSize))
          : null
        if (quotaError) {
          notify.error(quotaError)
          return
        }
      }

      await updateTrack(track.id, {
        title: title.trim(),
        type: kind,
        author: author.trim() || undefined,
        album: album.trim() || undefined,
        year: year.trim() ? Number(year) : undefined,
        cover: cover ?? undefined,
        file: replacement ?? undefined,
      })
      onOpenChange(false)
    } catch (cause) {
      notify.error(cause instanceof Error ? cause.message : "Could not save changes")
    } finally {
      setSaving(false)
    }
  }

  function chooseCover(input: HTMLInputElement) {
    const file = input.files?.[0] ?? null
    input.value = ""
    if (!file) {
      setCover(null)
      return
    }

    const error = coverFileError(file)
    if (error) {
      notify.error(error)
      return
    }
    setCover(file)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit audio</DialogTitle>
        </DialogHeader>

        <form id={FORM_ID} className="flex min-w-0 flex-col gap-3" onSubmit={handleSubmit}>
          <Field>
            <FieldLabel htmlFor="edit-title">Title</FieldLabel>
            <Input
              id="edit-title"
              value={title}
              required
              maxLength={200}
              disabled={loading}
              onChange={(event) => setTitle(event.target.value)}
            />
          </Field>

          <FieldGroup>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="edit-author">Artist / creator</FieldLabel>
                <Input
                  id="edit-author"
                  value={author}
                  maxLength={80}
                  disabled={loading}
                  onChange={(event) => setAuthor(event.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="edit-album">Album</FieldLabel>
                <Input
                  id="edit-album"
                  value={album}
                  maxLength={120}
                  disabled={loading}
                  onChange={(event) => setAlbum(event.target.value)}
                />
              </Field>
            </div>
          </FieldGroup>

          <FieldGroup>
            <div className="grid gap-3 grid-cols-2">
              <Field>
                <FieldLabel htmlFor="edit-year">Year</FieldLabel>
                <Input
                  id="edit-year"
                  type="number"
                  inputMode="numeric"
                  min={1000}
                  max={9999}
                  value={year}
                  disabled={loading}
                  onChange={(event) => setYear(event.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="edit-type">Audio type</FieldLabel>
                <Select
                  items={KIND_OPTIONS}
                  value={kind}
                  onValueChange={(value) => setKind(value as AudioKind)}
                >
                  <SelectTrigger id="edit-type" className="w-full" disabled={loading}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {KIND_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
            </div>
          </FieldGroup>

          <Field>
            <FieldLabel htmlFor="edit-cover">Cover image</FieldLabel>
            <input
              id="edit-cover"
              ref={coverRef}
              type="file"
              accept={COVER_ACCEPT}
              className="hidden"
              onChange={(event) => chooseCover(event.currentTarget)}
            />
            <div className="flex min-w-0 items-center gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={loading}
                onClick={() => coverRef.current?.click()}
              >
                <ImagePlus />
                {cover ? "Change cover" : "Replace cover"}
              </Button>
              <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground" title={cover?.name}>
                {cover ? cover.name : "Leave empty to keep the current cover"}
              </span>
            </div>
          </Field>

        </form>

        <DialogFooter>
          <Button type="button" variant="outline" disabled={saving} onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form={FORM_ID} disabled={saving || loading || title.trim().length === 0}>
            {saving ? "Saving..." : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
