import { useCallback, useEffect, useReducer, useRef } from "react"
import {
  searchAudio,
  type AudioSearchResponse,
  type AudioSearchResult,
  type SearchSource,
} from "@/api/audio"
import { SIGN_IN_REQUIRED_MESSAGE } from "@/lib/session"

export const SEARCH_PAGE_SIZE = 10

export type SearchStatus = "idle" | "loading" | "loadingMore" | "ready" | "error"

export type SearchState = {
  /** The submitted query that `results` belong to. */
  query: string
  /** Source of the last response; sent back on every page after the first. */
  source: SearchSource | null
  offset: number
  limit: number
  hasMore: boolean
  results: AudioSearchResult[]
  status: SearchStatus
  error: string | null
  /** True when the failed request was a "load more" (results are kept). */
  errorOnMore: boolean
  /** Id of the request whose response is still wanted; older responses are dropped. */
  requestId: number
}

export type SearchAction =
  | { type: "search"; query: string; requestId: number }
  | { type: "more"; requestId: number }
  | { type: "success"; requestId: number; response: AudioSearchResponse }
  | { type: "failure"; requestId: number; message: string | null }
  | { type: "reset"; requestId: number }
  | { type: "markInLibrary"; url: string; audioId: string }

export const initialSearchState: SearchState = {
  query: "",
  source: null,
  offset: 0,
  limit: SEARCH_PAGE_SIZE,
  hasMore: false,
  results: [],
  status: "idle",
  error: null,
  errorOnMore: false,
  requestId: 0,
}

export function searchReducer(state: SearchState, action: SearchAction): SearchState {
  switch (action.type) {
    case "search":
      // A new query always starts over: no source, offset 0, no leftover results.
      return {
        ...initialSearchState,
        query: action.query,
        status: "loading",
        requestId: action.requestId,
      }
    case "more":
      return {
        ...state,
        status: "loadingMore",
        error: null,
        errorOnMore: false,
        requestId: action.requestId,
      }
    case "success": {
      if (action.requestId !== state.requestId) return state
      const { response } = action
      const known = new Set(state.results.map((result) => result.url))
      const fresh: AudioSearchResult[] = []
      for (const result of response.results) {
        if (known.has(result.url)) continue
        known.add(result.url)
        fresh.push(result)
      }
      return {
        ...state,
        source: response.source ?? state.source,
        offset: response.offset,
        limit: response.limit,
        hasMore: response.hasMore,
        results: [...state.results, ...fresh],
        status: "ready",
        error: null,
        errorOnMore: false,
      }
    }
    case "failure":
      if (action.requestId !== state.requestId) return state
      return {
        ...state,
        // A 401 already opened the sign-in dialog; nothing to show in the list.
        status: action.message === null ? (state.results.length ? "ready" : "idle") : "error",
        error: action.message,
        errorOnMore: state.status === "loadingMore",
      }
    case "reset":
      return { ...initialSearchState, requestId: action.requestId }
    case "markInLibrary":
      return {
        ...state,
        results: state.results.map((result) =>
          result.url === action.url
            ? { ...result, inLibrary: true, libraryAudioId: action.audioId }
            : result
        ),
      }
  }
}

/** Params for the page after the current one; always carries the source of the last response. */
export function nextPageParams(state: SearchState) {
  return {
    query: state.query,
    offset: state.offset + state.limit,
    limit: state.limit,
    source: state.source,
  }
}

export function useAudioSearch() {
  const [state, dispatch] = useReducer(searchReducer, initialSearchState)
  const stateRef = useRef(state)
  const controllerRef = useRef<AbortController | null>(null)
  const idRef = useRef(0)

  useEffect(() => {
    stateRef.current = state
  }, [state])

  useEffect(() => () => controllerRef.current?.abort(), [])

  const run = useCallback(
    async (
      params: { query: string; offset?: number; limit?: number; source?: SearchSource | null },
      requestId: number
    ) => {
      controllerRef.current?.abort()
      const controller = new AbortController()
      controllerRef.current = controller
      try {
        const response = await searchAudio({ ...params, signal: controller.signal })
        dispatch({ type: "success", requestId, response })
      } catch (cause) {
        if (controller.signal.aborted) return
        const message = cause instanceof Error ? cause.message : "Search failed"
        dispatch({
          type: "failure",
          requestId,
          message: message === SIGN_IN_REQUIRED_MESSAGE ? null : message,
        })
      }
    },
    []
  )

  const search = useCallback(
    (query: string) => {
      const trimmed = query.trim()
      const requestId = ++idRef.current
      if (!trimmed) {
        controllerRef.current?.abort()
        dispatch({ type: "reset", requestId })
        return
      }
      dispatch({ type: "search", query: trimmed, requestId })
      void run({ query: trimmed, offset: 0, limit: SEARCH_PAGE_SIZE }, requestId)
    },
    [run]
  )

  const loadMore = useCallback(() => {
    const current = stateRef.current
    if (!current.hasMore || current.status === "loading" || current.status === "loadingMore") return
    const requestId = ++idRef.current
    dispatch({ type: "more", requestId })
    void run(nextPageParams(current), requestId)
  }, [run])

  const retry = useCallback(() => {
    const current = stateRef.current
    if (current.errorOnMore) loadMore()
    else if (current.query) search(current.query)
  }, [loadMore, search])

  const reset = useCallback(() => {
    controllerRef.current?.abort()
    dispatch({ type: "reset", requestId: ++idRef.current })
  }, [])

  const markInLibrary = useCallback(
    (url: string, audioId: string) => dispatch({ type: "markInLibrary", url, audioId }),
    []
  )

  return { state, search, loadMore, retry, reset, markInLibrary }
}
