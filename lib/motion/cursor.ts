type Box = { left: number; top: number; width: number; height: number }

/** The word a statement has lit up to, at a given crossing progress:
    -1 before it starts, the last word once it has crossed. */
export function wordIndexAt(progress: number, count: number): number {
  if (progress <= 0 || count === 0) return -1
  return Math.min(count - 1, Math.floor(progress * count))
}

/** The bracket band behind a word: the word plus `reach` either side (room
    for the band's `< >` notches), `height` tall, centred on its line. */
export function bandFrame(
  word: Box,
  { reach, height }: { reach: number; height: number }
) {
  return {
    x: word.left - reach,
    y: word.top + (word.height - height) / 2,
    width: word.width + reach * 2,
    height,
  }
}
