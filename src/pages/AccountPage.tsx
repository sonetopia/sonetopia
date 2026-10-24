import { useEffect, useState, type FormEvent } from "react"
import {
  CalendarDays,
  HardDrive,
  ShieldCheck,
  Trash2Icon,
  UserRound,
} from "lucide-react"
import { DeleteAccountDialog } from "@/components/account/DeleteAccountDialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { notify } from "@/components/ui/notification-toast"
import { PageHeader } from "@/components/shared"
import { getStorageUsage } from "@/api/auth"
import { useAuth } from "@/lib/auth"
import { formatBytes, type StorageUsage } from "@/lib/storage"
import { Field, FieldLabel } from "@/components/ui/field"

function formatDate(value?: string | null) {
  if (!value) return "Unknown"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "Unknown"
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

export function AccountPage() {
  const { user, updateProfile } = useAuth()
  const [values, setValues] = useState({
    name: user?.name ?? "",
    username: user?.username ?? "",
    email: user?.email ?? "",
    currentPassword: "",
    password: "",
    confirmPassword: "",
  })
  const [saving, setSaving] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [storageState, setStorageState] = useState<{
    userId?: string
    usage: StorageUsage | null
    error: string | null
  }>({ usage: null, error: null })

  const storageReady = storageState.userId === user?.id
  const storage = storageReady ? storageState.usage : null
  const storageLoading = Boolean(user?.id) && !storageReady
  const storageError = storageReady ? storageState.error : null

  useEffect(() => {
    if (!user?.id) return

    let cancelled = false

    getStorageUsage()
      .then((usage) => {
        if (!cancelled) setStorageState({ userId: user.id, usage, error: null })
      })
      .catch((cause: unknown) => {
        if (!cancelled) {
          setStorageState({
            userId: user.id,
            usage: null,
            error: cause instanceof Error ? cause.message : "Could not load storage usage",
          })
        }
      })

    return () => {
      cancelled = true
    }
  }, [user?.id])

  const initials = (user?.name || user?.username || "Account")
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()

  const isDirty =
    values.name !== (user?.name ?? "") ||
    values.username !== (user?.username ?? "") ||
    values.password.length > 0 ||
    values.confirmPassword.length > 0

  function updateField(field: keyof typeof values, value: string) {
    setValues((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (saving || !isDirty) return

    if (values.password && !values.currentPassword.trim()) {
      notify.error("Enter your current password to set a new password.")
      return
    }

    if (values.password !== values.confirmPassword) {
      notify.error("Passwords do not match.")
      return
    }

    setSaving(true)

    try {
      const result = await updateProfile({
        name: values.name,
        username: values.username,
        password: values.password || undefined,
        currentPassword: values.password ? values.currentPassword : undefined,
      })

      if (!result.ok) {
        notify.error(result.error)
        return
      }

      setValues((prev) => ({
        ...prev,
        name: prev.name.trim(),
        username: prev.username.trim(),
        currentPassword: "",
        password: "",
        confirmPassword: "",
      }))
      notify.success("Your profile has been updated.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Account"
      />

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <Card className="h-full order-2 lg:order-1">
          <CardHeader>
            <CardTitle>Profile details</CardTitle>
          </CardHeader>
          <form id="account-profile-form" onSubmit={handleSubmit}>
            <CardContent className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="account-name">Name</FieldLabel>
                  <Input
                    id="account-name"
                    value={values.name}
                    autoComplete="name"
                    maxLength={100}
                    required
                    disabled={saving}
                    onChange={(event) => updateField("name", event.target.value)}
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="account-username">Username</FieldLabel>
                  <Input
                    id="account-username"
                    value={values.username}
                    autoComplete="off"
                    minLength={3}
                    maxLength={50}
                    required
                    disabled={saving}
                    onChange={(event) => updateField("username", event.target.value)}
                  />
                </Field>

                <Field className="sm:col-span-2">
                  <FieldLabel htmlFor="account-email">Email</FieldLabel>
                  <Input
                    id="account-email"
                    type="email"
                    value={values.email}
                    autoComplete="off"
                    maxLength={255}
                    readOnly
                    className="bg-muted text-muted-foreground"
                  />
                </Field>
              </div>

              <Separator className="mt-7 mb-6" />

              <p className="text-xs text-muted-foreground mb-3">
                Leave the fields empty to keep your current password.
              </p>

              <Field>
                <FieldLabel htmlFor="account-current-password">Current password</FieldLabel>
                <Input
                  id="account-current-password"
                  type="password"
                  value={values.currentPassword}
                  autoComplete="off"
                  required={values.password.length > 0 || values.confirmPassword.length > 0}
                  disabled={saving}
                  onChange={(event) => updateField("currentPassword", event.target.value)}
                />
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="account-password">New password</FieldLabel>
                  <Input
                    id="account-password"
                    type="password"
                    value={values.password}
                    autoComplete="off"
                    minLength={6}
                    maxLength={100}
                    disabled={saving}
                    onChange={(event) => updateField("password", event.target.value)}
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="account-confirm-password">Confirm new password</FieldLabel>
                  <Input
                    id="account-confirm-password"
                    type="password"
                    value={values.confirmPassword}
                    autoComplete="new-password"
                    minLength={6}
                    maxLength={100}
                    disabled={saving}
                    onChange={(event) => updateField("confirmPassword", event.target.value)}
                  />
                </Field>
              </div>
              <div className="text-end">
                <Button type="submit" form="account-profile-form" disabled={saving || !isDirty}>
                  {saving ? "Saving..." : "Save changes"}
                </Button>
              </div>
            </CardContent>
          </form>
        </Card>

        <Card className="h-full order-1 lg:order-2">
          <CardContent className="flex flex-col h-full gap-4 justify-around">
            <div className="flex flex-col flex-1 items-center justify-center gap-3 text-center">
              <span className="grid size-20 place-items-center rounded-full bg-primary text-2xl font-semibold text-primary-foreground">
                {initials}
              </span>
              <div className="space-y-1">
                <p className="font-heading text-lg font-semibold">
                  {user?.name || user?.username}
                </p>
                <p className="text-xs text-muted-foreground">@{user?.username}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
              <Badge variant="secondary">
                {user?.isAdmin ? (
                  <>
                    <ShieldCheck />
                    Administrator
                  </>
                ) : (
                  "Listener"
                )}
              </Badge>
            </div>

            <Separator />

            <dl className="space-y-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="flex items-center gap-2 text-muted-foreground">
                  <HardDrive className="size-4" />
                  Storage used
                </dt>
                <dd className="text-right font-medium">
                  {storageLoading ? "Loading..." : storage ? formatBytes(storage.usedBytes) : "-"}
                  {storage && !storage.unlimited && storage.maxBytes != null ? (
                    <span className="ps-1 text-[11px] font-normal text-muted-foreground">
                      of {formatBytes(storage.maxBytes)}
                    </span>
                  ) : null}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="flex items-center gap-2 text-muted-foreground">
                  <CalendarDays className="size-4" />
                  Member since
                </dt>
                <dd className="font-medium">{formatDate(user?.createdAt)}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="flex items-center gap-2 text-muted-foreground">
                  <UserRound className="size-4" />
                  Account ID
                </dt>
                <dd className="max-w-24 truncate font-mono text-xs" title={user?.id}>
                  {user?.id}
                </dd>
              </div>
            </dl>

            {storage && !storage.unlimited && storage.maxBytes != null && storage.maxBytes > 0 ? (
              <div className="space-y-1.5">
                <div
                  role="progressbar"
                  aria-label="Storage usage"
                  aria-valuemin={0}
                  aria-valuemax={storage.maxBytes}
                  aria-valuenow={Math.min(storage.usedBytes, storage.maxBytes)}
                  className="h-1.5 overflow-hidden rounded-full bg-muted"
                >
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{
                      width: `${Math.min(100, (storage.usedBytes / storage.maxBytes) * 100)}%`,
                    }}
                  />
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {formatBytes(storage.remainingBytes)} available
                </p>
              </div>
            ) : storage?.unlimited ? (
              <p className="text-[11px] text-muted-foreground">Unlimited storage</p>
            ) : storageError ? (
              <p className="text-[11px] text-destructive">{storageError}</p>
            ) : null}
          </CardContent>
        </Card>
      </div>

      {user ? (
        <section>
          <h6 className="mb-2 font-medium">Danger Zone</h6>
          <div className="divide-y divide-border overflow-hidden rounded-xl bg-card ring-1 ring-destructive/20">
            <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <p className="font-medium">Delete account</p>
                <p className="text-sm text-muted-foreground">
                  Deleting your account permanently removes your uploaded audio, playlists,
                  and all associated data. This action cannot be undone.
                </p>
              </div>
              <Button variant="destructive" className="rounded-md" onClick={() => setDeleteDialogOpen(true)}>
                Delete this account
              </Button>
            </div>
          </div>
        </section>
      ) : null}

      <DeleteAccountDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen} />
    </div>
  )
}
