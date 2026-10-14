/**
 * 수집 요청 처리 순서: 출처 → 크기 → 스키마 → 봇 → 속도 제한 → 저장 → 응답 뒤 정리.
 * 거부 이유를 드러내지 않고 항상 204를 돌려줘 트래커가 재시도하지 않게 한다(중복보다 손실을 택함).
 */
import 'server-only'

import type { NextRequest } from 'next/server'
import { MAX_BODY_BYTES } from '@/lib/analytics/constants'
import { hasApprovedSession } from '@/lib/server/admin-route-exists'
import { runAfterResponse } from '@/lib/server/after-response'
import {
  getCollectRateLimiter,
  type RateLimiter,
} from '@/lib/server/analytics/collect/rate-limit'
import {
  claimPruneSlot,
  pruneExpiredAnalytics,
} from '@/lib/server/analytics/collect/retention'
import { analyticsBatchSchema } from '@/lib/server/analytics/collect/schema'
import { storeAnalyticsBatch } from '@/lib/server/analytics/collect/store'
import {
  isBotUserAgent,
  parseUserAgent,
} from '@/lib/server/analytics/collect/user-agent'
import { getSiteEnv } from '@/lib/server/env'
import { logger } from '@/lib/server/logger'

/** 테스트에서 저장·제한·로그인 확인을 바꿔 끼울 수 있게 모았다. */
export type CollectDependencies = {
  store: typeof storeAnalyticsBatch
  rateLimiter: RateLimiter
  isInternal: (request: NextRequest) => Promise<boolean>
  now: () => Date
}

function defaultDependencies(): CollectDependencies {
  return {
    store: storeAnalyticsBatch,
    rateLimiter: getCollectRateLimiter(),
    isInternal: hasApprovedSession,
    now: () => new Date(),
  }
}

function noContent() {
  return new Response(null, {
    status: 204,
    headers: { 'Cache-Control': 'no-store' },
  })
}

// 프록시 뒤에서 사이트 주소와 요청 호스트가 다를 수 있어 Host 헤더와 같은 출처도 허용한다.
function isSameOrigin(request: NextRequest, siteOrigin: string) {
  const origin = request.headers.get('origin')
  if (!origin) return request.headers.get('sec-fetch-site') === 'same-origin'
  if (origin === siteOrigin) return true
  const host =
    request.headers.get('x-forwarded-host') ?? request.headers.get('host')
  try {
    return host !== null && new URL(origin).host === host
  } catch {
    return false
  }
}

function clientIp(request: NextRequest) {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  )
}

function parseJson(body: string): unknown {
  try {
    return JSON.parse(body)
  } catch {
    return null
  }
}

/** `/api/pulse`의 본체. 항상 204 응답을 돌려준다. */
export async function handleCollectRequest(
  request: NextRequest,
  dependencies: CollectDependencies = defaultDependencies()
): Promise<Response> {
  const siteOrigin = new URL(getSiteEnv().NEXT_PUBLIC_SITE_URL).origin
  if (!isSameOrigin(request, siteOrigin)) return noContent()

  if (Number(request.headers.get('content-length') ?? 0) > MAX_BODY_BYTES) {
    return noContent()
  }
  const body = await request.text()
  if (new TextEncoder().encode(body).byteLength > MAX_BODY_BYTES)
    return noContent()

  const parsed = analyticsBatchSchema.safeParse(parseJson(body))
  if (!parsed.success) return noContent()

  const userAgent = request.headers.get('user-agent')
  if (isBotUserAgent(userAgent)) return noContent()

  const { events } = parsed.data
  if (!dependencies.rateLimiter.consume(clientIp(request), events.length)) {
    return noContent()
  }

  const now = dependencies.now()
  let internal: Promise<boolean> | null = null
  try {
    await dependencies.store(events, {
      now,
      siteHost: new URL(siteOrigin).hostname,
      userAgent: parseUserAgent(userAgent ?? ''),
      // 로그인 확인이 실패해도 방문 기록은 남긴다. 내부 표시만 빠진다.
      resolveIsInternal: () =>
        (internal ??= dependencies.isInternal(request).catch(() => false)),
    })
  } catch (error) {
    logger.error('analytics.collect', error, { events: events.length })
  }

  if (claimPruneSlot(now)) {
    runAfterResponse('analytics.prune', async () => {
      const deleted = await pruneExpiredAnalytics(now)
      if (deleted > 0)
        logger.info('analytics.prune', 'Deleted expired sessions', { deleted })
    })
  }
  return noContent()
}
