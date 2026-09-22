import { useRef, useState, type DragEvent, type FormEvent } from "react"
import { CircleAlert, FileAudio, HardDriveUpload, Upload, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { KIND_OPTIONS, useLibrary, type AudioKind, type UploadInput } from "@/lib/library"

const MAX_SIZE = 200 * 1024 * 1024

type Draft = {
  id: string
  file: File
  title: string
}

const stripExtension = (name: string) => name.replace(/\.[^.]+$/, "")

function parseTags(value: string) {
  return value
    .split(",")
    .map((tag) => tag.trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 5)
}

export function UploadForm() {
  const { addUploads } = useLibrary()
  const inputRef = useRef<HTMLInputElement>(null)
  const [drafts, setDrafts] = useState<Draft[]>([])
  const [artist, setArtist] = useState("")
  const [kind, setKind] = useState<AudioKind>("music")
  const [tags, setTags] = useState("")
  const [errors, setErrors] = useState<string[]>([])
  const [savedCount, setSavedCount] = useState(0)

  function addFiles(files: File[]) {
    const rejected: string[] = []
    const accepted: Draft[] = []

    for (const file of files) {
      if (!file.type.startsWith("audio/")) {
        rejected.push(`${file.name} — not an audio file`)
        continue
      }
      if (file.size > MAX_SIZE) {
        rejected.push(`${file.name} — larger than 200 MB`)
        continue
      }
      accepted.push({
        id: crypto.randomUUID(),
        file,
        title: stripExtension(file.name),
      })
    }

    setErrors(rejected)
    setSavedCount(0)
    if (accepted.length) setDrafts((prev) => [...prev, ...accepted])
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    addFiles(Array.from(event.dataTransfer.files))
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (drafts.length === 0) return

    const inputs: UploadInput[] = drafts.map((draft) => ({
      file: draft.file,
      title: draft.title,
      artist,
      kind,
      tags: parseTags(tags),
    }))

    const count = addUploads(inputs)
    setDrafts([])
    setSavedCount(count)
    if (inputRef.current) inputRef.current.value = ""
  }

  return (
    <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
      <div
        onDragOver={(event) => event.preventDefault()}
        onDrop={handleDrop}
        className="flex flex-col items-center gap-3 rounded-xl border border-dashed bg-card/60 px-6 py-10 text-center"
      >
        <span className="grid size-11 place-items-center rounded-full bg-accent text-accent-foreground">
          <HardDriveUpload className="size-5" />
        </span>
        <div className="space-y-1">
          <p className="text-sm font-medium">Drop audio files here</p>
          <p className="text-xs text-muted-foreground">
            Music, podcasts, instrumentals, audiobooks, or ambience · up to 200 MB per file
          </p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="audio/*"
          multiple
          className="hidden"
          onChange={(event) => addFiles(Array.from(event.target.files ?? []))}
        />
        <Button type="button" variant="outline" onClick={() => inputRef.current?.click()}>
          <Upload />
          Choose files
        </Button>
      </div>

      {errors.length > 0 ? (
        <ul className="flex flex-col gap-1 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">
          {errors.map((error) => (
            <li key={error} className="flex items-center gap-2">
              <CircleAlert className="size-3.5" />
              {error}
            </li>
          ))}
        </ul>
      ) : null}

      {drafts.length > 0 ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">{drafts.length} file{drafts.length === 1 ? "" : "s"} ready to save</p>
            <Button type="button" variant="ghost" size="sm" onClick={() => setDrafts([])}>
              <X />
              Clear
            </Button>
          </div>
          <ul className="flex flex-col gap-2">
            {drafts.map((draft) => (
              <li
                key={draft.id}
                className="flex items-center gap-3 rounded-xl border bg-card p-2.5"
              >
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
                  <FileAudio className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <Input
                    value={draft.title}
                    aria-label={`Title for ${draft.file.name}`}
                    onChange={(event) =>
                      setDrafts((prev) =>
                        prev.map((item) =>
                          item.id === draft.id ? { ...item, title: event.target.value } : item
                        )
                      )
                    }
                  />
                  <p className="mt-1 truncate text-[11px] text-muted-foreground">
                    {draft.file.name} · {(draft.file.size / 1024 / 1024).toFixed(1)} MB
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Remove ${draft.file.name}`}
                  onClick={() => setDrafts((prev) => prev.filter((item) => item.id !== draft.id))}
                >
                  <X />
                </Button>
              </li>
            ))}
          </ul>

          <div className="grid gap-3 rounded-xl border bg-card p-3 sm:grid-cols-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="upload-artist">Artist / creator</Label>
              <Input
                id="upload-artist"
                value={artist}
                maxLength={80}
                placeholder="Optional"
                onChange={(event) => setArtist(event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="upload-kind">Audio type</Label>
              <Select
                items={KIND_OPTIONS}
                value={kind}
                onValueChange={(value) => setKind(value as AudioKind)}
              >
                <SelectTrigger id="upload-kind" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {KIND_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="upload-tags">Tags</Label>
              <Input
                id="upload-tags"
                value={tags}
                placeholder="focus, chill"
                onChange={(event) => setTags(event.target.value)}
              />
            </div>
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={drafts.length === 0}>
          <Upload />
          {drafts.length > 0 ? `Save ${drafts.length} file${drafts.length === 1 ? "" : "s"}` : "Save to library"}
        </Button>
        {savedCount > 0 ? (
          <p className="text-xs text-muted-foreground">
            {savedCount} file{savedCount === 1 ? "" : "s"} added to your library.
          </p>
        ) : null}
      </div>
    </form>
  )
}