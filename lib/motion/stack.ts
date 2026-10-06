export type ScrollRange = { enter: number; leave: number }

export type StackPhase = {
  landing: ScrollRange
  /** 다음 카드가 현재 카드 아랫변과 화면 아래 중 높은 쪽에서 다음 자리까지 오는 구간. 마지막은 null. */
  receding: ScrollRange | null
}

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
