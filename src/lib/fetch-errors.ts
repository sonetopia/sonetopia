/** Friendlier text for the known `/audio/fetch` and save errors; unknown messages pass through. */
export function friendlyImportError(message: string) {
  if (/host is not allowed/i.test(message)) return "That website isn't supported."
  if (/fetch timed out/i.test(message) || /took too long/i.test(message))
    return "Fetching took too long. Try a shorter track or try again later."
  if (/unable to fetch from the provided url/i.test(message))
    return "Couldn't fetch audio from that link. It may be private, region-locked or unsupported."
  return message
}

export function isTempAudioExpired(message: string) {
  return /temporary audio not found/i.test(message)
}
