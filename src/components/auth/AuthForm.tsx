import { useEffect, useRef, useState, type FormEvent } from "react"
import { MailCheck } from "lucide-react"
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton"
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
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useAuth } from "@/lib/auth"
import { isGithubOAuthConfigured, startGithubOAuth } from "@/lib/github-oauth"
import { Field, FieldLabel } from "@/components/ui/field"

export type AuthMode = "sign-in" | "sign-up"

const RESEND_COOLDOWN_SECONDS = 60

function GithubMark() {
  return (
    <svg className="size-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 .3a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2c-3.3.7-4-1.6-4-1.6-.5-1.4-1.3-1.8-1.3-1.8-1.1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1.1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.8-1.6-2.7-.3-5.5-1.3-5.5-5.9 0-1.3.5-2.4 1.2-3.2-.1-.3-.5-1.5.1-3.2 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0c2.3-1.5 3.3-1.2 3.3-1.2.6 1.7.2 2.9.1 3.2.8.8 1.2 1.9 1.2 3.2 0 4.6-2.8 5.6-5.5 5.9.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A12 12 0 0 0 12 .3Z" />
    </svg>
  )
}

function AppleMark() {
  return (
    <svg className="size-7" viewBox="0 0 28 28" fill="currentColor" aria-hidden="true">
      <path d="M16.4 12.8c0-2.8 2.3-4.1 2.4-4.2-1.3-1.9-3.4-2.2-4.1-2.2-1.8-.2-3.4 1-4.3 1-.9 0-2.2-1-3.7-1-1.9 0-3.6 1.1-4.6 2.8-2 3.4-.5 8.5 1.4 11.3 1 1.4 2.1 2.9 3.6 2.8 1.4-.1 2-.9 3.7-.9s2.2.9 3.7.9c1.5 0 2.5-1.4 3.4-2.8 1.1-1.6 1.5-3.1 1.5-3.2-.1 0-3-.1-3-4.5ZM13.6 4.6c.8-1 1.3-2.3 1.2-3.6-1.2.1-2.6.8-3.4 1.8-.7.9-1.4 2.2-1.2 3.5 1.3.1 2.6-.7 3.4-1.7Z" />
    </svg>
  )
}

function cooldownFromError(message: string) {
  const match = message.match(/wait\s+(\d+)\s+seconds?/i)
  return match ? Number(match[1]) : 0
}

type AuthFormProps = {
  mode: AuthMode
  onModeChange: (mode: AuthMode) => void
  onSuccess?: () => void
  onVerificationChange?: (active: boolean) => void
}

export function AuthForm({
  mode,
  onModeChange,
  onSuccess,
  onVerificationChange,
}: AuthFormProps) {
  const { signIn, signUp, signInWithGoogle, resendVerification } = useAuth()
  const googleClientId = (import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined)?.trim()
  const githubConfigured = isGithubOAuthConfigured()
  const isSignUp = mode === "sign-up"
  const [values, setValues] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  })
  const [submitting, setSubmitting] = useState(false)
  const [googleSubmitting, setGoogleSubmitting] = useState(false)
  const [appleTooltipOpen, setAppleTooltipOpen] = useState(false)
  const [resending, setResending] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const [verification, setVerification] = useState<{ email: string } | null>(null)
  const googleSubmittingRef = useRef(false)

  useEffect(() => {
    if (cooldown <= 0) return
    const timer = window.setTimeout(() => setCooldown((value) => value - 1), 1000)
    return () => window.clearTimeout(timer)
  }, [cooldown])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (submitting || googleSubmittingRef.current) return

    setSubmitting(true)
    try {
      const result = isSignUp ? await signUp(values) : await signIn(values)
      if (!result.ok) {
        notify.error(result.error)
        return
      }

      if (result.verificationRequired) {
        showVerification(result.verificationRequired)
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

  async function handleGoogleCredential(credential: string) {
    if (googleSubmittingRef.current || submitting) return

    googleSubmittingRef.current = true
    setGoogleSubmitting(true)
    try {
      const result = await signInWithGoogle(credential)
      if (!result.ok) {
        notify.error(result.error)
        return
      }

      if (result.verificationRequired) {
        showVerification(result.verificationRequired)
        setCooldown(0)
        return
      }

      onSuccess?.()
    } finally {
      googleSubmittingRef.current = false
      setGoogleSubmitting(false)
    }
  }

  function handleGithubSignIn() {
    if (!githubConfigured) {
      notify.error("GitHub sign-in is not configured.")
      return
    }

    try {
      startGithubOAuth()
    } catch (cause) {
      notify.error(cause instanceof Error ? cause.message : "Could not start GitHub sign-in.")
    }
  }

  function showVerification(next: { email: string } | null) {
    setVerification(next)
    onVerificationChange?.(next !== null)
  }

  if (verification) {
    return (
      <Card className="mx-auto w-full max-w-md ring-0">
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
              showVerification(null)
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

  const googleButton = googleClientId ? (
    <GoogleSignInButton
      clientId={googleClientId}
      disabled={googleSubmitting || submitting}
      onCredential={handleGoogleCredential}
    />
  ) : null

  return (
    <Card
      className={
        isSignUp
          ? "grid w-full max-w-4xl gap-0 overflow-hidden p-0 ring-0 md:grid-cols-[minmax(0,1fr)_22rem]"
          : "w-full max-w-md ring-0"
      }
    >
      <div className={isSignUp ? "flex min-w-0 flex-col p-5 sm:p-6" : "contents"}>
      <CardHeader className={isSignUp ? "px-0 pt-0" : "px-1"}>
        <CardTitle>{isSignUp ? "Create your library" : "Welcome back"}</CardTitle>
        <CardDescription>
          {isSignUp
            ? "One account for your own audio. Nothing is public, ever."
            : "Sign in to reach your library, playlists, and queue."}
        </CardDescription>
      </CardHeader>
      <CardContent className={isSignUp ? "px-0 pt-5" : "px-1"}>
        {!isSignUp && (googleClientId || githubConfigured) ? (
          <div className="mb-4 space-y-3">
            {googleClientId ? (
              <div className="mx-auto w-full max-w-[400px]">
                {googleButton}
              </div>
            ) : null}
            <div className="mx-auto w-full max-w-[400px]">
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="h-10 w-full justify-start rounded-sm gap-3 px-3"
                disabled={submitting || googleSubmitting}
                onClick={handleGithubSignIn}
              >
                <GithubMark />
                <div className="flex w-full justify-center">
                  Continue with GitHub
                </div>
              </Button>
            </div>
            <div className="mx-auto w-full max-w-[400px]">
              <Tooltip open={appleTooltipOpen} onOpenChange={setAppleTooltipOpen}>
                <TooltipTrigger
                  delay={0}
                  render={
                    <span
                      className="block w-full"
                      tabIndex={0}
                      onPointerEnter={() => setAppleTooltipOpen(true)}
                      onPointerLeave={() => setAppleTooltipOpen(false)}
                    />
                  }
                >
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    className="h-10 w-full justify-start rounded-sm gap-3 px-3"
                    disabled
                  >
                    <AppleMark />
                    <div className="flex w-full justify-center">
                      Continue with Apple
                    </div>
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="data-open:animate-none data-closed:animate-none">
                  Apple sign-in is coming soon.
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="flex items-center gap-3 text-[11px] uppercase tracking-wide text-muted-foreground mt-5">
              <span className="h-px flex-1 bg-border" />
              or
              <span className="h-px flex-1 bg-border" />
            </div>
          </div>
        ) : null}
        <form
          className={isSignUp ? "grid gap-3 sm:grid-cols-2" : "flex flex-col gap-3"}
          onSubmit={handleSubmit}
        >
          {isSignUp ? (
            <Field className="sm:col-span-2">
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

          <Button
            type="submit"
            className={isSignUp ? "mt-2 sm:col-span-2" : "mt-2"}
            disabled={submitting || googleSubmitting}
          >
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
      <CardFooter
        className={
          isSignUp
            ? "mt-auto justify-between border-0 bg-transparent px-0 pt-5 pb-0 text-xs text-muted-foreground"
            : "justify-between border-0 bg-card px-2 py-1 text-xs text-muted-foreground"
        }
      >
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
      </div>
      {isSignUp ? (
        <aside className="hidden min-w-0 flex-col gap-8 border-border bg-muted/30 p-5 sm:p-6 md:flex md:border-l">
          <div className="flex flex-1 flex-col justify-center">
            <div className="flex flex-col justify-center w-full items-center gap-1.5 pb-5">
              <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-background p-1.5 ring-1 ring-border">
                <img
                  src="/logo-orange-small.png"
                  alt="Sonetopia"
                  className="size-full object-contain"
                />
              </span>
              <span className="block font-heading text-lg font-semibold leading-tight">
                Sonetopia
              </span>
            </div>
            <p className="mb-2 text-xs leading-relaxed text-muted-foreground">
              Use an account you already have.
            </p>
            <div className="flex w-full flex-col gap-2">
              {googleButton}
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="h-10 w-full justify-start rounded-sm gap-3 px-3"
                disabled={submitting || googleSubmitting}
                onClick={handleGithubSignIn}
              >
                <GithubMark />
                <div className="flex w-full justify-center">
                  Continue with GitHub
                </div>
              </Button>
              <Tooltip open={appleTooltipOpen} onOpenChange={setAppleTooltipOpen}>
                <TooltipTrigger
                  delay={0}
                  render={
                    <span
                      className="block w-full"
                      tabIndex={0}
                      onPointerEnter={() => setAppleTooltipOpen(true)}
                      onPointerLeave={() => setAppleTooltipOpen(false)}
                    />
                  }
                >
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    className="h-10 w-full justify-start rounded-sm gap-3 px-3"
                    disabled
                  >
                    <AppleMark />
                    <div className="flex w-full justify-center">
                      Continue with Apple
                    </div>
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="data-open:animate-none data-closed:animate-none">
                  Apple sign-in is coming soon.
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </aside>
      ) : null}
    </Card>
  )
}
