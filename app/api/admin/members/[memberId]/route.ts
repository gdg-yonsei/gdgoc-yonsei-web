/** R2 업로드 뒤 최종 URL을 저장하며, 권한·입력 검증·DB 갱신은 멤버 서비스가 맡는다. */
import {
  privateForbidden,
  privateOk,
  serviceFailureResponse,
} from '@/lib/server/http'
import { updateMemberProfileImage } from '@/lib/server/services/admin/members'
import { getWebActor } from '@/lib/server/services/admin/web-actor'

export async function PUT(
  request: Request,
  { params }: RouteContext<'/api/admin/members/[memberId]'>
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
