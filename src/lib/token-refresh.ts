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

const REFRESH_LOCK = "sonetopia:token-refresh"

async function rotate(staleToken: string) {
  const current = getStoredSession()
  if (!current) return false
  // Another tab rotated the cookie while this one waited for the lock; reusing the
  // old refresh token would be treated as theft and revoke the whole token family.
  if (current.token !== staleToken) return true

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

async function performRefresh() {
  const staleToken = getStoredSession()?.token
  if (!staleToken) return false
  if (typeof navigator !== "undefined" && navigator.locks) {
    return navigator.locks.request(REFRESH_LOCK, () => rotate(staleToken))
  }
  return rotate(staleToken)
}

/**
 * Single-flight refresh so concurrent 401s share one rotation request. The backend rotates
 * the refresh cookie and revokes the family on reuse, so tabs also serialize via Web Locks.
 */
export function refreshAccessToken() {
  refreshPromise ??= performRefresh().finally(() => {
    refreshPromise = null
  })
  return refreshPromise
}
