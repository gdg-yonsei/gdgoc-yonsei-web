/** 공개 사이트 트래커의 수집 엔드포인트. 처리 규칙은 lib/server/analytics/collect/handle-collect.ts에 있다. */
import type { NextRequest } from 'next/server'
import { handleCollectRequest } from '@/lib/server/analytics/collect/handle-collect'

export function POST(request: NextRequest) {
  return handleCollectRequest(request)
}
