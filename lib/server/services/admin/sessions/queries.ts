/**
 * 세션 조회 서비스: 목록, 상세, 수정 폼용 입력 변환.
 *
 * 조회 권한(`sessionsPage`)과 기수 범위를 확인한 뒤 fetcher로 데이터를 읽는다.
 */
import 'server-only'

import { getSession } from '@/lib/server/fetcher/admin/get-session'
import {
  getSessions,
  type AdminSessionListItem,
} from '@/lib/server/fetcher/admin/get-sessions'
import { authorize } from '@/lib/server/services/admin/authorize'
import { resolveRequestedGenerationScope } from '@/lib/server/services/admin/generation-scope'
import { toPublicUser } from '@/lib/server/services/admin/public-user'
import {
  fail,
  ok,
  type Actor,
  type ServiceResult,
} from '@/lib/server/services/admin/types'
import {
  NOT_FOUND,
  type SessionInput,
} from '@/lib/server/services/admin/sessions/shared'

/** 범위(기수)의 세션 목록. */
export async function listSessions(
  actor: Actor,
  { generation }: { generation?: number | 'all' } = {}
): Promise<ServiceResult<AdminSessionListItem[]>> {
  const authorization = authorize(actor, 'get', 'sessionsPage')
  if (!authorization.ok) return authorization

  const resolved = await resolveRequestedGenerationScope(actor, generation)
  if (!resolved.ok) return resolved
  const scope = resolved.data
  if (!scope) return ok([])

  return ok(await getSessions(scope))
}

async function loadSessionDetail(sessionId: string) {
  const session = await getSession(sessionId)
  if (!session) return null

  const { userToSession: participants, author, part, ...fields } = session
  return {
    ...fields,
    part: part
      ? {
          id: part.id,
          name: part.name,
          generationId: part.generationsId,
          generationName: part.generation?.name ?? null,
        }
      : null,
    author: author ? toPublicUser(author) : null,
    participants: participants.map((row) => toPublicUser(row.user)),
  }
}

/** 세션 상세(파트·기수, 작성자, 참가자). */
export type SessionDetail = NonNullable<
  Awaited<ReturnType<typeof loadSessionDetail>>
>

/** 세션 상세. */
export async function getSessionDetail(
  actor: Actor,
  sessionId: string
): Promise<ServiceResult<SessionDetail>> {
  const authorization = authorize(actor, 'get', 'sessionsPage')
  if (!authorization.ok) return authorization

  const detail = await loadSessionDetail(sessionId)
  return detail ? ok(detail) : fail('NOT_FOUND', NOT_FOUND)
}

/** 상세 조회 결과를 세션 검증 스키마의 입력 형태로 되돌린다(부분 수정 병합용). */
export function sessionToInput(detail: SessionDetail): SessionInput {
  return {
    name: detail.name,
    nameKo: detail.nameKo,
    description: detail.description ?? '',
    descriptionKo: detail.descriptionKo ?? '',
    mainImage: detail.mainImage,
    contentImages: detail.images,
    location: detail.location ?? '',
    locationKo: detail.locationKo ?? '',
    maxCapacity: detail.maxCapacity ?? 1,
    internalOpen: detail.internalOpen ?? false,
    publicOpen: detail.publicOpen ?? false,
    startAt: detail.startAt as Date,
    endAt: detail.endAt as Date,
    partId: String(detail.partId ?? ''),
    participantId: detail.participants.map((participant) => participant.id),
    type: detail.type ?? 'Part Session',
    category: detail.category,
    displayOnWebsite: detail.displayOnWebsite ?? true,
  }
}
