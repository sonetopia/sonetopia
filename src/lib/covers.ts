import { getAudioCover, mediaUrl, type AudioResponse } from "@/api/audio"
import {
  readCachedCover,
  removeCachedCover,
  writeCachedCover,
} from "@/lib/cover-cache"

/**
 * Object URLs are handed to tracks as `coverUrl`, so they must outlive renders.
 * Keyed by audio id + cover version and revoked when the cover is replaced.
 */
const objectUrls = new Map<string, { version: number; url: string }>()

/**
 * Cover resolution flow:
 * 1. no cover version -> no request at all;
 * 2. matching IndexedDB entry -> reuse the cached blob (no request);
 * 3. version mismatch -> fetch the signed URL + blob and refresh the cache.
 */
export async function resolveCoverUrl(audio: AudioResponse): Promise<string | undefined> {
  const version = audio.coverVersion ?? 0
  if (version <= 0) {
    releaseCoverUrl(audio.id)
    void removeCachedCover(audio.id)
    return undefined
  }

  const cached = await readCachedCover(audio.id)
  if (cached && cached.coverVersion === version) {
    return objectUrlFor(audio.id, version, cached.blob)
  }

  const cover = await getAudioCover(audio.id).catch(() => null)
  if (!cover?.signedUrl) {
    // API hiccup: keep showing the previous cover if there is one.
    return cached ? objectUrlFor(audio.id, cached.coverVersion, cached.blob) : undefined
  }

  const blob = await fetchCoverBlob(cover.signedUrl)
  if (!blob) {
    // Could not read the bytes (offline/CORS): fall back to the signed URL.
    releaseCoverUrl(audio.id)
    return mediaUrl(cover.signedUrl)
  }

  const freshVersion = cover.coverVersion ?? version
  await writeCachedCover({
    audioId: audio.id,
    coverVersion: freshVersion,
    blob,
    mimeType: cover.mimeType ?? null,
    cachedAt: Date.now(),
  })
  return objectUrlFor(audio.id, freshVersion, blob)
}

export function releaseCoverUrl(audioId: string) {
  const current = objectUrls.get(audioId)
  if (!current) return
  URL.revokeObjectURL(current.url)
  objectUrls.delete(audioId)
}

/** Audio deleted: drop the object URL and the cached blob. */
export async function forgetCover(audioId: string) {
  releaseCoverUrl(audioId)
  await removeCachedCover(audioId)
}

function objectUrlFor(audioId: string, version: number, blob: Blob) {
  const current = objectUrls.get(audioId)
  if (current && current.version === version) return current.url
  if (current) URL.revokeObjectURL(current.url)
  const url = URL.createObjectURL(blob)
  objectUrls.set(audioId, { version, url })
  return url
}

async function fetchCoverBlob(signedUrl: string): Promise<Blob | null> {
  for (const target of coverFetchTargets(signedUrl)) {
    try {
      const response = await fetch(target)
      if (!response.ok) continue
      // guards against SPA fallbacks answering 200 with HTML
      if (!(response.headers.get("content-type") ?? "").startsWith("image/")) continue
      const blob = await response.blob()
      if (blob.size > 0) return blob
    } catch {
      // try the next target
    }
  }
  return null
}

/** Same-origin path first (works behind the dev proxy), then the absolute URL. */
function coverFetchTargets(signedUrl: string) {
  const resolved = mediaUrl(signedUrl)
  if (!resolved) return []
  try {
    const url = new URL(resolved, window.location.href)
    if (url.origin === window.location.origin) return [url.href]
    return [`${url.pathname}${url.search}`, url.href]
  } catch {
    return [resolved]
  }
}