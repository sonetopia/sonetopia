import { useEffect, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { ArrowRight, CircleAlert, LoaderCircle, MailCheck } from "lucide-react"
import { verifyEmail } from "@/api/auth"
import { useAuthDialog } from "@/components/auth/AuthDialog"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

type VerifyState =
  | { status: "loading" }
  | { status: "success"; message: string }
  | { status: "error"; message: string }

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { openAuth } = useAuthDialog()
  const token = searchParams.get("token")
  const [state, setState] = useState<VerifyState>(() =>
    token
      ? { status: "loading" }
      : { status: "error", message: "The verification token is missing from this link." }
  )

  useEffect(() => {
    if (!token) return

    let cancelled = false
    verifyEmail(token)
      .then((message) => {
        if (!cancelled) setState({ status: "success", message })
      })
      .catch((cause: unknown) => {
        if (cancelled) return
        setState({
          status: "error",
          message:
            cause instanceof Error
              ? cause.message
              : "We could not verify your email. Please request a new link.",
        })
      })

    return () => {
      cancelled = true
    }
  }, [token])

  const loading = state.status === "loading"
  const success = state.status === "success"

  return (
    <div className="mx-auto flex min-h-[calc(100svh-10rem)] w-full max-w-lg items-center px-4 py-12">
      <Card className="w-full">
        <CardHeader>
          <span className="mb-2 grid size-11 place-items-center rounded-full bg-primary/10 text-primary">
            {loading ? (
              <LoaderCircle className="size-5 animate-spin" />
            ) : success ? (
              <MailCheck className="size-5" />
            ) : (
              <CircleAlert className="size-5 text-destructive" />
            )}
          </span>
          <CardTitle>
            {loading
              ? "Verifying your email"
              : success
                ? "Email verified"
                : "Verification failed"}
          </CardTitle>
          <CardDescription>
            {loading
              ? "Hang tight while we confirm your email address."
              : state.message}
          </CardDescription>
        </CardHeader>
        {loading ? null : (
          <CardContent className="space-y-3">
            <Button
              className="w-full"
              onClick={() => {
                navigate("/", { replace: true })
                openAuth("sign-in")
              }}
            >
              {success ? "Continue to sign in" : "Back to sign in"}
              <ArrowRight />
            </Button>
            {success ? null : (
              <p className="text-center text-xs leading-5 text-muted-foreground">
                Open the sign-in dialog to request a new verification email.
              </p>
            )}
          </CardContent>
        )}
      </Card>
    </div>
  )
}
