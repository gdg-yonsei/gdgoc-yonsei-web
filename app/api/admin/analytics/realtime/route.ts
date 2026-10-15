/** 개요 탭의 실시간 카드가 30초마다 부른다. */
import type { NextRequest } from 'next/server'
import {
  privateError,
  privateJson,
  serviceFailureResponse,
} from '@/lib/server/http'
import { getAnalyticsRealtime } from '@/lib/server/services/admin/analytics'
import { getWebActor } from '@/lib/server/services/admin/web-actor'

export async function GET(request: NextRequest) {
  const actor = await getWebActor()
  if (!actor) return privateError('Unauthorized', 401)
  const result = await getAnalyticsRealtime(
    actor,
    request.nextUrl.searchParams.get('internal') === '1'
  )
  return result.ok ? privateJson(result.data) : serviceFailureResponse(result)
}
