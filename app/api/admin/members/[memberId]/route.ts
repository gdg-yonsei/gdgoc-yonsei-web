import { getAuthSession } from '@/auth'
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
import handlePermission from '@/lib/server/permission/handle-permission'
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

  const session = await getAuthSession()
  if (
    !(await handlePermission(session?.user?.id, 'put', 'members', memberId))
  ) {
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
