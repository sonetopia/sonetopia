import { BrowserRouter, Route, Routes } from "react-router-dom"
import { AppShell } from "@/components/layout/AppShell"
import { PublicShell } from "@/components/layout/PublicShell"
import { PlayerProvider } from "@/components/player/PlayerProvider"
import { TooltipProvider } from "@/components/ui/tooltip"
import { DashboardPage } from "@/pages/DashboardPage"
import { LandingPage } from "@/pages/LandingPage"
import { LibraryPage } from "@/pages/LibraryPage"
import { LoginPage } from "@/pages/LoginPage"
import { NotFoundPage } from "@/pages/NotFoundPage"
import { PlaylistDetailPage } from "@/pages/PlaylistDetailPage"
import { QueuePage } from "@/pages/QueuePage"
import { RegisterPage } from "@/pages/RegisterPage"
import { UploadPage } from "@/pages/UploadPage"
import { AuthProvider } from "@/lib/auth"
import { LibraryProvider } from "@/lib/library"

function App() {
  return (
    <AuthProvider>
      <LibraryProvider>
        <PlayerProvider>
          <TooltipProvider>
            <BrowserRouter>
              <Routes>
                <Route element={<PublicShell />}>
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                </Route>

                <Route element={<AppShell />}>
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/library" element={<LibraryPage />} />
                  <Route path="/playlists/:id" element={<PlaylistDetailPage />} />
                  <Route path="/queue" element={<QueuePage />} />
                  <Route path="/upload" element={<UploadPage />} />
                  <Route path="*" element={<NotFoundPage />} />
                </Route>
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </PlayerProvider>
      </LibraryProvider>
    </AuthProvider>
  )
}

export default App