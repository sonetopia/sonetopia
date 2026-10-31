import { apiRootUrl } from "@/api/config"
import {
  getStoredSession,
  saveSession,
  sessionFromAuth,
  type SessionSource,
} from "@/lib/session"

type RefreshResponse = {
  data: SessionSource | null
  errors: string | null
}

let refreshPromise: Promise<boolean> | null = null

async function performRefresh() {
  if (!getStoredSession()) return false

  try {
    const response = await fetch(apiRootUrl("/auth/refresh"), {
      method: "POST",
      credentials: "include",
      headers: { Accept: "application/json" },
    })
    const text = await response.text()
    const body = text ? (JSON.parse(text) as RefreshResponse) : null

    if (!response.ok || !body?.data?.token || !body.data.user) return false

    saveSession(sessionFromAuth(body.data))
    return true
  } catch {
    return false
  }
}

/** Single-flight refresh so concurrent 401s share one rotation request. */
export function refreshAccessToken() {
  refreshPromise ??= performRefresh().finally(() => {
    refreshPromise = null
  })
  return refreshPromise
}
