import { loadJSON, saveJSON } from "@/lib/persist"

export type AuthUser = {
  id: string
  username: string
  email: string
  storageUsed?: number | null
  isAdmin?: boolean | null
  createdAt?: string | null
  updatedAt?: string | null
}

export type AuthSession = {
  token: string
  tokenType: string
  expiresAt: number
  user: AuthUser
}

export const SESSION_KEY = "sonetopia:session"
export const UNAUTHORIZED_EVENT = "sonetopia:unauthorized"

export function getStoredSession(): AuthSession | null {
  const session = loadJSON<AuthSession | null>(SESSION_KEY, null)
  if (!session) return null

  if (typeof session.token !== "string" || !session.user) {
    clearSession()
    return null
  }

  if (session.expiresAt > 0 && session.expiresAt <= Date.now()) {
    clearSession()
    return null
  }

  return session
}

export function saveSession(session: AuthSession) {
  saveJSON(SESSION_KEY, session)
}

export function clearSession() {
  saveJSON(SESSION_KEY, null)
}

export function getAccessToken() {
  return getStoredSession()?.token
}

export function notifyUnauthorized() {
  clearSession()
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(UNAUTHORIZED_EVENT))
  }
}
