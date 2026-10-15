const API_BASE = (import.meta.env.VITE_API_BASE_URL || "/api/v1").replace(/\/+$/, "")
const API_ORIGIN = /^https?:\/\//i.test(API_BASE) ? new URL(API_BASE).origin : null

export const apiUrl = (path: string) => `${API_BASE}${path.startsWith("/") ? "" : "/"}${path}`

export type WebResponse<T> = {
  data: T | null
  errors: string | null
}

export async function request<T>(path: string, init?: RequestInit): Promise<T | null> {
  const response = await fetch(apiUrl(path), {
    ...init,
    headers: { Accept: "application/json", ...init?.headers },
  })

  if (!response.ok) {
    throw new Error(`Request failed (${response.status}) for ${path}`)
  }

  const text = await response.text()
  if (!text) return null

  const body = JSON.parse(text) as WebResponse<T>
  if (body.errors) throw new Error(body.errors)

  return body.data
}

/** Resolve a (usually absolute-path) signed URL from the API into a loadable media URL. */
export function mediaUrl(signedUrl?: string | null) {
  if (!signedUrl) return undefined
  if (/^https?:\/\//i.test(signedUrl)) return signedUrl
  if (!API_ORIGIN) return signedUrl
  return `${API_ORIGIN}${signedUrl.startsWith("/") ? "" : "/"}${signedUrl}`
}