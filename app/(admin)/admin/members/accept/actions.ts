'use server'

import { auth } from '@/auth'
import handlePermission from '@/lib/admin/handle-permission'
import { forbidden, redirect } from 'next/navigation'
import getAcceptMemberFormData from '@/lib/admin/get-accept-member-form-data'
import { acceptMemberValidation } from '@/lib/validations/accept-member'
import { z } from 'zod'
import db from '@/db'
import { users } from '@/db/schema/users'
import { eq } from 'drizzle-orm'
import { revalidateTag } from 'next/cache'

export default async function actions(
  prev: { error: string },
  formData: FormData
) {
  // 사용자를 추가할 추가할 권한이 있는지 확인
  const session = await auth()
  if (!(await handlePermission(session?.user?.id, 'put', 'membersRole'))) {
    return forbidden()
  }
  const { userId, role } = getAcceptMemberFormData(formData)

  try {
    acceptMemberValidation.parse({ userId, role })
  } catch (err) {
    // 데이터 형식이 맞지 않을 경우 오류 반환
    if (err instanceof z.ZodError) {
      console.log(err.issues)
      return { error: err.issues[0].message }
    }
  }

  const userRole: 'UNVERIFIED' | 'MEMBER' | 'CORE' | 'ALUMNUS' | 'LEAD' =
    role === 'member'
      ? 'MEMBER'
      : role === 'core'
        ? 'CORE'
        : role === 'alumni'
          ? 'ALUMNUS'
          : 'UNVERIFIED'

  try {
    await db.update(users).set({ role: userRole }).where(eq(users.id, userId))
    revalidateTag('members')
  } catch (e) {
    // DB 업데이트 오류
    console.error(e)
    return { error: 'DB Update Error' }
  }

  redirect('/admin/members/accept')
}
