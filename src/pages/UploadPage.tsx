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
      >
        <Button variant="outline" render={<Link to="/library" />}>
          <Library />
          View library
        </Button>
      </PageHeader>

      <UploadForm />
    </div>
  )
}