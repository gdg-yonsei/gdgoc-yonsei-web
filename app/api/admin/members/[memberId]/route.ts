import { auth } from '@/auth'
import handlePermission from '@/lib/server/permission/handle-permission'
import { NextResponse } from 'next/server'
import db from '@/db'
import { users } from '@/db/schema/users'
import { eq } from 'drizzle-orm'
import { revalidateCache } from '@/lib/server/cache'
import { updateMemberProfileImageValidation } from '@/lib/validations/admin-api'

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
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  // Body 에서 프로필 이미지 URL 추출
  const json = await request.json().catch(() => null)
  const bodyValidationResult = updateMemberProfileImageValidation.safeParse(json)

  if (!bodyValidationResult.success) {
    return NextResponse.json(
      { error: bodyValidationResult.error.issues[0].message },
      { status: 400 }
    )
  }

  try {
    // 사용자 프로필 이미지 URL 업데이트 쿼리
    await db
      .update(users)
      .set({ image: bodyValidationResult.data.profileImage })
      .where(eq(users.id, memberId))

    // 캐시 업데이트
    revalidateCache('members')
    return NextResponse.json({ success: true })
  } catch (e) {
    // 오류 처리
    console.error(e)
    return NextResponse.json({ success: false })
  }
}
