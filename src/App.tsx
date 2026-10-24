import type { ReactNode } from "react"
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"
import { AuthDialogProvider } from "@/components/auth/AuthDialog"
import { AppShell } from "@/components/layout/AppShell"
import { PublicShell } from "@/components/layout/PublicShell"
import { PlayerProvider } from "@/components/player/PlayerProvider"
import { TooltipProvider } from "@/components/ui/tooltip"
import { NotificationToast } from "@/components/ui/notification-toast"
import { AccountPage } from "@/pages/AccountPage"
import { DashboardPage } from "@/pages/DashboardPage"
import { LandingPage } from "@/pages/LandingPage"
import { LibraryPage } from "@/pages/LibraryPage"
import { NotFoundPage } from "@/pages/NotFoundPage"
import { PlaylistDetailPage } from "@/pages/PlaylistDetailPage"
import { QueuePage } from "@/pages/QueuePage"
import { UploadPage } from "@/pages/UploadPage"
import { VerifyEmailPage } from "@/pages/VerifyEmailPage"
import { AuthProvider, useAuth } from "@/lib/auth"
import { LibraryProvider } from "@/lib/library"

function SessionProviders({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  return <LibraryProvider key={user?.id ?? "guest"}>{children}</LibraryProvider>
}

function App() {
  return (
    <NotificationToast>
      <AuthProvider>
        <AuthDialogProvider>
          <SessionProviders>
            <PlayerProvider>
              <TooltipProvider>
                <BrowserRouter>
                  <Routes>
                    <Route element={<PublicShell />}>
                      <Route path="/about" element={<LandingPage />} />
                      <Route path="/verify-email" element={<VerifyEmailPage />} />
                    </Route>

                    <Route element={<AppShell />}>
                      <Route path="/" element={<DashboardPage />} />
                      <Route path="/dashboard" element={<Navigate to="/" replace />} />
                      <Route path="/login" element={<Navigate to="/" replace />} />
                      <Route path="/register" element={<Navigate to="/" replace />} />
                      <Route path="/account" element={<AccountPage />} />
                      <Route path="/library" element={<LibraryPage />} />
                      <Route path="/playlists/:id" element={<PlaylistDetailPage />} />
                      <Route path="/queue" element={<QueuePage />} />
                      <Route path="/upload" element={<UploadPage />} />
                    </Route>

                    <Route path="*" element={<NotFoundPage />} />
                  </Routes>
                </BrowserRouter>
              </TooltipProvider>
            </PlayerProvider>
          </SessionProviders>
        </AuthDialogProvider>
      </AuthProvider>
    </NotificationToast>
  )
}

export default App
