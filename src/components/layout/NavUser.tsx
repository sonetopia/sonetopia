import { BadgeCheckIcon, Info, LogIn, LogOut, Moon, Sun } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useAuthDialog } from "@/components/auth/AuthDialog"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useTheme } from "@/lib/theme"
import { useAuth } from "@/lib/auth"

export function NavUser() {
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

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="size-9 rounded-full p-0 aria-expanded:bg-muted"
            aria-label={user ? "Account menu" : "Guest menu"}
          />
        }
      >
        <Avatar className="size-8">
          <AvatarFallback className="bg-primary font-medium text-primary-foreground">
            {user ? initials : "G"}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-48" side="bottom" align="end" sideOffset={6}>
        {user ? (
          <>
            <DropdownMenuGroup>
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                  <Avatar>
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                  <div className="grid min-w-0 flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">{name}</span>
                    <span className="truncate text-xs text-muted-foreground">{email}</span>
                  </div>
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => navigate("/account")}>
                <BadgeCheckIcon />
                Account
              </DropdownMenuItem>
              <DropdownMenuItem onClick={toggle}>
                {dark ? <Sun /> : <Moon />}
                {dark ? "Light mode" : "Dark mode"}
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate("/about")}>
              <Info />
              About Sonetopia
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onClick={handleSignOut}>
              <LogOut />
              Sign out
            </DropdownMenuItem>
          </>
        ) : (
          <>
            <DropdownMenuItem onClick={() => navigate("/about")}>
              <Info />
              About Sonetopia
            </DropdownMenuItem>
            <DropdownMenuItem onClick={toggle}>
              {dark ? <Sun /> : <Moon />}
              {dark ? "Light mode" : "Dark mode"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => openAuth("sign-in")}>
              <LogIn />
              Sign in
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
