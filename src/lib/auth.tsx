import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import {
  getCurrentUser,
  login as loginRequest,
  register as registerRequest,
  resendVerification as resendVerificationRequest,
  updateCurrentUser as updateCurrentUserRequest,
  type AuthResponse,
  type UpdateUserInput,
} from "@/api/auth"
import {
  clearSession,
  getStoredSession,
  saveSession,
  UNAUTHORIZED_EVENT,
  type AuthSession,
  type AuthUser,
} from "@/lib/session"

export type User = AuthUser

export type AuthResult =
  | { ok: true; verificationRequired?: { email: string } }
  | { ok: false; error: string }

type AuthValue = {
  user?: User
  loading: boolean
  signUp: (input: {
    name: string
    username: string
    email: string
    password: string
    confirmPassword: string
  }) => Promise<AuthResult>
  signIn: (input: { username: string; password: string }) => Promise<AuthResult>
  resendVerification: (email: string) => Promise<AuthResult>
  updateProfile: (input: UpdateUserInput) => Promise<AuthResult>
  signOut: () => void
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const AuthContext = createContext<AuthValue | null>(null)

function toSession(auth: AuthResponse): AuthSession {
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

function errorMessage(cause: unknown) {
  return cause instanceof Error ? cause.message : "Something went wrong. Please try again."
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | undefined>(() => getStoredSession()?.user)
  const [loading, setLoading] = useState(() => Boolean(getStoredSession()))

  const applyAuthResponse = useCallback((auth: AuthResponse) => {
    const next = toSession(auth)
    saveSession(next)
    setUser(next.user)
    setLoading(false)
  }, [])

  useEffect(() => {
    let cancelled = false
    try {
      localStorage.removeItem("sonetopia:users")
    } catch {
      void 0
    }
    const stored = getStoredSession()

    if (!stored) return

    getCurrentUser()
      .then((currentUser) => {
        if (cancelled) return
        const next = { ...stored, user: currentUser }
        saveSession(next)
        setUser(currentUser)
      })
      .catch(() => {
        if (cancelled) return
        clearSession()
        setUser(undefined)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const handleUnauthorized = () => {
      setUser(undefined)
      setLoading(false)
    }
    window.addEventListener(UNAUTHORIZED_EVENT, handleUnauthorized)
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, handleUnauthorized)
  }, [])

  const signUp = useCallback<AuthValue["signUp"]>(
    async (input) => {
      const name = input.name.trim()
      const username = input.username.trim()
      const email = input.email.trim().toLowerCase()

      if (!name) return { ok: false, error: "Please enter your name." }
      if (name.length > 100)
        return { ok: false, error: "Name must be at most 100 characters." }
      if (username.length < 3 || username.length > 50)
        return { ok: false, error: "Username must be between 3 and 50 characters." }
      if (!EMAIL_PATTERN.test(email))
        return { ok: false, error: "Please enter a valid email address." }
      if (input.password.length < 6)
        return { ok: false, error: "Password must be at least 6 characters." }
      if (input.password.length > 100)
        return { ok: false, error: "Password must be at most 100 characters." }
      if (input.password !== input.confirmPassword)
        return { ok: false, error: "Passwords do not match." }

      try {
        const auth = await registerRequest({ name, username, email, password: input.password })
        if (!auth.user.emailVerifiedAt) {
          return { ok: true, verificationRequired: { email: auth.user.email } }
        }
        applyAuthResponse(auth)
        return { ok: true }
      } catch (cause) {
        return { ok: false, error: errorMessage(cause) }
      }
    },
    [applyAuthResponse]
  )

  const signIn = useCallback<AuthValue["signIn"]>(
    async (input) => {
      const username = input.username.trim()
      if (!username) return { ok: false, error: "Please enter your username." }
      if (!input.password) return { ok: false, error: "Please enter your password." }

      try {
        const auth = await loginRequest({ username, password: input.password })
        if (!auth.user.emailVerifiedAt) {
          return { ok: true, verificationRequired: { email: auth.user.email } }
        }
        applyAuthResponse(auth)
        return { ok: true }
      } catch (cause) {
        return { ok: false, error: errorMessage(cause) }
      }
    },
    [applyAuthResponse]
  )

  const updateProfile = useCallback<AuthValue["updateProfile"]>(async (input) => {
    const name = input.name.trim()
    const username = input.username.trim()

    if (!name) return { ok: false, error: "Please enter your name." }
    if (name.length > 100)
      return { ok: false, error: "Name must be at most 100 characters." }
    if (username.length < 3 || username.length > 50)
      return { ok: false, error: "Username must be between 3 and 50 characters." }
    if (input.password && (!input.currentPassword || !input.currentPassword.trim()))
      return { ok: false, error: "Enter your current password to set a new password." }
    if (input.password && input.password.length < 6)
      return { ok: false, error: "Password must be at least 6 characters." }
    if (input.password && input.password.length > 100)
      return { ok: false, error: "Password must be at most 100 characters." }

    try {
      const updated = await updateCurrentUserRequest({
        name,
        username,
        password: input.password || undefined,
        currentPassword: input.password ? input.currentPassword : undefined,
      })
      const stored = getStoredSession()
      if (stored) saveSession({ ...stored, user: updated })
      setUser(updated)
      return { ok: true }
    } catch (cause) {
      return { ok: false, error: errorMessage(cause) }
    }
  }, [])

  const resendVerification = useCallback<AuthValue["resendVerification"]>(async (email) => {
    const normalized = email.trim().toLowerCase()
    if (!EMAIL_PATTERN.test(normalized)) {
      return { ok: false, error: "Please enter a valid email address." }
    }

    try {
      await resendVerificationRequest({ email: normalized })
      return { ok: true }
    } catch (cause) {
      return { ok: false, error: errorMessage(cause) }
    }
  }, [])

  const signOut = useCallback(() => {
    clearSession()
    setUser(undefined)
    setLoading(false)
  }, [])

  const value = useMemo<AuthValue>(
    () => ({ user, loading, signUp, signIn, resendVerification, updateProfile, signOut }),
    [user, loading, signUp, signIn, resendVerification, updateProfile, signOut]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuth must be used inside AuthProvider")
  return context
}
