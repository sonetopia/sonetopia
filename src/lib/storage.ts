export type StorageUsage = {
  usedBytes: number
  maxBytes: number | null
  remainingBytes: number | null
  unlimited: boolean
}

export const MAX_AUDIO_BYTES = 100 * 1024 * 1024
export const MAX_COVER_BYTES = 1 * 1024 * 1024

export const AUDIO_ACCEPT = ".mp3,.wav,.ogg,audio/mpeg,audio/wav,audio/ogg"
export const COVER_ACCEPT = ".jpg,.jpeg,.jfif,.png,.webp,image/jpeg,image/png,image/webp"

const AUDIO_MIME_TYPES = new Set(["audio/mpeg", "audio/wav", "audio/ogg"])
const AUDIO_EXTENSIONS = new Set(["mp3", "wav", "ogg"])
const COVER_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"])
const COVER_EXTENSIONS = new Set(["jpg", "jpeg", "jfif", "png", "webp"])

const STORAGE_UNITS = ["B", "KB", "MB", "GB", "TB"]

function extensionOf(name: string) {
  return name.toLowerCase().split(".").pop() ?? ""
}

export function formatBytes(bytes?: number | null) {
  if (bytes == null) return "Unknown"
  if (bytes <= 0) return "0 B"

  let value = bytes
  let unit = 0
  while (value >= 1024 && unit < STORAGE_UNITS.length - 1) {
    value /= 1024
    unit += 1
  }
  return `${value.toFixed(unit > 1 ? 1 : 0)} ${STORAGE_UNITS[unit]}`
}

export function audioFileError(file: File) {
  if (file.size === 0) return `${file.name} - file is empty`
  if (
    !AUDIO_MIME_TYPES.has(file.type.toLowerCase()) ||
    !AUDIO_EXTENSIONS.has(extensionOf(file.name))
  ) {
    return `${file.name} - use an MP3, WAV, or OGG audio file`
  }
  if (file.size > MAX_AUDIO_BYTES) return `${file.name} - larger than 100 MB`
  return null
}

export function coverFileError(file: File) {
  if (
    !COVER_MIME_TYPES.has(file.type.toLowerCase()) ||
    !COVER_EXTENSIONS.has(extensionOf(file.name))
  ) {
    return `${file.name} - use a JPEG, PNG, or WebP image`
  }
  if (file.size > MAX_COVER_BYTES) return `${file.name} - larger than 1 MB`
  return null
}

export function storageQuotaError(usage: StorageUsage, neededBytes: number) {
  if (usage.unlimited) return null

  const remaining =
    usage.remainingBytes ?? Math.max(0, (usage.maxBytes ?? 0) - usage.usedBytes)
  if (neededBytes <= remaining) return null

  return `Not enough storage. This upload needs ${formatBytes(neededBytes)}, but only ${formatBytes(remaining)} is available.`
}
