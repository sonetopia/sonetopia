import { Navigate, Outlet, useLocation } from "react-router-dom"
import { LoaderCircle } from "lucide-react"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { cn } from "cn"
import { AppSidebar } from "@/components/layout/AppSidebar"
import { PlayerBar } from "@/components/player/PlayerBar"
import { usePlayer } from "@/components/player/PlayerProvider"
import { Brand } from "@/components/shared"
import { useAuth } from "@/lib/auth"

const PAGE_LABELS: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/account": "Account",
  "/library": "Library",
  "/queue": "Queue",
  "/upload": "Upload",
}

function pageLabel(pathname: string) {
  if (pathname.startsWith("/playlists/")) return "Playlist"
  return PAGE_LABELS[pathname] ?? ""
}

export function AppShell() {
  const { pathname } = useLocation()
  const { current } = usePlayer()
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="grid min-h-svh place-items-center text-sm text-muted-foreground">
        <span className="flex items-center gap-2">
          <LoaderCircle className="size-4 animate-spin" />
          Loading your library...
        </span>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: pathname }} />
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-30 flex h-12 shrink-0 items-center gap-2 border-b bg-background/85 px-3 backdrop-blur">
          <SidebarTrigger className="-ml-1" />
          <Brand subtitle="Audio library" className="md:hidden" />
          <span className="hidden truncate text-sm font-medium md:inline">
            {pageLabel(pathname)}
          </span>
        </header>

        <main
          className={cn(
            "min-w-0 flex-1 px-4 py-5 sm:px-6",
            current ? "pb-[calc(var(--player-bar-height,4.5rem)+2rem)]" : "pb-10"
          )}
        >
          <Outlet />
        </main>
      </SidebarInset>
      <PlayerBar />
    </SidebarProvider>
  )
}
