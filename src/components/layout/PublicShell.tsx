import { Link, Outlet } from "react-router-dom"
import { ArrowRight, Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Brand } from "@/components/shared"
import { useTheme } from "@/lib/theme"

export function PublicShell() {
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
            <Button render={<Link to="/" />}>Go to app <ArrowRight /></Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t">
        <div className="mx-auto w-full max-w-6xl px-4 py-6 text-xs text-muted-foreground">
          Sonetopia — your sound, everywhere.
        </div>
      </footer>
    </div>
  )
}
