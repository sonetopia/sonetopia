import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { afterEach, describe, expect, it, vi } from "vitest"
import type { AudioSearchResult } from "@/api/audio"
import { SearchResults, sourceLabel } from "@/components/upload/SearchResults"
import { initialSearchState, type SearchState } from "@/lib/audio-search"

afterEach(cleanup)

function item(id: string, patch: Partial<AudioSearchResult> = {}): AudioSearchResult {
  return {
    title: `Track ${id}`,
    url: `https://music.youtube.com/watch?v=${id}`,
    uploader: null,
    duration: null,
    thumbnail: null,
    source: "youtube_music",
    inLibrary: false,
    libraryAudioId: null,
    ...patch,
  }
}

function renderResults(patch: Partial<SearchState>) {
  const props = {
    state: { ...initialSearchState, query: "yellow", status: "ready" as const, ...patch },
    busy: false,
    onImport: vi.fn(),
    onLoadMore: vi.fn(),
    onRetry: vi.fn(),
  }
  const view = render(
    <MemoryRouter>
      <SearchResults {...props} />
    </MemoryRouter>
  )
  return { ...props, container: view.container }
}

describe("SearchResults", () => {
  it("labels sources with brand casing", () => {
    expect(sourceLabel("youtube_music")).toBe("YouTube Music")
    expect(sourceLabel("soundcloud")).toBe("SoundCloud")
    expect(sourceLabel("bandcamp_live")).toBe("Bandcamp Live")
  })

  it("never renders null, undefined or a zero duration for missing fields", () => {
    const { container } = renderResults({ results: [item("a", { duration: 0 })] })
    const text = container.textContent ?? ""
    expect(text).toContain("Track a")
    expect(text).toContain("YouTube Music")
    expect(text).not.toMatch(/null|undefined|0:00|--:--|Unknown/)
  })

  it("shows uploader and duration when present", () => {
    renderResults({ results: [item("a", { uploader: "Coldplay", duration: 269 })] })
    expect(screen.getByText("Coldplay")).toBeTruthy()
    expect(screen.getByText(/4:29/)).toBeTruthy()
  })

  it("shows an In library badge and a link instead of an import button", () => {
    renderResults({ results: [item("a", { inLibrary: true, libraryAudioId: "abc-123" })] })
    expect(screen.getByText("In library")).toBeTruthy()
    expect(screen.queryByRole("button", { name: /^Import/ })).toBeNull()
    expect(screen.getByRole("link", { name: /Open Track a in library/ }).getAttribute("href")).toBe(
      "/library?audio=abc-123"
    )
  })

  it("imports a result that is not in the library yet", () => {
    const props = renderResults({ results: [item("a")] })
    fireEvent.click(screen.getByRole("button", { name: "Import Track a" }))
    expect(props.onImport).toHaveBeenCalledWith(expect.objectContaining({ title: "Track a" }))
  })

  it("shows Load more only while hasMore is true", () => {
    const props = renderResults({ results: [item("a")], hasMore: true })
    fireEvent.click(screen.getByRole("button", { name: "Load more" }))
    expect(props.onLoadMore).toHaveBeenCalledTimes(1)
  })

  it("hides Load more once there is nothing left", () => {
    renderResults({ results: [item("a")], hasMore: false })
    expect(screen.queryByRole("button", { name: "Load more" })).toBeNull()
    expect(screen.getByText(/all the results/)).toBeTruthy()
  })

  it("disables the button while loading more but keeps the list", () => {
    renderResults({ results: [item("a")], hasMore: true, status: "loadingMore" })
    const button = screen.getByRole("button", { name: "Loading..." }) as HTMLButtonElement
    expect(button.disabled).toBe(true)
    expect(screen.getByText("Track a")).toBeTruthy()
  })

  it("shows the empty state", () => {
    renderResults({ results: [] })
    expect(screen.getByText(/No results for/)).toBeTruthy()
  })

  it("shows an error with retry for a failed search", () => {
    const props = renderResults({ status: "error", error: "Search is currently unavailable" })
    expect(screen.getByRole("alert").textContent).toContain("Search is currently unavailable")
    fireEvent.click(screen.getByRole("button", { name: "Try again" }))
    expect(props.onRetry).toHaveBeenCalled()
  })
})
