import type { ComponentPropsWithoutRef, ReactNode } from "react"
import { Toaster, toast } from "@/components/ui/toast"

export const notify = {
  success: (
    title: string,
    description?: string,
    action?: ComponentPropsWithoutRef<"button">
  ) =>
    toast.add({ title, description, type: "success", actionProps: action }),
  error: (title: string, description?: string) =>
    toast.add({ title, description, type: "error" }),
}

/** Mount once near the root; call `notify.success()` / `notify.error()`. */
export function NotificationToast({ children }: { children: ReactNode }) {
  return <Toaster>{children}</Toaster>
}
