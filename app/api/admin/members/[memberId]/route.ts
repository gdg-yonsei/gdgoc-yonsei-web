import db from '@/db'
import { users } from '@/db/schema/users'
import { eq } from 'drizzle-orm'
import { invalidateMemberPublicCache } from '@/lib/server/cache'
import {
  parseRequestBody,
  privateError,
  privateForbidden,
  privateOk,
} from '@/lib/server/http'
import { logger } from '@/lib/server/logger'
import { authorizeMemberEdit } from '@/lib/server/services/admin/members'
import { getWebActor } from '@/lib/server/services/admin/web-actor'
import { getGenerationNamesForUserId } from '@/lib/server/services/cache-context'
import { updateMemberProfileImageValidation } from '@/lib/validations/admin-api'

/**
 * 사용자의 프로필 이미지 URL 을 업데이트 한다.
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ memberId: string }> }
) {
  const { memberId } = await params

  // CORE 는 낮은 역할 멤버의 이미지만 바꿀 수 있다(멤버 수정과 같은 규칙).
  const actor = await getWebActor()
  if (!actor || !(await authorizeMemberEdit(actor, memberId)).ok) {
    return privateForbidden()
  }

  const body = parseRequestBody(
    updateMemberProfileImageValidation,
    await request.json().catch(() => null)
  )
  if (!body.ok) {
    return body.response
  }

  try {
    const generationNames = await getGenerationNamesForUserId(memberId)

    await db
      .update(users)
      .set({ image: body.data.profileImage })
      .where(eq(users.id, memberId))

    invalidateMemberPublicCache({ memberId, generationNames })
  } catch (error) {
    logger.error('api.admin.members.profile-image', error, { memberId })
    return privateError('Failed to update the profile image', 500)
  }

  return privateOk()
}
