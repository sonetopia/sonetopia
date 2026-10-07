import { Link, Outlet } from "react-router-dom"
import { Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Brand } from "@/components/shared"
import { useAuth } from "@/lib/auth"
import { useTheme } from "@/lib/theme"

export function PublicShell() {
  const { user } = useAuth()
  const { dark, toggle } = useTheme()

  return (
    <div className="flex min-h-svh flex-col">
      <header className="sticky top-0 z-30 border-b bg-background/85 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <Brand />
          <div className="flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="icon-lg"
              aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
              onClick={toggle}
            >
              {dark ? <Sun /> : <Moon />}
            </Button>
            {user ? (
              <Button render={<Link to="/dashboard" />}>
                Open app
              </Button>
            ) : (
              <>
                <Button className="py-4" variant="ghost" render={<Link to="/login" />}>
                  Sign in
                </Button>
                <Button className="px-5 py-4" render={<Link to="/register" />}>
                  Get started
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t">
        <div className="mx-auto w-full max-w-6xl px-4 py-6 text-xs text-muted-foreground">
          Sonetopia — a private audio library, not a streaming service.
        </div>
      </footer>
    </div>
  )
}