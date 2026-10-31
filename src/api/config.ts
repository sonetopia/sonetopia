const API_BASE = (import.meta.env.VITE_API_BASE_URL || "/api/v1").replace(/\/+$/, "")
const API_ORIGIN = /^https?:\/\//i.test(API_BASE) ? new URL(API_BASE).origin : null
const API_ROOT = API_BASE.replace(/\/v1$/i, "")

const joinUrl = (base: string, path: string) =>
  `${base}${path.startsWith("/") ? "" : "/"}${path}`

export const apiUrl = (path: string) => joinUrl(API_BASE, path)
export const apiRootUrl = (path: string) => joinUrl(API_ROOT, path)

/** Resolve a (usually absolute-path) signed URL from the API into a loadable media URL. */
export function mediaUrl(signedUrl?: string | null) {
  if (!signedUrl) return undefined
  if (/^https?:\/\//i.test(signedUrl)) return signedUrl
  if (!API_ORIGIN) return signedUrl
  return `${API_ORIGIN}${signedUrl.startsWith("/") ? "" : "/"}${signedUrl}`
}
