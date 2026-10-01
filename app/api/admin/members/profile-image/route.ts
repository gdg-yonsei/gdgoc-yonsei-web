import {
  parseRequestBody,
  privateError,
  privateForbidden,
  privateJson,
} from '@/lib/server/http'
import { authorizeMemberEdit } from '@/lib/server/services/admin/members'
import { getWebActor } from '@/lib/server/services/admin/web-actor'
import { getSafeImageExtension } from '@/lib/server/storage/object-key'
import { presignImageUpload } from '@/lib/server/storage/r2'
import { memberProfileImageUploadValidation } from '@/lib/validations/admin-api'

/**
 * 사용자의 프로필 이미지를 업로드 할 수 있는 사전 서명 URL 을 반환한다.
 */
export async function POST(request: Request) {
  // 권한 검사에 memberId 가 필요하므로 본문 검증이 먼저다.
  const body = parseRequestBody(
    memberProfileImageUploadValidation,
    await request.json().catch(() => null)
  )
  if (!body.ok) {
    return body.response
  }

  const { memberId, fileName: originalFileName, type } = body.data

  // CORE 는 낮은 역할 멤버의 이미지만 바꿀 수 있다(멤버 수정과 같은 규칙).
  const actor = await getWebActor()
  if (!actor || !(await authorizeMemberEdit(actor, memberId)).ok) {
    return privateForbidden()
  }

  const extension = getSafeImageExtension(originalFileName)
  if (!extension) {
    return privateError('Invalid file extension', 400)
  }

  const fileName = `users/${memberId}/${crypto.randomUUID()}.${extension}`
  const uploadUrl = await presignImageUpload(fileName, type)

  // fileName 은 다른 업로드 API 와 동일하게 객체 키만 담는다.
  // 공개 URL 조합은 호출부(lib/upload-image.ts)가 담당한다.
  return privateJson({ uploadUrl, fileName })
}
