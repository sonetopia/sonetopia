import { act, renderHook, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { AudioSearchResponse, AudioSearchResult } from "@/api/audio"
import {
  initialSearchState,
  nextPageParams,
  searchReducer,
  useAudioSearch,
  type SearchState,
} from "@/lib/audio-search"

const searchAudio = vi.hoisted(() => vi.fn())
vi.mock("@/api/audio", () => ({ searchAudio }))

function result(id: string, patch: Partial<AudioSearchResult> = {}): AudioSearchResult {
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

function page(ids: string[], patch: Partial<AudioSearchResponse> = {}): AudioSearchResponse {
  return {
    source: "youtube_music",
    offset: 0,
    limit: 10,
    hasMore: true,
    results: ids.map((id) => result(id)),
    ...patch,
  }
}

function loading(patch: Partial<SearchState> = {}): SearchState {
  return { ...initialSearchState, query: "yellow", requestId: 1, status: "loading", ...patch }
}

describe("searchReducer", () => {
  it("appends results from the next page and skips duplicate urls", () => {
    let state = searchReducer(loading(), { type: "success", requestId: 1, response: page(["a", "b"]) })
    state = searchReducer(state, { type: "more", requestId: 2 })
    state = searchReducer(state, {
      type: "success",
      requestId: 2,
      response: page(["b", "c"], { offset: 10, hasMore: false }),
    })

    expect(state.results.map((r) => r.title)).toEqual(["Track a", "Track b", "Track c"])
    expect(state.hasMore).toBe(false)
    expect(state.status).toBe("ready")
  })

  it("resets everything when a new query starts", () => {
    const loaded = searchReducer(loading(), {
      type: "success",
      requestId: 1,
      response: page(["a"], { source: "youtube" }),
    })
    const next = searchReducer(loaded, { type: "search", query: "blue", requestId: 2 })

    expect(next).toMatchObject({
      query: "blue",
      source: null,
      offset: 0,
      hasMore: false,
      results: [],
      status: "loading",
    })
  })

  it("ignores responses for a request that is no longer current", () => {
    const state = loading({ requestId: 3 })
    expect(searchReducer(state, { type: "success", requestId: 2, response: page(["a"]) })).toBe(state)
    expect(searchReducer(state, { type: "failure", requestId: 2, message: "x" })).toBe(state)
  })

  it("keeps loaded results when load more fails", () => {
    let state = searchReducer(loading(), { type: "success", requestId: 1, response: page(["a"]) })
    state = searchReducer(state, { type: "more", requestId: 2 })
    state = searchReducer(state, { type: "failure", requestId: 2, message: "boom" })

    expect(state.results).toHaveLength(1)
    expect(state).toMatchObject({ status: "error", errorOnMore: true, error: "boom" })
  })

  it("keeps the source when a later page reports none", () => {
    let state = searchReducer(loading(), {
      type: "success",
      requestId: 1,
      response: page(["a"], { source: "soundcloud" }),
    })
    state = searchReducer(state, { type: "more", requestId: 2 })
    state = searchReducer(state, {
      type: "success",
      requestId: 2,
      response: page([], { source: null, offset: 10, hasMore: false }),
    })
    expect(state.source).toBe("soundcloud")
  })

  it("marks one result as in the library", () => {
    const state = searchReducer(loading({ results: [result("a"), result("b")] }), {
      type: "markInLibrary",
      url: result("b").url,
      audioId: "audio-1",
    })
    expect(state.results[0].inLibrary).toBe(false)
    expect(state.results[1]).toMatchObject({ inLibrary: true, libraryAudioId: "audio-1" })
  })

  it("builds next-page params from the last response", () => {
    const state = loading({ source: "youtube", offset: 10, limit: 10 })
    expect(nextPageParams(state)).toEqual({
      query: "yellow",
      offset: 20,
      limit: 10,
      source: "youtube",
    })
  })
})

describe("useAudioSearch", () => {
  beforeEach(() => searchAudio.mockReset())

  it("passes source and offset on later pages, and starts over on a new query", async () => {
    searchAudio
      .mockResolvedValueOnce(page(["a", "b"], { source: "youtube" }))
      .mockResolvedValueOnce(page(["c"], { source: "youtube", offset: 10, hasMore: false }))
      .mockResolvedValueOnce(page(["z"], { source: "youtube_music" }))

    const { result: hook } = renderHook(() => useAudioSearch())

    act(() => hook.current.search("  yellow "))
    await waitFor(() => expect(hook.current.state.status).toBe("ready"))
    expect(searchAudio.mock.calls[0][0]).toMatchObject({ query: "yellow", offset: 0 })
    expect(searchAudio.mock.calls[0][0].source).toBeUndefined()

    act(() => hook.current.loadMore())
    await waitFor(() => expect(hook.current.state.results).toHaveLength(3))
    expect(searchAudio.mock.calls[1][0]).toMatchObject({
      query: "yellow",
      offset: 10,
      source: "youtube",
    })
    expect(hook.current.state.hasMore).toBe(false)

    act(() => hook.current.search("blue"))
    expect(hook.current.state.results).toHaveLength(0)
    await waitFor(() => expect(hook.current.state.status).toBe("ready"))
    expect(searchAudio.mock.calls[2][0]).toMatchObject({ query: "blue", offset: 0 })
    expect(searchAudio.mock.calls[2][0].source).toBeUndefined()
  })

  it("drops a slow response once the query has changed", async () => {
    let resolveFirst!: (value: AudioSearchResponse) => void
    searchAudio
      .mockReturnValueOnce(new Promise((resolve) => (resolveFirst = resolve)))
      .mockResolvedValueOnce(page(["new"]))

    const { result: hook } = renderHook(() => useAudioSearch())
    act(() => hook.current.search("old"))
    act(() => hook.current.search("new"))
    await waitFor(() => expect(hook.current.state.status).toBe("ready"))

    await act(async () => resolveFirst(page(["old"])))
    expect(hook.current.state.query).toBe("new")
    expect(hook.current.state.results.map((r) => r.title)).toEqual(["Track new"])
  })

  it("surfaces a 502 and retries the same query", async () => {
    searchAudio
      .mockRejectedValueOnce(new Error("Search is currently unavailable"))
      .mockResolvedValueOnce(page(["a"]))

    const { result: hook } = renderHook(() => useAudioSearch())
    act(() => hook.current.search("yellow"))
    await waitFor(() => expect(hook.current.state.status).toBe("error"))
    expect(hook.current.state.error).toBe("Search is currently unavailable")

    act(() => hook.current.retry())
    await waitFor(() => expect(hook.current.state.status).toBe("ready"))
    expect(searchAudio).toHaveBeenCalledTimes(2)
  })
})
