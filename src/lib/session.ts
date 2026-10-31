import { loadJSON, saveJSON } from "@/lib/persist"

export type AuthUser = {
  id: string
  username: string
  name?: string | null
  email: string
  emailVerifiedAt?: string | null
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

export type SessionSource = {
  token: string
  tokenType?: string
  expiresIn?: number
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

  return session
}

export function sessionFromAuth(auth: SessionSource): AuthSession {
  return {
    token: auth.token,
    tokenType: auth.tokenType || "Bearer",
    expiresAt:
      typeof auth.expiresIn === "number" && auth.expiresIn > 0
        ? Date.now() + auth.expiresIn * 1000
        : 0,
    user: auth.user,
  }
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
