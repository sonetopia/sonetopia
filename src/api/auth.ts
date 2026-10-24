import { requestRoot } from "@/api/client"
import type { AuthUser } from "@/lib/session"
import type { StorageUsage } from "@/lib/storage"

export type UserResponse = AuthUser

export type AuthResponse = {
  token: string
  tokenType: string
  expiresIn: number
  user: UserResponse
}

export type LoginInput = {
  username: string
  password: string
}

export type RegisterInput = {
  name: string
  username: string
  email: string
  password: string
}

export type UpdateUserInput = {
  name: string
  username: string
  password?: string
  currentPassword?: string
}

export type ResendVerificationInput = {
  email: string
}

export type GoogleLoginInput = {
  idToken: string
}

export async function login(input: LoginInput) {
  const auth = await requestRoot<AuthResponse>(
    "/auth/login",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    },
    { authenticated: false }
  )
  if (!auth) throw new Error("Login failed")
  return auth
}

export async function register(input: RegisterInput) {
  const auth = await requestRoot<AuthResponse>(
    "/auth/register",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    },
    { authenticated: false }
  )
  if (!auth) throw new Error("Registration failed")
  return auth
}

export async function loginWithGoogle(input: GoogleLoginInput) {
  const auth = await requestRoot<AuthResponse>(
    "/auth/google",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    },
    { authenticated: false }
  )
  if (!auth) throw new Error("Google sign-in failed")
  return auth
}

export async function verifyEmail(token: string) {
  const message = await requestRoot<string>(
    `/auth/verify-email?token=${encodeURIComponent(token)}`,
    undefined,
    { authenticated: false }
  )
  if (!message) throw new Error("Email verification failed")
  return message
}

export async function resendVerification(input: ResendVerificationInput) {
  const message = await requestRoot<string>(
    "/auth/resend-verification",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    },
    { authenticated: false }
  )
  if (!message) throw new Error("Could not resend the verification email")
  return message
}

export async function getCurrentUser() {
  const user = await requestRoot<UserResponse>("/me")
  if (!user) throw new Error("Could not load your account")
  return user
}

export async function getStorageUsage(options?: { notifyUnauthorized?: boolean }) {
  const usage = await requestRoot<StorageUsage>("/me/storage", undefined, options)
  if (!usage) throw new Error("Could not load storage usage")
  return usage
}

export async function updateCurrentUser(input: UpdateUserInput) {
  const user = await requestRoot<UserResponse>("/me", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  })
  if (!user) throw new Error("Could not update your account")
  return user
}
