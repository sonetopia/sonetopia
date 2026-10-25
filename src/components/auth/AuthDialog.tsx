import { createContext, useContext, useMemo, useState, type ReactNode } from "react"
import { AuthForm, type AuthMode } from "@/components/auth/AuthForm"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"

type AuthDialogValue = {
  openAuth: (mode?: AuthMode) => void
}

const AuthDialogContext = createContext<AuthDialogValue | null>(null)

export function AuthDialogProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<AuthMode>("sign-in")
  const [verifying, setVerifying] = useState(false)

  const value = useMemo<AuthDialogValue>(
    () => ({
      openAuth: (nextMode = "sign-in") => {
        setMode(nextMode)
        setVerifying(false)
        setOpen(true)
      },
    }),
    []
  )

  return (
    <AuthDialogContext.Provider value={value}>
      {children}
      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          setOpen(nextOpen)
          if (!nextOpen) setVerifying(false)
        }}
      >
        <DialogContent
          initialFocus={() => document.getElementById("auth-username")}
          className={
            verifying
              ? undefined
              : mode === "sign-up"
              ? "max-h-[calc(100svh-2rem)] overflow-y-auto p-0 sm:max-w-4xl"
              : "sm:max-w-md"
          }
        >
          <DialogTitle className="sr-only">
            {mode === "sign-up" ? "Create your account" : "Sign in"}
          </DialogTitle>
          <AuthForm
            key={`${mode}-${open}`}
            mode={mode}
            onModeChange={setMode}
            onSuccess={() => setOpen(false)}
            onVerificationChange={setVerifying}
          />
        </DialogContent>
      </Dialog>
    </AuthDialogContext.Provider>
  )
}

export function useAuthDialog() {
  const context = useContext(AuthDialogContext)
  if (!context) throw new Error("useAuthDialog must be used inside AuthDialogProvider")
  return context
}
