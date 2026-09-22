import { useState, type FormEvent } from "react"
import { Link, useNavigate } from "react-router-dom"
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
import { Label } from "@/components/ui/label"
import { useAuth } from "@/lib/auth"

type AuthFormProps = {
  mode: "sign-in" | "sign-up"
}

export function AuthForm({ mode }: AuthFormProps) {
  const { signIn, signUp } = useAuth()
  const navigate = useNavigate()
  const isSignUp = mode === "sign-up"
  const [values, setValues] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  })
  const [error, setError] = useState("")

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const result = isSignUp ? signUp(values) : signIn(values)
    if (!result.ok) {
      setError(result.error)
      return
    }
    navigate("/dashboard", { replace: true })
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
          {isSignUp ? (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="auth-name">Name</Label>
              <Input
                id="auth-name"
                value={values.name}
                autoComplete="name"
                placeholder="Your name"
                onChange={(event) =>
                  setValues((prev) => ({ ...prev, name: event.target.value }))
                }
              />
            </div>
          ) : null}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="auth-email">Email</Label>
            <Input
              id="auth-email"
              type="email"
              value={values.email}
              autoComplete="email"
              placeholder="you@example.com"
              onChange={(event) => setValues((prev) => ({ ...prev, email: event.target.value }))}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="auth-password">Password</Label>
            <Input
              id="auth-password"
              type="password"
              value={values.password}
              autoComplete={isSignUp ? "new-password" : "current-password"}
              placeholder={isSignUp ? "At least 8 characters" : "Your password"}
              onChange={(event) =>
                setValues((prev) => ({ ...prev, password: event.target.value }))
              }
            />
          </div>

          {isSignUp ? (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="auth-confirm">Confirm password</Label>
              <Input
                id="auth-confirm"
                type="password"
                value={values.confirmPassword}
                autoComplete="new-password"
                placeholder="Repeat your password"
                onChange={(event) =>
                  setValues((prev) => ({ ...prev, confirmPassword: event.target.value }))
                }
              />
            </div>
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

          <Button type="submit" className="mt-1">
            {isSignUp ? "Create account" : "Sign in"}
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