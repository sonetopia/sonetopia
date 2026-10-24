import { useEffect, useRef, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { ArrowRight, CircleAlert, LoaderCircle } from "lucide-react"
import { useAuthDialog } from "@/components/auth/AuthDialog"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { consumeGithubOAuthState, getGithubOAuthReturnTo } from "@/lib/github-oauth"
import { useAuth } from "@/lib/auth"

export function GithubCallbackPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { openAuth } = useAuthDialog()
  const { signInWithGithub } = useAuth()
  const oauthError = searchParams.get("error")
  const code = searchParams.get("code")
  const returnTo =
    code && !oauthError ? getGithubOAuthReturnTo(searchParams.get("state")) : null
  const initialError = oauthError
    ? searchParams.get("error_description") || "GitHub sign-in was cancelled."
    : !code
      ? "GitHub did not return an authorization code."
      : !returnTo
        ? "The GitHub sign-in request could not be verified. Please try again."
        : null
  const [error, setError] = useState<string | null>(initialError)
  const started = useRef(false)

  useEffect(() => {
    if (initialError || !code || !returnTo || started.current) return
    started.current = true
    consumeGithubOAuthState(searchParams.get("state"))

    void signInWithGithub(code).then((result) => {
      if (!result.ok) {
        setError(result.error)
        return
      }
      navigate(returnTo, { replace: true })
    })
  }, [code, initialError, navigate, returnTo, searchParams, signInWithGithub])

  return (
    <div className="mx-auto flex min-h-[calc(100svh-10rem)] w-full max-w-lg items-center px-4 py-12">
      <Card className="w-full">
        <CardHeader>
          <span className="mb-2 grid size-11 place-items-center rounded-full bg-primary/10 text-primary">
            {error ? (
              <CircleAlert className="size-5 text-destructive" />
            ) : (
              <LoaderCircle className="size-5 animate-spin" />
            )}
          </span>
          <CardTitle>{error ? "GitHub sign-in failed" : "Signing in with GitHub"}</CardTitle>
          <CardDescription>
            {error ?? "Hold on while we connect your GitHub account."}
          </CardDescription>
        </CardHeader>
        {error ? (
          <CardContent>
            <Button
              className="w-full"
              onClick={() => {
                navigate("/", { replace: true })
                openAuth("sign-in")
              }}
            >
              Back to sign in
              <ArrowRight />
            </Button>
          </CardContent>
        ) : null}
      </Card>
    </div>
  )
}
