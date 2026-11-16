import { Link } from "react-router-dom"
import { Library } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/shared"
import { OnlineImport } from "@/components/upload/OnlineImport"
import { UploadForm } from "@/components/upload/UploadForm"

export function UploadPage() {
  return (
    <div className="space-y-5">
      <PageHeader title="Add audio">
        <Button variant="outline" render={<Link to="/library" />}>
          <Library />
          View library
        </Button>
      </PageHeader>

      <OnlineImport />

      <div className="flex items-center gap-3 text-xs text-muted-foreground" role="separator">
        <span className="h-px flex-1 bg-border" />
        or upload from your device
        <span className="h-px flex-1 bg-border" />
      </div>

      <UploadForm />
    </div>
  )
}
