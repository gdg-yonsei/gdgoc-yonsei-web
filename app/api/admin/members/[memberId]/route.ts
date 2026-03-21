import { auth } from '@/auth'
import handlePermission from '@/lib/server/permission/handle-permission'
import db from '@/db'
import { users } from '@/db/schema/users'
import { eq } from 'drizzle-orm'
import { updateMemberProfileImageValidation } from '@/lib/validations/admin-api'
import { invalidateMemberPublicCache } from '@/lib/server/cache'
import { privateJson } from '@/lib/server/http'
import { logger } from '@/lib/server/logger'
import { getGenerationNamesForUserId } from '@/lib/server/services/cache-context'

/**
 * 사용자의 프로필 이미지 URL 을 업데이트 하는 API
 * @param request
 * @param params
 * @constructor
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ memberId: string }> }
) {
  const { memberId } = await params
  const session = await auth()
  // 사용자 권한 확인
  if (!(await handlePermission(session?.user?.id, 'put', 'members', memberId))) {
    return privateJson({ error: 'Forbidden' }, { status: 403 })
  }
  // Body 에서 프로필 이미지 URL 추출
  const json = await request.json().catch(() => null)
  const bodyValidationResult = updateMemberProfileImageValidation.safeParse(json)

  if (!bodyValidationResult.success) {
    return privateJson(
      { error: bodyValidationResult.error.issues[0]?.message ?? 'Validation failed' },
      { status: 400 }
    )
  }

  try {
    const generationNames = await getGenerationNamesForUserId(memberId)

    // 사용자 프로필 이미지 URL 업데이트 쿼리
    await db
      .update(users)
      .set({ image: bodyValidationResult.data.profileImage })
      .where(eq(users.id, memberId))

    invalidateMemberPublicCache({
      memberId,
      generationNames,
    })

    return privateJson({ success: true })
  } catch (e) {
    logger.error('api.admin.members.profile-image', e, {
      memberId,
    })
    return privateJson({ success: false }, { status: 500 })
  }
}
