import { getAccessToken, notifyUnauthorized } from "@/lib/session"

const API_BASE = (import.meta.env.VITE_API_BASE_URL || "/api/v1").replace(/\/+$/, "")
const API_ORIGIN = /^https?:\/\//i.test(API_BASE) ? new URL(API_BASE).origin : null
const API_ROOT = API_BASE.replace(/\/v1$/i, "")

const joinUrl = (base: string, path: string) =>
  `${base}${path.startsWith("/") ? "" : "/"}${path}`

export const apiUrl = (path: string) => joinUrl(API_BASE, path)
export const apiRootUrl = (path: string) => joinUrl(API_ROOT, path)

export type WebResponse<T> = {
  data: T | null
  errors: string | null
}

export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = "ApiError"
    this.status = status
  }
}

type RequestOptions = {
  authenticated?: boolean
}

async function send<T>(
  url: string,
  init: RequestInit | undefined,
  options: RequestOptions = {}
): Promise<T | null> {
  const headers = new Headers(init?.headers)
  if (!headers.has("Accept")) headers.set("Accept", "application/json")

  const token = options.authenticated === false ? null : getAccessToken()
  if (token) headers.set("Authorization", `Bearer ${token}`)

  const response = await fetch(url, { ...init, headers })
  const text = await response.text()
  let body: WebResponse<T> | null = null

  if (text) {
    try {
      body = JSON.parse(text) as WebResponse<T>
    } catch {
      if (response.ok) throw new Error("The API returned an invalid response")
    }
  }

  if (!response.ok) {
    if (response.status === 401 && options.authenticated !== false) {
      notifyUnauthorized()
    }
    throw new ApiError(body?.errors || `Request failed (${response.status})`, response.status)
  }

  if (body?.errors) throw new ApiError(body.errors, response.status)

  return body?.data ?? null
}

export async function request<T>(path: string, init?: RequestInit): Promise<T | null> {
  return send<T>(apiUrl(path), init)
}

export async function requestRoot<T>(
  path: string,
  init?: RequestInit,
  options?: RequestOptions
): Promise<T | null> {
  return send<T>(apiRootUrl(path), init, options)
}

/** Resolve a (usually absolute-path) signed URL from the API into a loadable media URL. */
export function mediaUrl(signedUrl?: string | null) {
  if (!signedUrl) return undefined
  if (/^https?:\/\//i.test(signedUrl)) return signedUrl
  if (!API_ORIGIN) return signedUrl
  return `${API_ORIGIN}${signedUrl.startsWith("/") ? "" : "/"}${signedUrl}`
}
