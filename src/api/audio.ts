import { mediaUrl, request } from "@/api/client"

export type AudioResponse = {
  id: string
  title: string
  type: string | null
  author: string | null
  album: string | null
  year: number | null
  coverVersion: number | null
  mimeType: string | null
  fileSize: number | null
  duration: number | null
  createdAt: string
  updatedAt: string
  signedUrl: string | null
}

export type AudioCoverResponse = {
  id: string
  mimeType: string | null
  fileSize: number | null
  coverVersion: number | null
  signedUrl: string | null
}

export type AudioFields = {
  title: string
  type?: string
  author?: string
  album?: string
  year?: number
  cover?: File
}

export type CreateAudioInput = AudioFields & {
  file: File
}

export type UpdateAudioInput = AudioFields & {
  file?: File
}

export type FetchedAudioResponse = {
  tempId: string
  title: string | null
  author: string | null
  album: string | null
  year: number | null
  duration: number | null
  mimeType: string | null
  fileSize: number | null
  coverMimeType: string | null
  coverFileSize: number | null
}

export type CreateAudioFromTempInput = {
  tempId: string
  title: string
  type?: string
  author?: string
  album?: string
  year?: number
}

function toFormData(input: AudioFields & { file?: File }) {
  const form = new FormData()
  form.append("title", input.title)
  if (input.file) form.append("audioFile", input.file)
  if (input.cover) form.append("imageCover", input.cover)
  if (input.type) form.append("type", input.type)
  if (input.author) form.append("author", input.author)
  if (input.album) form.append("album", input.album)
  if (input.year != null) form.append("year", String(input.year))
  return form
}

export async function listAudio() {
  return (await request<AudioResponse[]>("/audio")) ?? []
}

export async function getAudio(id: string) {
  const data = await request<AudioResponse>(`/audio/${encodeURIComponent(id)}`)
  if (!data) throw new Error(`Audio ${id} not found`)
  return data
}

export async function getAudioCover(id: string) {
  const data = await request<AudioCoverResponse>(`/audio/${encodeURIComponent(id)}/cover`)
  if (!data) throw new Error(`Cover for ${id} not found`)
  return data
}

export async function createAudio(input: CreateAudioInput) {
  const created = await request<AudioResponse>("/audio", { method: "POST", body: toFormData(input) })
  if (!created) throw new Error("Upload failed")
  return created
}

export async function fetchAudioByUrl(url: string, withThumbnail: boolean) {
  const fetched = await request<FetchedAudioResponse>("/audio/fetch", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url, with_thumbnail: withThumbnail }),
  })
  if (!fetched) throw new Error("Could not fetch audio from that URL")
  return fetched
}

export async function createAudioFromTemp(input: CreateAudioFromTempInput) {
  const created = await request<AudioResponse>("/audio", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  })
  if (!created) throw new Error("Could not save the fetched audio")
  return created
}

export async function updateAudio(id: string, input: UpdateAudioInput) {
  const updated = await request<AudioResponse>(`/audio/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: toFormData(input),
  })
  if (!updated) throw new Error("Update failed")
  return updated
}

export async function deleteAudio(id: string) {
  await request<unknown>(`/audio/${encodeURIComponent(id)}`, { method: "DELETE" })
}

export { mediaUrl }
