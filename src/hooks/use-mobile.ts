import { useCallback, useMemo, useSyncExternalStore } from "react"

export const MOBILE_BREAKPOINT = 768

const mediaQueries = new Map<string, MediaQueryList>()

function getMediaQuery(breakpoint: number) {
  const query = `(max-width: ${breakpoint - 1}px)`
  const cached = mediaQueries.get(query)
  if (cached) return cached
  const mediaQuery = window.matchMedia(query)
  mediaQueries.set(query, mediaQuery)
  return mediaQuery
}

/** Reactive `window.matchMedia("(max-width: ...)")` — updates on resize and rotation. */
export function useIsMobile(breakpoint = MOBILE_BREAKPOINT) {
  const mediaQuery = useMemo(() => getMediaQuery(breakpoint), [breakpoint])

  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      mediaQuery.addEventListener("change", onStoreChange)
      return () => mediaQuery.removeEventListener("change", onStoreChange)
    },
    [mediaQuery]
  )

  const getSnapshot = useCallback(() => mediaQuery.matches, [mediaQuery])

  return useSyncExternalStore(subscribe, getSnapshot, () => false)
}
