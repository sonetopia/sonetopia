import { useEffect, useState, type FormEvent } from "react"
import { MailCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { notify } from "@/components/ui/notification-toast"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/lib/auth"
import { Field, FieldLabel } from "@/components/ui/field"

export type AuthMode = "sign-in" | "sign-up"

const RESEND_COOLDOWN_SECONDS = 60

function cooldownFromError(message: string) {
  const match = message.match(/wait\s+(\d+)\s+seconds?/i)
  return match ? Number(match[1]) : 0
}

type AuthFormProps = {
  mode: AuthMode
  onModeChange: (mode: AuthMode) => void
  onSuccess?: () => void
}

export function AuthForm({ mode, onModeChange, onSuccess }: AuthFormProps) {
  const { signIn, signUp, resendVerification } = useAuth()
  const isSignUp = mode === "sign-up"
  const [values, setValues] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  })
  const [submitting, setSubmitting] = useState(false)
  const [resending, setResending] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const [verification, setVerification] = useState<{ email: string } | null>(null)

  useEffect(() => {
    if (cooldown <= 0) return
    const timer = window.setTimeout(() => setCooldown((value) => value - 1), 1000)
    return () => window.clearTimeout(timer)
  }, [cooldown])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (submitting) return

    setSubmitting(true)
    try {
      const result = isSignUp ? await signUp(values) : await signIn(values)
      if (!result.ok) {
        notify.error(result.error)
        return
      }

      if (result.verificationRequired) {
        setVerification(result.verificationRequired)
        setCooldown(isSignUp ? RESEND_COOLDOWN_SECONDS : 0)
        return
      }

      onSuccess?.()
    } finally {
      setSubmitting(false)
    }
  }

  async function handleResend() {
    if (!verification || resending || cooldown > 0) return

    setResending(true)
    try {
      const result = await resendVerification(verification.email)
      if (!result.ok) {
        const wait = cooldownFromError(result.error)
        if (wait > 0) setCooldown(wait)
        notify.error(result.error)
        return
      }

      setCooldown(RESEND_COOLDOWN_SECONDS)
      notify.success("Verification email sent.", "Check your inbox for the new link.")
    } finally {
      setResending(false)
    }
  }

  if (verification) {
    return (
      <Card className="w-full max-w-md ring-0">
        <CardHeader className="px-1">
          <span className="mb-2 grid size-10 place-items-center rounded-full bg-primary/10 text-primary">
            <MailCheck className="size-5" />
          </span>
          <CardTitle>Verify your email</CardTitle>
          <CardDescription>
            We sent a verification link to{" "}
            <span className="font-medium text-foreground">{verification.email}</span>. Open it,
            then sign in to start using Sonetopia.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 px-1">
          <Button
            type="button"
            variant="outline"
            className="w-full"
            disabled={resending || cooldown > 0}
            onClick={handleResend}
          >
            {resending
              ? "Sending..."
              : cooldown > 0
                ? `Resend available in ${cooldown}s`
                : "Resend verification email"}
          </Button>
          <Button
            type="button"
            className="w-full"
            onClick={() => {
              setVerification(null)
              setCooldown(0)
              onModeChange("sign-in")
            }}
          >
            Back to sign in
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md ring-0">
      <CardHeader className="px-1">
        <CardTitle>{isSignUp ? "Create your library" : "Welcome back"}</CardTitle>
        <CardDescription>
          {isSignUp
            ? "One account for your own audio. Nothing is public, ever."
            : "Sign in to reach your library, playlists, and queue."}
        </CardDescription>
      </CardHeader>
      <CardContent className="px-1">
        <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
          {isSignUp ? (
            <Field>
              <FieldLabel htmlFor="auth-name">Name</FieldLabel>
              <Input
                id="auth-name"
                value={values.name}
                autoComplete="name"
                placeholder="Your name"
                required
                maxLength={100}
                onChange={(event) =>
                  setValues((prev) => ({ ...prev, name: event.target.value }))
                }
              />
            </Field>
          ) : null}

          <Field>
            <FieldLabel htmlFor="auth-username">Username</FieldLabel>
            <Input
              id="auth-username"
              value={values.username}
              autoComplete="username"
              placeholder="Your username"
              required
              minLength={3}
              maxLength={50}
              onChange={(event) =>
                setValues((prev) => ({ ...prev, username: event.target.value }))
              }
            />
          </Field>

          {isSignUp ? (
            <Field>
              <FieldLabel htmlFor="auth-email">Email</FieldLabel>
              <Input
                id="auth-email"
                type="email"
                value={values.email}
                autoComplete="email"
                placeholder="you@example.com"
                required
                onChange={(event) =>
                  setValues((prev) => ({ ...prev, email: event.target.value }))
                }
              />
            </Field>
          ) : null}

          <Field>
            <FieldLabel htmlFor="auth-password">Password</FieldLabel>
            <Input
              id="auth-password"
              type="password"
              value={values.password}
              autoComplete={isSignUp ? "new-password" : "current-password"}
              placeholder={isSignUp ? "At least 6 characters" : "Your password"}
              required
              minLength={isSignUp ? 6 : undefined}
              maxLength={isSignUp ? 100 : undefined}
              onChange={(event) =>
                setValues((prev) => ({ ...prev, password: event.target.value }))
              }
            />
          </Field>

          {isSignUp ? (
            <Field>
              <FieldLabel htmlFor="auth-confirm">Confirm password</FieldLabel>
              <Input
                id="auth-confirm"
                type="password"
                value={values.confirmPassword}
                autoComplete="new-password"
                placeholder="Repeat your password"
                required
                minLength={6}
                maxLength={100}
                onChange={(event) =>
                  setValues((prev) => ({ ...prev, confirmPassword: event.target.value }))
                }
              />
            </Field>
          ) : null}

          <Button type="submit" className="mt-2" disabled={submitting}>
            {submitting
              ? isSignUp
                ? "Creating account..."
                : "Signing in..."
              : isSignUp
                ? "Create account"
                : "Sign in"}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="px-2 py-1 justify-between text-xs text-muted-foreground border-0 bg-card">
        <span>
          {isSignUp ? "Already have an account?" : "New to Sonetopia?"}{" "}
          <button
            type="button"
            className="font-medium text-primary hover:underline"
            onClick={() => onModeChange(isSignUp ? "sign-in" : "sign-up")}
          >
            {isSignUp ? "Sign in" : "Create account"}
          </button>
        </span>
      </CardFooter>
    </Card>
  )
}
