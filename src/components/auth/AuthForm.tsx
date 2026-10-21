import { useState, type FormEvent } from "react"
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

type AuthFormProps = {
  mode: AuthMode
  onModeChange: (mode: AuthMode) => void
  onSuccess?: () => void
}

export function AuthForm({ mode, onModeChange, onSuccess }: AuthFormProps) {
  const { signIn, signUp } = useAuth()
  const isSignUp = mode === "sign-up"
  const [values, setValues] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  })
  const [submitting, setSubmitting] = useState(false)

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

      onSuccess?.()
    } finally {
      setSubmitting(false)
    }
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
