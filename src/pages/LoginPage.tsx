import { AuthForm } from "@/components/auth/AuthForm"

export function LoginPage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-6 px-4 py-12 sm:py-20">
      <AuthForm mode="sign-in" />
    </div>
  )
}