import { useSyncExternalStore } from "react"

const MOBILE_BREAKPOINT = 768
const QUERY = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`

let mediaQuery: MediaQueryList | null = null

function getMediaQuery() {
  mediaQuery ??= window.matchMedia(QUERY)
  return mediaQuery
}

function subscribe(onStoreChange: () => void) {
  const mql = getMediaQuery()
  mql.addEventListener("change", onStoreChange)
  return () => mql.removeEventListener("change", onStoreChange)
}

export function useIsMobile() {
  return useSyncExternalStore(
    subscribe,
    () => getMediaQuery().matches,
    () => false
  )
}