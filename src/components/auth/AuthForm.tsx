import { useState, type FormEvent } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { CircleAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
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

type AuthFormProps = {
  mode: "sign-in" | "sign-up"
}

export function AuthForm({ mode }: AuthFormProps) {
  const { signIn, signUp } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const isSignUp = mode === "sign-up"
  const [values, setValues] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  })
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (submitting) return

    setError("")
    setSubmitting(true)
    try {
      const result = isSignUp ? await signUp(values) : await signIn(values)
      if (!result.ok) {
        setError(result.error)
        return
      }

      const from = (location.state as { from?: string } | null)?.from
      navigate(from?.startsWith("/") ? from : "/dashboard", { replace: true })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>{isSignUp ? "Create your library" : "Welcome back"}</CardTitle>
        <CardDescription>
          {isSignUp
            ? "One account for your own audio. Nothing is public, ever."
            : "Sign in to reach your library, playlists, and queue."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
          <Field className="flex flex-col gap-1.5">
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
            <Field className="flex flex-col gap-1.5">
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

          <Field className="flex flex-col gap-1.5">
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
            <Field className="flex flex-col gap-1.5">
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

          {error ? (
            <p
              role="alert"
              className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-2.5 text-xs text-destructive"
            >
              <CircleAlert className="size-3.5 shrink-0" />
              {error}
            </p>
          ) : null}

          <Button type="submit" className="mt-1" disabled={submitting}>
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
      <CardFooter className="justify-between gap-2 text-xs text-muted-foreground">
        <span>
          {isSignUp ? "Already have an account?" : "New to Sonetopia?"}{" "}
          <Link
            to={isSignUp ? "/login" : "/register"}
            className="font-medium text-primary hover:underline"
          >
            {isSignUp ? "Sign in" : "Create account"}
          </Link>
        </span>
      </CardFooter>
    </Card>
  )
}
