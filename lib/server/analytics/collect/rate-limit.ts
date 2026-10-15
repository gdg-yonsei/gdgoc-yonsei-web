/** 공개 수집 엔드포인트의 IP별 고정 창 제한. 운영이 단일 인스턴스라 메모리로 충분하다. IP는 키로만 쓰고 저장하지 않는다. */
import 'server-only'

/** `consume`은 비용을 차감하고 한도 안이면 true를 돌려준다. */
export type RateLimiter = { consume(key: string, cost: number): boolean }

// 키가 많이 쌓이면 지난 창을 한 번에 비워 메모리가 계속 늘지 않게 한다.
const PRUNE_THRESHOLD = 10_000

export function createMemoryRateLimiter(options: {
  limit: number
  windowMs: number
  now?: () => number
}): RateLimiter {
  const { limit, windowMs, now = Date.now } = options
  const windows = new Map<string, { startedAt: number; count: number }>()

  return {
    consume(key, cost) {
      const current = now()
      if (windows.size > PRUNE_THRESHOLD) {
        for (const [storedKey, window] of windows) {
          if (current - window.startedAt >= windowMs) windows.delete(storedKey)
        }
      }

      const window = windows.get(key)
      if (!window || current - window.startedAt >= windowMs) {
        windows.set(key, { startedAt: current, count: cost })
        return cost <= limit
      }
      window.count += cost
      return window.count <= limit
    },
  }
}

let collectRateLimiter: RateLimiter | null = null

/** IP당 분당 120 이벤트. 일반 방문은 분당 수십 개를 넘지 않는다. */
export function getCollectRateLimiter(): RateLimiter {
  collectRateLimiter ??= createMemoryRateLimiter({
    limit: 120,
    windowMs: 60_000,
  })
  return collectRateLimiter
}
