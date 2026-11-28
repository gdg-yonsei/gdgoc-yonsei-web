import {
  parseRequestBody,
  privateForbidden,
  privateJson,
  serviceFailureResponse,
} from '@/lib/server/http'
import { presignWebImageUploads } from '@/lib/server/services/admin/images/web-upload'
import { authorizeMemberEdit } from '@/lib/server/services/admin/members'
import { getWebActor } from '@/lib/server/services/admin/web-actor'
import { memberProfileImageUploadValidation } from '@/lib/validations/admin-api'

export async function POST(request: Request) {
  // 권한 검사에 memberId 가 필요하므로 본문 검증이 먼저다.
  const body = parseRequestBody(
    memberProfileImageUploadValidation,
    await request.json().catch(() => null)
  )
  if (!body.ok) {
    return body.response
  }

  const { memberId, ...image } = body.data

  // CORE 는 낮은 역할 멤버의 이미지만 바꿀 수 있다(멤버 수정과 같은 규칙).
  const actor = await getWebActor()
  const editable = actor ? await authorizeMemberEdit(actor, memberId) : null
  if (!actor || !editable?.ok) {
    return privateForbidden()
  }

  // 키에는 요청 값이 아니라 DB에서 확인한 멤버 id를 쓴다.
  const uploads = await presignWebImageUploads(
    actor,
    `users/${editable.data.id}`,
    [image]
  )
  if (!uploads.ok) return serviceFailureResponse(uploads)

  // fileName 은 다른 업로드 API 와 동일하게 객체 키만 담는다.
  // 공개 URL 조합은 호출부(lib/upload-image.ts)가 담당한다.
  return privateJson(uploads.data[0])
}
