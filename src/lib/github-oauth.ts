const STATE_KEY = "sonetopia:github-oauth"

function clientId() {
  return (import.meta.env.VITE_GITHUB_CLIENT_ID as string | undefined)?.trim()
}

function redirectUri() {
  return (
    (import.meta.env.VITE_GITHUB_REDIRECT_URI as string | undefined)?.trim() ||
    `${window.location.origin}/auth/github/callback`
  )
}

type OAuthState = {
  state: string
  returnTo: string
}

export function isGithubOAuthConfigured() {
  return Boolean(clientId())
}

export function startGithubOAuth() {
  const id = clientId()
  if (!id) throw new Error("GitHub sign-in is not configured.")

  const state = crypto.randomUUID()
  const returnTo = `${window.location.pathname}${window.location.search}${window.location.hash}`
  sessionStorage.setItem(STATE_KEY, JSON.stringify({ state, returnTo } satisfies OAuthState))

  const params = new URLSearchParams({
    client_id: id,
    redirect_uri: redirectUri(),
    scope: "read:user user:email",
    state,
  })
  window.location.assign(`https://github.com/login/oauth/authorize?${params}`)
}

export function getGithubOAuthReturnTo(receivedState: string | null) {
  const raw = sessionStorage.getItem(STATE_KEY)
  if (!raw || !receivedState) return null

  try {
    const stored = JSON.parse(raw) as OAuthState
    if (stored.state !== receivedState) return null
    if (!stored.returnTo.startsWith("/") || stored.returnTo.startsWith("//")) return "/"
    return stored.returnTo
  } catch {
    return null
  }
}

export function consumeGithubOAuthState(receivedState: string | null) {
  const returnTo = getGithubOAuthReturnTo(receivedState)
  sessionStorage.removeItem(STATE_KEY)
  return returnTo
}
