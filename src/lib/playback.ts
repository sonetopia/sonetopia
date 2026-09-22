export type RepeatMode = "off" | "all" | "one"

/** Random permutation of queue indices with `first` kept at the front. */
export function shuffledOrder(length: number, first: number): number[] {
  const rest = Array.from({ length }, (_, index) => index).filter((index) => index !== first)
  for (let i = rest.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[rest[i], rest[j]] = [rest[j], rest[i]]
  }
  return first >= 0 && first < length ? [first, ...rest] : rest
}

/**
 * Next (delta 1) or previous (delta -1) queue index, honouring the repeat mode.
 * Returns -1 when playback should stop.
 */
export function stepIndex(
  order: number[],
  currentIndex: number,
  delta: 1 | -1,
  repeat: RepeatMode
): number {
  if (order.length === 0) return -1
  const at = order.indexOf(currentIndex)
  if (at === -1) return order[0]
  const target = at + delta
  if (target < 0 || target >= order.length) {
    return repeat === "all" ? (delta > 0 ? order[0] : order[order.length - 1]) : -1
  }
  return order[target]
}