import { describe, expect, it } from "vitest"
import { friendlyImportError, isTempAudioExpired } from "@/lib/fetch-errors"

describe("friendlyImportError", () => {
  it.each([
    ["URL host is not allowed", "That website isn't supported."],
    ["Audio fetch timed out", "Fetching took too long. Try a shorter track or try again later."],
    [
      "Unable to fetch from the provided URL",
      "Couldn't fetch audio from that link. It may be private, region-locked or unsupported.",
    ],
  ])("maps %s", (input, expected) => expect(friendlyImportError(input)).toBe(expected))

  it("passes size, duration and protocol errors through unchanged", () => {
    for (const message of [
      "Audio file must not exceed 100 MiB",
      "Audio duration must not exceed 240 minutes",
      "Only HTTP and HTTPS URLs are supported",
    ]) {
      expect(friendlyImportError(message)).toBe(message)
    }
  })

  it("detects an expired temporary audio", () => {
    expect(isTempAudioExpired("Temporary audio not found")).toBe(true)
    expect(isTempAudioExpired("Title is required")).toBe(false)
  })
})
