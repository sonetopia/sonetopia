import { useEffect, useRef, useState } from "react"
import { notify } from "@/components/ui/notification-toast"

type GoogleCredentialResponse = {
  credential?: string
}

type GoogleAccounts = {
  accounts: {
    id: {
      initialize: (options: {
        client_id: string
        callback: (response: GoogleCredentialResponse) => void
      }) => void
      renderButton: (
        parent: HTMLElement,
        options: {
          type: "standard"
          theme: "outline" | "filled_black"
          size: "large"
          text: "continue_with"
          shape: "rectangular"
          logo_alignment: "left"
          width: number
        }
      ) => void
    }
  }
}

declare global {
  interface Window {
    google?: GoogleAccounts
  }
}

let googleScriptPromise: Promise<void> | null = null

function loadGoogleScript() {
  if (window.google?.accounts?.id) return Promise.resolve()
  if (googleScriptPromise) return googleScriptPromise

  googleScriptPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script")
    script.src = "https://accounts.google.com/gsi/client"
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => {
      googleScriptPromise = null
      reject(new Error("Could not load Google sign-in."))
    }
    document.head.appendChild(script)
  })

  return googleScriptPromise
}

type GoogleSignInButtonProps = {
  clientId: string
  disabled?: boolean
  onCredential: (credential: string) => void
}

export function GoogleSignInButton({
  clientId,
  disabled = false,
  onCredential,
}: GoogleSignInButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const credentialRef = useRef(onCredential)
  const [dark, setDark] = useState(() =>
    document.documentElement.classList.contains("dark")
  )
  const [width, setWidth] = useState(0)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const updateWidth = () => setWidth(Math.round(container.clientWidth))
    updateWidth()

    const observer = new ResizeObserver(updateWidth)
    observer.observe(container)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const observer = new MutationObserver(() =>
      setDark(document.documentElement.classList.contains("dark"))
    )
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] })
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    credentialRef.current = onCredential
  }, [onCredential])

  useEffect(() => {
    let cancelled = false

    void loadGoogleScript()
      .then(() => {
        const container = containerRef.current
        const google = window.google
        if (cancelled || !container || width <= 0) return
        if (!google) {
          notify.error("Google sign-in is unavailable right now.")
          return
        }

        container.replaceChildren()
        google.accounts.id.initialize({
          client_id: clientId,
          callback: (response) => {
            if (response.credential) credentialRef.current(response.credential)
            else notify.error("Google did not return a sign-in token.")
          },
        })
        google.accounts.id.renderButton(container, {
          type: "standard",
          theme: dark ? "filled_black" : "outline",
          size: "large",
          text: "continue_with",
          shape: "rectangular",
          logo_alignment: "left",
          width: Math.max(200, Math.min(400, width)),
        })
      })
      .catch((cause: unknown) => {
        if (cancelled) return
        notify.error(cause instanceof Error ? cause.message : "Could not load Google sign-in.")
      })

    return () => {
      cancelled = true
    }
  }, [clientId, dark, width])

  return (
    <div
      ref={containerRef}
      className={
        disabled
          ? "pointer-events-none h-10 w-full overflow-hidden opacity-60"
          : "h-10 w-full overflow-hidden"
      }
    />
  )
}
