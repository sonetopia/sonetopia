import { apiRootUrl, apiUrl, mediaUrl } from "@/api/config"
import { getAccessToken, getStoredSession, notifyUnauthorized } from "@/lib/session"
import { refreshAccessToken } from "@/lib/token-refresh"

export { apiRootUrl, apiUrl, mediaUrl }

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
  notifyUnauthorized?: boolean
  credentials?: RequestCredentials
}

async function send<T>(
  url: string,
  init: RequestInit | undefined,
  options: RequestOptions = {}
): Promise<T | null> {
  const canRefresh = options.authenticated !== false
  let refreshed = false

  while (true) {
    const headers = new Headers(init?.headers)
    if (!headers.has("Accept")) headers.set("Accept", "application/json")

    const token = options.authenticated === false ? null : getAccessToken()
    if (token) headers.set("Authorization", `Bearer ${token}`)
    else headers.delete("Authorization")

    const response = await fetch(url, { ...init, headers, credentials: options.credentials })
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
      if (response.status === 401 && canRefresh) {
        if (!refreshed && getStoredSession() && (await refreshAccessToken())) {
          refreshed = true
          continue
        }
        if (options.notifyUnauthorized !== false) notifyUnauthorized()
      }
      throw new ApiError(body?.errors || `Request failed (${response.status})`, response.status)
    }

    if (body?.errors) throw new ApiError(body.errors, response.status)

    return body?.data ?? null
  }
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
