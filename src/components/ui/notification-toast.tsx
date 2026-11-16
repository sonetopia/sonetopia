import type { ComponentPropsWithoutRef, ReactNode } from "react"
import { Toaster, toast } from "@/components/ui/toast"
import { SIGN_IN_REQUIRED_MESSAGE } from "@/lib/session"

export const notify = {
  success: (
    title: string,
    description?: string,
    action?: ComponentPropsWithoutRef<"button">
  ) =>
    toast.add({ title, description, type: "success", actionProps: action }),
  error: (title: string, description?: string) => {
    // A 401 already opened the sign-in dialog; a toast on top would be noise.
    if (title === SIGN_IN_REQUIRED_MESSAGE) return
    return toast.add({ title, description, type: "error" })
  },
}

/** Mount once near the root; call `notify.success()` / `notify.error()`. */
export function NotificationToast({ children }: { children: ReactNode }) {
  return <Toaster>{children}</Toaster>
}
