import { request } from "@/api/client"

export type PlaylistResponse = {
  id: string
  title: string
  createdAt: string
  updatedAt: string
}

export type PlaylistAudioResponse = {
  audioId: string
  position: number
}

export async function listPlaylists() {
  return (await request<PlaylistResponse[]>("/playlists")) ?? []
}

export async function createPlaylist(title: string) {
  const created = await request<PlaylistResponse>("/playlists", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title }),
  })
  if (!created) throw new Error("Could not create the playlist")
  return created
}

export async function updatePlaylist(id: string, title: string) {
  const updated = await request<PlaylistResponse>(`/playlists/${encodeURIComponent(id)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title }),
  })
  if (!updated) throw new Error("Could not update the playlist")
  return updated
}

export async function deletePlaylist(id: string) {
  await request<unknown>(`/playlists/${encodeURIComponent(id)}`, { method: "DELETE" })
}

/** Playlist audio, ordered by the 0-based `position` the API assigns on add. */
export async function listPlaylistAudio(playlistId: string) {
  const rows =
    (await request<PlaylistAudioResponse[]>(
      `/playlists/${encodeURIComponent(playlistId)}/audio`
    )) ?? []
  return [...rows].sort((a, b) => a.position - b.position)
}

export async function addPlaylistAudio(playlistId: string, audioId: string) {
  await request<string>(
    `/playlists/${encodeURIComponent(playlistId)}/audio/${encodeURIComponent(audioId)}`,
    { method: "POST" }
  )
}

export async function removePlaylistAudio(playlistId: string, audioId: string) {
  await request<string>(
    `/playlists/${encodeURIComponent(playlistId)}/audio/${encodeURIComponent(audioId)}`,
    { method: "DELETE" }
  )
}

/** `newPosition` is the 0-based index the audio ends up at, matching the UI list index. */
export async function movePlaylistAudio(
  playlistId: string,
  audioId: string,
  newPosition: number
) {
  await request<string>(
    `/playlists/${encodeURIComponent(playlistId)}/audio/${encodeURIComponent(audioId)}/position/${newPosition}`,
    { method: "PUT" }
  )
}