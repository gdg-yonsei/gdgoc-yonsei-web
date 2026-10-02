/**
 * 관리자 API: 멤버 프로필 이미지 URL 저장.
 *
 * 브라우저가 R2에 이미지를 올린 뒤(사전 서명 URL은 `profile-image` 라우트가 발급) 이
 * 라우트로 최종 URL을 저장한다. 권한 검사, 입력 검증, DB 갱신은 멤버 서비스가 맡는다.
 */
import {
  privateForbidden,
  privateOk,
  serviceFailureResponse,
} from '@/lib/server/http'
import { updateMemberProfileImage } from '@/lib/server/services/admin/members'
import { getWebActor } from '@/lib/server/services/admin/web-actor'

/** 멤버의 프로필 이미지 URL을 바꾼다. 수정 권한이 없으면 403을 돌려준다. */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ memberId: string }> }
) {
  const { memberId } = await params

  const actor = await getWebActor()
  if (!actor) {
    return privateForbidden()
  }

  const result = await updateMemberProfileImage(
    actor,
    memberId,
    await request.json().catch(() => null)
  )
  return result.ok ? privateOk() : serviceFailureResponse(result)
}
