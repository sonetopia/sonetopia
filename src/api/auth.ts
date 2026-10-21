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
  username: string
  email: string
  password: string
}

export type UpdateUserInput = {
  username: string
  email: string
  password?: string
  currentPassword?: string
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
