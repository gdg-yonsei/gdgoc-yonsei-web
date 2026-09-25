/** A scroll range as viewport offsets (px from the top) that a card's top
    edge passes: from `enter` down the screen to `leave` up it. */
export type ScrollRange = { enter: number; leave: number }

export type StackPhase = {
  /** The card's own top travelling from the fold to its sticky slot. */
  landing: ScrollRange
  /** The next card's top travelling from this card's bottom edge (or the
      fold, whichever is higher) to the next slot; null for the last card. */
  receding: ScrollRange | null
}

/** Scroll ranges for the programs stack, from the cards' sticky slots and
    their shared height. */
export function stackPhases({
  slots,
  height,
  viewport,
}: {
  slots: readonly number[]
  height: number
  viewport: number
}): StackPhase[] {
  return slots.map((slot, index) => {
    const next = slots[index + 1]
    return {
      landing: { enter: viewport, leave: slot },
      receding:
        next === undefined
          ? null
          : { enter: Math.min(slot + height, viewport), leave: next },
    }
  })
}
