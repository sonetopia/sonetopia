import { Link } from "react-router-dom"
import { Compass } from "lucide-react"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/shared"

export function NotFoundPage() {
  return (
    <EmptyState
      icon={Compass}
      title="Page not found"
      description="That link does not exist in Sonetopia."
      action={
        <Button variant="outline" render={<Link to="/" />}>
          Back to dashboard
        </Button>
      }
    />
  )
}
