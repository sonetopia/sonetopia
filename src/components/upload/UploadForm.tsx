import { useRef, useState, type DragEvent, type FormEvent } from "react"
import { cn } from "cn"
import {
  ChevronDown,
  FileAudio,
  HardDriveUpload,
  ImagePlus,
  Link2,
  Trash2,
  Upload,
  X,
} from "lucide-react"
import { fetchAudioByUrl } from "@/api/audio"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { notify } from "@/components/ui/notification-toast"
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
import { getStorageUsage } from "@/api/auth"
import { useAuth } from "@/lib/auth"
import {
  formatDuration,
  KIND_OPTIONS,
  useLibrary,
  type AudioKind,
  type UploadInput,
} from "@/lib/library"
import {
  AUDIO_ACCEPT,
  COVER_ACCEPT,
  audioFileError,
  coverFileError,
  storageQuotaError,
} from "@/lib/storage"

type Draft = {
  id: string
  file: File
  title: string
  author: string
  album: string
  year: string
  kind: AudioKind
  cover: File | null
  open: boolean
}

type FetchedDraft = {
  tempId: string
  sourceUrl: string
  title: string
  author: string
  album: string
  year: string
  kind: AudioKind
  duration: number | null
  fileSize: number | null
  coverFileSize: number | null
}

const stripExtension = (name: string) => name.replace(/\.[^.]+$/, "")
const fileSizeMb = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(1)} MB`

function urlError(value: string) {
  try {
    const url = new URL(value)
    return url.protocol === "http:" || url.protocol === "https:"
      ? null
      : "Only HTTP and HTTPS URLs are supported."
  } catch {
    return "Enter a valid URL."
  }
}

export function UploadForm() {
  const { addFetchedUpload, addUploads } = useLibrary()
  const { user } = useAuth()
  const inputRef = useRef<HTMLInputElement>(null)
  const dragDepth = useRef(0)
  const [drafts, setDrafts] = useState<Draft[]>([])
  const [linkAllId, setLinkAllId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [url, setUrl] = useState("")
  const [fetched, setFetched] = useState<FetchedDraft | null>(null)
  const [fetching, setFetching] = useState(false)
  const [withThumbnail, setWithThumbnail] = useState(true)

  function addFiles(files: File[]) {
    const rejected: string[] = []
    const accepted: Draft[] = []

    for (const file of files) {
      const error = audioFileError(file)
      if (error) {
        rejected.push(error)
        continue
      }
      accepted.push({
        id: crypto.randomUUID(),
        file,
        title: stripExtension(file.name),
        author: "",
        album: "",
        year: "",
        kind: "music",
        cover: null,
        open: true,
      })
    }

    if (rejected.length > 0) {
      notify.error(
        rejected.length === 1 ? rejected[0] : `${rejected.length} files were skipped`,
        rejected.length > 1 ? rejected.join("; ") : undefined
      )
    }
    if (accepted.length) setDrafts((prev) => [...prev, ...accepted])
  }

  function handleDragEnter(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    dragDepth.current += 1
    setDragActive(true)
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    if (event.dataTransfer) event.dataTransfer.dropEffect = "copy"
  }

  function handleDragLeave() {
    dragDepth.current = Math.max(0, dragDepth.current - 1)
    if (dragDepth.current === 0) setDragActive(false)
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    dragDepth.current = 0
    setDragActive(false)
    addFiles(Array.from(event.dataTransfer.files))
  }

  function updateDraft(id: string, patch: Partial<Draft>) {
    setDrafts((prev) => prev.map((draft) => (draft.id === id ? { ...draft, ...patch } : draft)))
  }

  // Shared fields propagate to every draft while this card is the "copy to all" source.
  function applyField(id: string, patch: Partial<Draft>) {
    setDrafts((prev) =>
      prev.map((draft) =>
        draft.id === id || linkAllId === id ? { ...draft, ...patch } : draft
      )
    )
  }

  function toggleLinkAll(id: string) {
    if (linkAllId === id) {
      setLinkAllId(null)
      return
    }
    setLinkAllId(id)
    const source = drafts.find((draft) => draft.id === id)
    if (!source) return
    setDrafts((prev) =>
      prev.map((draft) =>
        draft.id === id
          ? draft
          : {
              ...draft,
              author: source.author,
              album: source.album,
              year: source.year,
              kind: source.kind,
              cover: source.cover,
            }
      )
    )
  }

  function removeDraft(id: string) {
    setDrafts((prev) => prev.filter((draft) => draft.id !== id))
    if (linkAllId === id) setLinkAllId(null)
  }

  function clearAll() {
    setDrafts([])
    setLinkAllId(null)
    if (inputRef.current) inputRef.current.value = ""
  }

  function chooseCover(id: string, input: HTMLInputElement) {
    const file = input.files?.[0] ?? null
    input.value = ""
    if (!file) {
      applyField(id, { cover: null })
      return
    }

    const error = coverFileError(file)
    if (error) {
      notify.error(error)
      return
    }
    applyField(id, { cover: file })
  }

  function updateFetched(patch: Partial<FetchedDraft>) {
    setFetched((prev) => (prev ? { ...prev, ...patch } : prev))
  }

  async function handleFetchUrl() {
    if (fetching || saving) return

    const value = url.trim()
    const error = urlError(value)
    if (error) {
      notify.error(error)
      return
    }

    setFetching(true)
    try {
      const audio = await fetchAudioByUrl(value, withThumbnail)
      setFetched({
        tempId: audio.tempId,
        sourceUrl: value,
        title: audio.title?.trim() || "Untitled",
        author: audio.author?.trim() ?? "",
        album: audio.album?.trim() ?? "",
        year: audio.year != null ? String(audio.year) : "",
        kind: "music",
        duration: audio.duration,
        fileSize: audio.fileSize,
        coverFileSize: audio.coverFileSize,
      })
      notify.success("Audio fetched.")
    } catch (cause) {
      notify.error(cause instanceof Error ? cause.message : "Could not fetch from the provided URL")
    } finally {
      setFetching(false)
    }
  }

  async function handleSaveFetched() {
    if (!fetched || fetching || saving) return

    const title = fetched.title.trim()
    if (!title) {
      notify.error("Title is required.")
      return
    }

    setSaving(true)
    try {
      if (user) {
        const usage = await getStorageUsage({ notifyUnauthorized: false }).catch(() => null)
        const quotaError = usage
          ? storageQuotaError(usage, (fetched.fileSize ?? 0) + (fetched.coverFileSize ?? 0))
          : null
        if (quotaError) {
          notify.error(quotaError)
          return
        }
      }

      await addFetchedUpload({
        tempId: fetched.tempId,
        title,
        artist: fetched.author,
        kind: fetched.kind,
        album: fetched.album.trim() || undefined,
        year: fetched.year.trim() ? Number(fetched.year) : undefined,
      })
      setFetched(null)
      setUrl("")
      notify.success("Audio added to your library.")
    } catch (cause) {
      notify.error(cause instanceof Error ? cause.message : "Could not save the fetched audio")
    } finally {
      setSaving(false)
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (drafts.length === 0 || saving) return

    const inputs: UploadInput[] = drafts.map((draft) => ({
      file: draft.file,
      title: draft.title.trim() || draft.file.name,
      artist: draft.author,
      kind: draft.kind,
      album: draft.album.trim() || undefined,
      year: draft.year.trim() ? Number(draft.year) : undefined,
      cover: draft.cover ?? undefined,
    }))

    const neededBytes = drafts.reduce(
      (total, draft) => total + draft.file.size + (draft.cover?.size ?? 0),
      0
    )

    setSaving(true)
    try {
      if (user) {
        const usage = await getStorageUsage({ notifyUnauthorized: false }).catch(() => null)
        const quotaError = usage ? storageQuotaError(usage, neededBytes) : null
        if (quotaError) {
          notify.error(quotaError)
          return
        }
      }

      const count = await addUploads(inputs)
      setDrafts([])
      setLinkAllId(null)
      notify.success(`${count} file${count === 1 ? "" : "s"} added to your library.`)
      if (inputRef.current) inputRef.current.value = ""
    } catch (cause) {
      notify.error(cause instanceof Error ? cause.message : "Upload failed")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <section className="rounded-xl border bg-card">
        <div className="flex flex-col gap-3 p-4">
          <div className="flex items-center gap-3">
            <span className="hidden size-9 shrink-0 place-items-center rounded-lg bg-accent text-accent-foreground lg:grid">
              <Link2 className="size-4" />
            </span>
            <div className="min-w-0 flex flex-col gap-1">
              <p className="text-sm font-medium">Import from URL</p>
              <p className="text-xs text-muted-foreground">
                This feature utilizes <a href="https://github.com/yt-dlp/yt-dlp" target="_blank" rel="noopener noreferrer" className="text-foreground underline hover:no-underline">yt-dlp</a> as a third-party library to fetch the audio file from the provided URL. Some websites may not be supported.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Input
              type="url"
              inputMode="url"
              maxLength={2048}
              placeholder="https://www.example.com/audio.mp3"
              value={url}
              disabled={fetching || saving}
              onChange={(event) => setUrl(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault()
                  void handleFetchUrl()
                }
              }}
            />
            <Button
              type="button"
              variant="default"
              disabled={fetching || saving || url.trim().length === 0}
              onClick={handleFetchUrl}
            >
              {fetching ? "Fetching..." : "Fetch audio"}
            </Button>
          </div>

          <Field orientation="horizontal">
            <Checkbox
              id="url-import-thumbnail"
              checked={withThumbnail}
              disabled={fetching || saving || fetched !== null}
              onCheckedChange={(checked) => setWithThumbnail(checked === true)}
            />
            <FieldLabel htmlFor="url-import-thumbnail" className="font-normal">
              Fetch thumbnail as cover
            </FieldLabel>
          </Field>
        </div>

        {fetched ? (
          <div className="flex flex-col gap-3 border-t bg-muted/20 p-4">
            <div className="flex items-center gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
                <FileAudio className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium" title={fetched.sourceUrl}>
                  {fetched.title || "Fetched audio"}
                </p>
                <p className="truncate text-[11px] text-muted-foreground">
                  {fetched.fileSize != null ? fileSizeMb(fetched.fileSize) : "Size unknown"} ·{" "}
                  {formatDuration(fetched.duration ?? undefined)}
                  {fetched.coverFileSize != null
                    ? ` · Cover ${fileSizeMb(fetched.coverFileSize)}`
                    : ""}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="Discard fetched audio"
                disabled={saving}
                onClick={() => setFetched(null)}
              >
                <X />
              </Button>
            </div>

            <Field>
              <FieldLabel htmlFor="url-import-title">Title</FieldLabel>
              <Input
                id="url-import-title"
                value={fetched.title}
                maxLength={200}
                disabled={saving}
                onChange={(event) => updateFetched({ title: event.target.value })}
              />
            </Field>
            <FieldGroup>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="url-import-author">Artist / creator</FieldLabel>
                  <Input
                    id="url-import-author"
                    value={fetched.author}
                    maxLength={80}
                    disabled={saving}
                    onChange={(event) => updateFetched({ author: event.target.value })}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="url-import-album">Album</FieldLabel>
                  <Input
                    id="url-import-album"
                    value={fetched.album}
                    maxLength={120}
                    disabled={saving}
                    onChange={(event) => updateFetched({ album: event.target.value })}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="url-import-year">Year</FieldLabel>
                  <Input
                    id="url-import-year"
                    type="number"
                    inputMode="numeric"
                    min={1000}
                    max={9999}
                    value={fetched.year}
                    disabled={saving}
                    onChange={(event) => updateFetched({ year: event.target.value })}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="url-import-kind">Audio type</FieldLabel>
                  <Select
                    items={KIND_OPTIONS}
                    value={fetched.kind}
                    onValueChange={(value) => updateFetched({ kind: value as AudioKind })}
                  >
                    <SelectTrigger id="url-import-kind" className="w-full" disabled={saving}>
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
            <div className="flex justify-end">
              <Button
                type="button"
                disabled={saving || fetching || fetched.title.trim().length === 0}
                onClick={handleSaveFetched}
              >
                <Upload />
                {saving ? "Saving..." : "Save to library"}
              </Button>
            </div>
          </div>
        ) : null}
      </section>

      <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
      <div
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "flex flex-col items-center gap-3 rounded-xl border border-dashed px-6 py-8 text-center transition-all duration-200",
          dragActive
            ? "scale-[1.01] border-primary bg-primary/10 shadow-[0_0_45px_-20px_var(--color-primary)] ring-1 ring-primary/30"
            : "border-border bg-card/60"
        )}
      >
        <span
          className={cn(
            "grid size-11 place-items-center rounded-full transition-colors",
            dragActive ? "bg-primary text-primary-foreground" : "bg-accent text-accent-foreground"
          )}
        >
          <HardDriveUpload className={cn("size-5 transition-transform", dragActive && "scale-110")} />
        </span>
        <div className="space-y-1">
          <p className={cn("text-sm font-medium", dragActive && "text-primary")}>
            {dragActive ? "Release to upload" : "Select your audio to upload"}
          </p>
          <p className="text-xs text-muted-foreground mt-4 mb-1">
            {dragActive
              ? "Drop the files to add them to the list below."
              : "Or drop your files here."}
          </p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={AUDIO_ACCEPT}
          multiple
          className="hidden"
          onChange={(event) => addFiles(Array.from(event.target.files ?? []))}
        />
        <Button type="button" variant="outline" onClick={() => inputRef.current?.click()}>
          <Upload />
          Choose files
        </Button>
      </div>

      {drafts.length > 0 ? (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">
              {drafts.length} file{drafts.length === 1 ? "" : "s"} ready to save
            </p>
            <Button type="button" variant="ghost" size="sm" onClick={clearAll}>
              <X />
              Clear all
            </Button>
          </div>

          <ul className="flex flex-col gap-3">
            {drafts.map((draft) => {
              const linked = linkAllId === draft.id
              return (
                <li key={draft.id} className="overflow-hidden rounded-xl border bg-card">
                  <div className="flex items-center gap-3 p-3">
                    <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
                      <FileAudio className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{draft.title || draft.file.name}</p>
                      <p className="truncate text-[11px] text-muted-foreground">
                        {draft.file.name} - {fileSizeMb(draft.file.size)}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      aria-expanded={draft.open}
                      onClick={() => updateDraft(draft.id, { open: !draft.open })}
                    >
                      <ChevronDown
                        className={cn("transition-transform", draft.open && "rotate-180")}
                      />
                      Details
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Remove ${draft.file.name}`}
                      onClick={() => removeDraft(draft.id)}
                    >
                      <Trash2 />
                    </Button>
                  </div>

                  {draft.open ? (
                    <div className="flex flex-col gap-3 border-t bg-muted/20 p-3">
                      {drafts.length > 1 ? (
                        <Field orientation="horizontal">
                          <Checkbox
                            id={`link-${draft.id}`}
                            checked={linked}
                            onCheckedChange={() => toggleLinkAll(draft.id)}
                          />
                          <FieldLabel htmlFor={`link-${draft.id}`} className="font-normal">
                            Copy these details to every file
                          </FieldLabel>
                        </Field>
                      ) : null}

                      <Field>
                        <FieldLabel htmlFor={`title-${draft.id}`}>Title</FieldLabel>
                        <Input
                          id={`title-${draft.id}`}
                          value={draft.title}
                          maxLength={200}
                          onChange={(event) => updateDraft(draft.id, { title: event.target.value })}
                        />
                      </Field>
                      <FieldGroup>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <Field>
                            <FieldLabel htmlFor={`author-${draft.id}`}>Artist / creator</FieldLabel>
                            <Input
                              id={`author-${draft.id}`}
                              value={draft.author}
                              maxLength={80}
                              onChange={(event) => applyField(draft.id, { author: event.target.value })}
                            />
                          </Field>
                          <Field>
                            <FieldLabel htmlFor={`album-${draft.id}`}>Album</FieldLabel>
                            <Input
                              id={`album-${draft.id}`}
                              value={draft.album}
                              maxLength={120}
                              onChange={(event) => applyField(draft.id, { album: event.target.value })}
                            />
                          </Field>
                          <Field>
                            <FieldLabel htmlFor={`year-${draft.id}`}>Year</FieldLabel>
                            <Input
                              id={`year-${draft.id}`}
                              type="number"
                              inputMode="numeric"
                              min={1000}
                              max={9999}
                              value={draft.year}
                              onChange={(event) => applyField(draft.id, { year: event.target.value })}
                            />
                          </Field>
                          <Field>
                            <FieldLabel htmlFor={`kind-${draft.id}`}>Audio type</FieldLabel>
                            <Select
                              items={KIND_OPTIONS}
                              value={draft.kind}
                              onValueChange={(value) =>
                                applyField(draft.id, { kind: value as AudioKind })
                              }
                            >
                              <SelectTrigger id={`kind-${draft.id}`} className="w-full">
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
                      <Field className="sm:col-span-2">
                        <FieldLabel htmlFor={`cover-${draft.id}`}>Cover image</FieldLabel>
                        <input
                          id={`cover-${draft.id}`}
                          type="file"
                          accept={COVER_ACCEPT}
                          className="hidden"
                          onChange={(event) => chooseCover(draft.id, event.currentTarget)}
                        />
                        <div className="flex min-w-0 items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() =>
                              document.getElementById(`cover-${draft.id}`)?.click()
                            }
                          >
                            <ImagePlus />
                            {draft.cover ? "Change cover" : "Choose cover"}
                          </Button>
                          <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground" title={draft.cover?.name}>
                            {draft.cover ? draft.cover.name : "No cover"}
                          </span>
                        </div>
                      </Field>
                    </div>
                  ) : null}
                </li>
              )
            })}
          </ul>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={drafts.length === 0 || saving}>
          <Upload />
          {saving
            ? "Uploading..."
            : drafts.length > 0
              ? `Save ${drafts.length} file${drafts.length === 1 ? "" : "s"}`
              : "Save to library"}
        </Button>
      </div>
      </form>
    </div>
  )
}
