/**
 * 프로그램 카드가 겹겹이 쌓이는 스크롤 연출(sticky 카드 스택) 계산.
 *
 * 홈 화면 연출(anime.js 장면, CSS 전환)이 쓰는 순수 계산 함수. DOM 없이 단위 테스트한다.
 */

/** 카드 윗변이 지나가는 스크롤 구간(뷰포트 위에서부터의 px). 아래 `enter`에서 위 `leave`까지. */
export type ScrollRange = { enter: number; leave: number }

/** 카드 하나의 연출 구간: 도착(landing)과 뒤로 물러남(receding). */
export type StackPhase = {
  /** 카드 자신의 윗변이 화면 아래에서 sticky 자리까지 오는 구간. */
  landing: ScrollRange
  /** 다음 카드의 윗변이 이 카드의 아랫변(또는 화면 아래 중 더 높은 쪽)에서 다음 자리까지
      오는 구간. 마지막 카드는 null. */
  receding: ScrollRange | null
}

/** 카드들의 sticky 위치와 공통 높이로 프로그램 스택의 스크롤 구간을 계산한다. */
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
