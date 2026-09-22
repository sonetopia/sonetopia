import { Link } from "react-router-dom"
import { Library } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/shared"
import { UploadForm } from "@/components/upload/UploadForm"

export function UploadPage() {
  return (
    <div className="space-y-5">
      <PageHeader
        title="Upload audio"
        description="Add files from your device. Music, podcasts, instrumentals, audiobooks, ambience — anything goes."
      >
        <Button variant="outline" render={<Link to="/library" />}>
          <Library />
          View library
        </Button>
      </PageHeader>

      <UploadForm />

      <p className="rounded-xl border border-dashed bg-muted/40 p-3 text-xs text-muted-foreground">
        Note: Until the Spring API is connected, uploads stay in this browser session only and are
        not written to disk.
      </p>
    </div>
  )
}