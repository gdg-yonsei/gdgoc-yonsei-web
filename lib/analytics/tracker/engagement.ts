/** 탭이 보이고 포커스가 있는 동안만 참여 시간을 센다(GA4 user_engagement와 같은 의미). */

export type EngagementTimer = {
  pause(): void
  resume(): void
  total(): number
}

export function createEngagementTimer(
  now: () => number,
  startActive: boolean
): EngagementTimer {
  let accumulated = 0
  let activeSince: number | null = startActive ? now() : null

  return {
    pause() {
      if (activeSince === null) return
      accumulated += now() - activeSince
      activeSince = null
    },
    resume() {
      activeSince ??= now()
    },
    total() {
      return accumulated + (activeSince === null ? 0 : now() - activeSince)
    },
  }
}
