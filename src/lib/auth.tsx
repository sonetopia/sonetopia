import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import { loadJSON, saveJSON } from "@/lib/persist"

export type User = {
  id: string
  name: string
  email: string
}

type Account = User & { password: string }

export type AuthResult = { ok: true } | { ok: false; error: string }

type AuthValue = {
  user?: User
  signUp: (input: {
    name: string
    email: string
    password: string
    confirmPassword: string
  }) => AuthResult
  signIn: (input: { email: string; password: string }) => AuthResult
  signOut: () => void
}

// ponytail: placeholder auth — accounts sit in localStorage in plain text until the Spring API ships
const USERS_KEY = "sonetopia:users"
const SESSION_KEY = "sonetopia:session"
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const AuthContext = createContext<AuthValue | null>(null)

const toUser = ({ id, name, email }: Account): User => ({ id, name, email })

export function AuthProvider({ children }: { children: ReactNode }) {
  const [accounts, setAccounts] = useState<Account[]>(() => loadJSON<Account[]>(USERS_KEY, []))
  const [user, setUser] = useState<User | undefined>(() => {
    const sessionId = loadJSON<string | null>(SESSION_KEY, null)
    if (!sessionId) return undefined
    const account = loadJSON<Account[]>(USERS_KEY, []).find((item) => item.id === sessionId)
    return account ? toUser(account) : undefined
  })

  useEffect(() => saveJSON(USERS_KEY, accounts), [accounts])

  const signUp = useCallback<AuthValue["signUp"]>(
    (input) => {
      const name = input.name.trim()
      const email = input.email.trim().toLowerCase()

      if (name.length < 2) return { ok: false, error: "Please enter your name." }
      if (!EMAIL_PATTERN.test(email))
        return { ok: false, error: "Please enter a valid email address." }
      if (input.password.length < 8)
        return { ok: false, error: "Password must be at least 8 characters." }
      if (input.password !== input.confirmPassword)
        return { ok: false, error: "Passwords do not match." }
      if (accounts.some((account) => account.email === email))
        return { ok: false, error: "An account with this email already exists." }

      const account: Account = {
        id: crypto.randomUUID(),
        name,
        email,
        password: input.password,
      }
      setAccounts((prev) => [...prev, account])
      saveJSON(SESSION_KEY, account.id)
      setUser(toUser(account))
      return { ok: true }
    },
    [accounts]
  )

  const signIn = useCallback<AuthValue["signIn"]>(
    (input) => {
      const email = input.email.trim().toLowerCase()
      const account = accounts.find((item) => item.email === email)

      // never reveal which field was wrong
      if (!account || account.password !== input.password)
        return { ok: false, error: "Email or password is incorrect." }

      saveJSON(SESSION_KEY, account.id)
      setUser(toUser(account))
      return { ok: true }
    },
    [accounts]
  )

  const signOut = useCallback(() => {
    saveJSON(SESSION_KEY, null)
    setUser(undefined)
  }, [])

  const value = useMemo<AuthValue>(
    () => ({ user, signUp, signIn, signOut }),
    [user, signUp, signIn, signOut]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuth must be used inside AuthProvider")
  return context
}