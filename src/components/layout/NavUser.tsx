import { BadgeCheckIcon, ChevronsUpDown, Info, LogIn, LogOut, Moon, Sun } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useAuthDialog } from "@/components/auth/AuthDialog"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { useTheme } from "@/lib/theme"
import { useAuth } from "@/lib/auth"

export function NavUser() {
  const { isMobile } = useSidebar()
  const { dark, toggle } = useTheme()
  const { user, signOut } = useAuth()
  const { openAuth } = useAuthDialog()
  const navigate = useNavigate()

  const name = user?.name || user?.username || "Account"
  const email = user?.email ?? ""

  const initials = name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()

  function handleSignOut() {
    signOut()
    navigate("/", { replace: true })
  }

  if (!user) {
    return (
      <SidebarMenu className="mb-1">
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" onClick={() => openAuth("sign-in")}>
            <LogIn />
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">Sign in</span>
              <span className="truncate text-xs">Access your library</span>
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  return (
    <SidebarMenu className="mb-1">
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton size="lg" className="aria-expanded:bg-muted" />
            }
          >
            <Avatar>
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">{name}</span>
              <span className="truncate text-xs">{email}</span>
            </div>
            <ChevronsUpDown className="ml-auto size-4 group-data-[collapsible=icon]:hidden" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-50"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                  <Avatar>
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">{name}</span>
                    <span className="truncate text-xs">{email}</span>
                  </div>
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => navigate("/account")}>
                <BadgeCheckIcon
                />
                Account
              </DropdownMenuItem>
              <DropdownMenuItem onClick={toggle}>
                {dark ? <Sun /> : <Moon />}
                {dark ? "Light mode" : "Dark mode"}
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate("/about")}>
              <Info
              />
              About Sonetopia
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onClick={handleSignOut}>
              <LogOut />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
