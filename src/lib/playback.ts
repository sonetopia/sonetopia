export type RepeatMode = "off" | "all" | "one"

/** Random permutation of the items with `firstIndex` kept at the front. */
export function shuffleWithFirst<T>(items: T[], firstIndex: number): T[] {
  const first = items[firstIndex]
  const rest = items.filter((_, index) => index !== firstIndex)
  for (let i = rest.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[rest[i], rest[j]] = [rest[j], rest[i]]
  }
  return first === undefined ? rest : [first, ...rest]
}

/**
 * Next (delta 1) or previous (delta -1) queue index, honouring the repeat mode.
 * Returns -1 when playback should stop.
 */
export function stepIndex(
  length: number,
  currentIndex: number,
  delta: 1 | -1,
  repeat: RepeatMode
): number {
  if (length === 0) return -1
  if (currentIndex < 0) return 0
  const target = currentIndex + delta
  if (target < 0 || target >= length) {
    return repeat === "all" ? (delta > 0 ? 0 : length - 1) : -1
  }
  return target
}
