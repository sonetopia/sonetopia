import { useEffect, useRef, useState, type FormEvent } from "react"
import { useNavigate } from "react-router-dom"
import { Download, FileAudio, Link2, LoaderCircle, Search, Upload, X } from "lucide-react"
import { fetchAudioByUrl, type AudioSearchResult } from "@/api/audio"
import { getStorageUsage } from "@/api/auth"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { notify } from "@/components/ui/notification-toast"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useAuth } from "@/lib/auth"
import { formatDuration, KIND_OPTIONS, useLibrary, type AudioKind } from "@/lib/library"
import { storageQuotaError } from "@/lib/storage"
import { SearchResults } from "@/components/upload/SearchResults"
import { useAudioSearch } from "@/lib/audio-search"
import { friendlyImportError, isTempAudioExpired } from "@/lib/fetch-errors"

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

const URL_LIKE = /^https?:\/\//i

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

export function OnlineImport() {
  const { addFetchedUpload } = useLibrary()
  const { user } = useAuth()
  const navigate = useNavigate()
  const reviewRef = useRef<HTMLDivElement>(null)
  const [blockedId, setBlockedId] = useState<string | null>(null)

  const [input, setInput] = useState("")
  const [withThumbnail, setWithThumbnail] = useState(true)
  const { state: searchState, search, loadMore, retry, reset, markInLibrary } = useAudioSearch()
  const [fetching, setFetching] = useState<string | null>(null)
  const [fetched, setFetched] = useState<FetchedDraft | null>(null)
  const [saving, setSaving] = useState(false)

  const trimmed = input.trim()
  const isLink = URL_LIKE.test(trimmed)
  const busy = fetching !== null || saving

  // The loading dialog blocks interaction, so freeze page scroll behind it too.
  useEffect(() => {
    if (!fetching) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [fetching])

  // Bring the review form into view once an import finishes (the results list is long).
  const fetchedId = fetched?.tempId
  useEffect(() => {
    if (fetchedId) reviewRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" })
  }, [fetchedId])

  function updateFetched(patch: Partial<FetchedDraft>) {
    setFetched((prev) => (prev ? { ...prev, ...patch } : prev))
  }

  function clearInput() {
    setInput("")
    reset()
  }

  async function importUrl(url: string, label: string) {
    if (busy) return

    const error = urlError(url)
    if (error) {
      notify.error(error)
      return
    }

    setFetching(label)
    try {
      const audio = await fetchAudioByUrl(url, withThumbnail)
      setFetched({
        tempId: audio.tempId,
        sourceUrl: url,
        title: audio.title?.trim() || "Untitled",
        author: audio.author?.trim() ?? "",
        album: audio.album?.trim() ?? "",
        year: audio.year != null ? String(audio.year) : "",
        kind: "music",
        duration: audio.duration,
        fileSize: audio.fileSize,
        coverFileSize: audio.coverFileSize,
      })
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Could not fetch from the provided URL"
      notify.error(friendlyImportError(message))
    } finally {
      setFetching(null)
    }
  }

  function runInput() {
    if (isLink) void importUrl(trimmed, trimmed)
    else search(trimmed)
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!trimmed || busy) return
    // The review form replaces the results, so a silent search would look like a no-op.
    if (fetched) {
      setBlockedId(fetched.tempId)
      reviewRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" })
      return
    }
    runInput()
  }

  function discardAndContinue() {
    setFetched(null)
    setBlockedId(null)
    runInput()
  }

  async function handleSaveFetched() {
    if (!fetched || busy) return

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

      const audioId = await addFetchedUpload({
        tempId: fetched.tempId,
        title,
        artist: fetched.author,
        kind: fetched.kind,
        album: fetched.album.trim() || undefined,
        year: fetched.year.trim() ? Number(fetched.year) : undefined,
      })
      const sourceUrl = fetched.sourceUrl
      markInLibrary(sourceUrl, audioId)
      setFetched(null)
      if (isLink) setInput("")
      notify.success("Audio added to your library.", undefined, {
        children: "View",
        onClick: () => {
          navigate("/library")
        },
      })
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Could not save the fetched audio"
      if (isTempAudioExpired(message)) {
        setFetched(null)
        notify.error("This fetched audio has expired. Please fetch it again.")
      } else {
        notify.error(message)
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="rounded-xl border bg-card">
      <form className="flex flex-col gap-3 p-4" onSubmit={handleSubmit}>
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium">Search or paste a link</p>
          <p className="text-xs text-muted-foreground">
            Find a song by name, or paste a link to import its audio. Powered by{" "}
            <a
              href="https://github.com/yt-dlp/yt-dlp"
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground underline hover:no-underline"
            >
              yt-dlp
            </a>
            ; some sites may not be supported.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            {isLink ? (
              <Link2 className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            ) : (
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            )}
            <Input
              type="text"
              inputMode="search"
              enterKeyHint={isLink ? "go" : "search"}
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              maxLength={2048}
              aria-label="Search for audio or paste a link"
              placeholder="Song, artist, or https://…"
              value={input}
              disabled={busy}
              className="pr-9 pl-9"
              onChange={(event) => setInput(event.target.value)}
            />
            {input ? (
              <button
                type="button"
                aria-label="Clear"
                disabled={busy}
                onClick={clearInput}
                className="absolute top-1/2 right-2 grid size-6 -translate-y-1/2 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            ) : null}
          </div>
          <Button type="submit" disabled={busy || searchState.status === "loading" || trimmed.length === 0}>
            {isLink ? <Download /> : <Search />}
            {isLink ? "Fetch audio" : searchState.status === "loading" ? "Searching..." : "Search"}
          </Button>
        </div>

        <Field orientation="horizontal">
          <Checkbox
            id="online-import-thumbnail"
            checked={withThumbnail}
            disabled={busy || fetched !== null}
            onCheckedChange={(checked) => setWithThumbnail(checked === true)}
          />
          <FieldLabel htmlFor="online-import-thumbnail" className="font-normal">
            Use thumbnail as cover
          </FieldLabel>
        </Field>
      </form>

      {fetched ? (
        <div ref={reviewRef} className="flex flex-col gap-3 border-t bg-muted/20 p-4">
          {blockedId === fetched.tempId ? (
            <div
              role="alert"
              className="flex flex-col gap-2 rounded-lg border border-primary/30 bg-primary/10 p-3 text-sm sm:flex-row sm:items-center"
            >
              <p className="min-w-0 flex-1">
                Save or discard this audio first to continue with “{trimmed}”.
              </p>
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setBlockedId(null)}>
                  Keep editing
                </Button>
                <Button type="button" size="sm" disabled={busy} onClick={discardAndContinue}>
                  Discard and continue
                </Button>
              </div>
            </div>
          ) : null}
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
                {fetched.coverFileSize != null ? ` · Cover ${fileSizeMb(fetched.coverFileSize)}` : ""}
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
              disabled={busy || fetched.title.trim().length === 0}
              onClick={handleSaveFetched}
            >
              <Upload />
              {saving ? "Saving..." : "Save to library"}
            </Button>
          </div>
        </div>
      ) : (
        <SearchResults
          state={searchState}
          busy={busy}
          onImport={(item: AudioSearchResult) =>
            void importUrl(item.url, item.title?.trim() || item.url)
          }
          onLoadMore={loadMore}
          onRetry={retry}
        />
      )}

      {fetching ? (
        <div
          role="status"
          aria-live="polite"
          className="fixed inset-0 z-[100] grid place-items-center bg-background/85 px-4 backdrop-blur-sm"
        >
          <div className="flex w-full max-w-xs flex-col items-center gap-3 rounded-xl border bg-card p-6 text-center shadow-lg">
            <LoaderCircle className="size-8 animate-spin text-primary" />
            <div className="flex flex-col gap-1">
              <p className="font-medium">Fetching audio...</p>
              <p className="text-sm text-muted-foreground">
                Downloading and preparing the file. Keep this page open.
              </p>
            </div>
            <p className="max-w-full truncate text-xs text-muted-foreground" title={fetching}>
              {fetching}
            </p>
          </div>
        </div>
      ) : null}
    </section>
  )
}
