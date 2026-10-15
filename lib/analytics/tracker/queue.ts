/** 이벤트를 모았다가 배치로 보낸다. 전송 직전에 경과 시간(ageMs)을 붙여 서버가 자기 시계로 발생 시각을 계산하게 한다. */
import { MAX_BATCH_EVENTS } from '@/lib/analytics/constants'
import type { QueuedAnalyticsEvent } from '@/lib/analytics/events'

export type EventQueue = {
  push(event: QueuedAnalyticsEvent, options?: { immediate?: boolean }): void
  flush(): void
}

// 이만큼 쌓이면 탭이 숨겨지기 전에도 보낸다. 오래 머무는 탭에서 이벤트를 잃지 않게 한다.
const FLUSH_SIZE = 10

export function createEventQueue(
  send: (body: string) => void,
  now: () => number
): EventQueue {
  const pending: Array<{ event: QueuedAnalyticsEvent; createdAt: number }> = []

  function flush() {
    while (pending.length > 0) {
      const batch = pending.splice(0, MAX_BATCH_EVENTS)
      const sentAt = now()
      send(
        JSON.stringify({
          events: batch.map(({ event, createdAt }) => ({
            ...event,
            ageMs: Math.max(0, Math.round(sentAt - createdAt)),
          })),
        })
      )
    }
  }

  return {
    push(event, options) {
      pending.push({ event, createdAt: now() })
      if (options?.immediate || pending.length >= FLUSH_SIZE) flush()
    },
    flush,
  }
}
