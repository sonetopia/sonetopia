import { Link, NavLink, useLocation } from "react-router-dom"
import {
  HardDriveUpload,
  LayoutDashboard,
  Library,
  ListMusic,
  ListOrdered,
  Plus,
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar"
import { NavUser } from "@/components/layout/NavUser"
import { PlaylistForm } from "@/components/playlist/PlaylistForm"
import { usePlayer } from "@/components/player/PlayerProvider"
import { Separator } from "@/components/ui/separator"
import { useLibrary } from "@/lib/library"

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/library", label: "Library", icon: Library },
  { to: "/queue", label: "Queue", icon: ListOrdered },
  { to: "/upload", label: "Upload", icon: HardDriveUpload },
]

export function AppSidebar() {
  const { pathname } = useLocation()
  const { playlists, createPlaylist } = useLibrary()
  const { current } = usePlayer()
  // the mobile sidebar is a sheet, so it has to close itself when a link navigates
  const { setOpenMobile } = useSidebar()
  const closeMobile = () => setOpenMobile(false)

  return (
    <Sidebar
      collapsible="icon"
      // the player bar publishes --player-bar-height, so the footer never hides behind it
      className={current ? "h-[calc(100svh-var(--player-bar-height,4.5rem))]" : undefined}
    >
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              tooltip="Sonetopia"
              onClick={closeMobile}
              render={<Link to="/dashboard" />}
            >
              <span className="grid size-8 shrink-0 place-items-center rounded-lg text-primary-foreground">
                <img src="/logo-orange-small.png" alt="Sonetopia" className="size-7" />
              </span>
              <span className="grid flex-1 text-left leading-tight">
                <span className="truncate font-heading text-sm font-semibold">Sonetopia</span>
                <span className="truncate text-[11px] text-muted-foreground">
                  Your sound, everywhere.
                </span>
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {NAV.map((item) => (
                <SidebarMenuItem key={item.to}>
                  <SidebarMenuButton
                    tooltip={item.label}
                    isActive={pathname.startsWith(item.to)}
                    onClick={closeMobile}
                    render={<NavLink to={item.to} />}
                  >
                    <item.icon />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <div className="ps-3 pe-4 mb-2 mt-3">
          <Separator />
        </div>

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              <SidebarMenuItem>
                <PlaylistForm
                  submitLabel="Create playlist"
                  onSubmit={(values) => createPlaylist(values)}
                  trigger={
                    <SidebarMenuButton tooltip="Create playlist">
                      <Plus />
                      <span>New playlist</span>
                    </SidebarMenuButton>
                  }
                />
              </SidebarMenuItem>
              {playlists.map((playlist) => (
                <SidebarMenuItem key={playlist.id}>
                  <SidebarMenuButton
                    tooltip={playlist.name}
                    isActive={pathname === `/playlists/${playlist.id}`}
                    onClick={closeMobile}
                    render={<NavLink to={`/playlists/${playlist.id}`} />}
                  >
                    <ListMusic />
                    <span>{playlist.name}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}