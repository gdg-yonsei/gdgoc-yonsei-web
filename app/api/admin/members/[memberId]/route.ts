import { auth } from '@/auth'
import handlePermission from '@/lib/server/permission/handle-permission'
import { NextResponse } from 'next/server'
import db from '@/db'
import { users } from '@/db/schema/users'
import { eq } from 'drizzle-orm'
import { revalidateTag } from 'next/cache'

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
  const session = await auth()
  // 사용자 권한 확인
  if (!(await handlePermission(session?.user?.id, 'put', 'members'))) {
    return NextResponse.error()
  }
  // Body 에서 프로필 이미지 URL 추출
  const body = (await request.json()) as { profileImage: string }

  try {
    // 사용자 프로필 이미지 URL 업데이트 쿼리
    await db
      .update(users)
      .set({ image: body.profileImage })
      .where(eq(users.id, (await params).memberId))

    // 캐시 업데이트
    revalidateTag('members')
    return NextResponse.json({ success: true })
  } catch (e) {
    // 오류 처리
    console.error(e)
    return NextResponse.json({ success: false })
  }
}
