'use server'

import { auth } from '@/auth'
import handlePermission from '@/lib/server/permission/handle-permission'
import { forbidden, redirect } from 'next/navigation'
import getAcceptMemberFormData from '@/lib/server/form-data/get-accept-member-form-data'
import { acceptMemberValidation } from '@/lib/validations/accept-member'
import db from '@/db'
import { users } from '@/db/schema/users'
import { eq } from 'drizzle-orm'
import { revalidateCache } from '@/lib/server/cache'
import getDeleteMemberFormData from '@/lib/server/form-data/get-delete-member-form-data'
import { deleteMemberValidation } from '@/lib/validations/delete-member'

/**
 * `acceptMemberAction` 함수는 전달받은 입력값을 바탕으로 필요한 비즈니스 로직을 수행합니다.
 *
 * 구동 원리:
 * 1. 입력값(없음)을 기준으로 전처리/검증 또는 조회 조건을 구성합니다.
 * 2. 함수 본문의 조건 분기와 동기/비동기 로직을 순서대로 실행합니다.
 * 3. 계산 결과를 반환하거나 캐시/DB/리다이렉트 등 필요한 부수 효과를 반영합니다.
 *
 * 작동 결과:
 * - 호출부에서 즉시 활용 가능한 결과값 또는 실행 상태를 제공합니다.
 * - 후속 로직이 안정적으로 이어질 수 있도록 일관된 동작을 보장합니다.
 */
export default async function acceptMemberAction(
  prev: { error: string },
  formData: FormData
) {
  // 사용자를 추가할 추가할 권한이 있는지 확인
  const session = await auth()
  if (!(await handlePermission(session?.user?.id, 'put', 'membersRole'))) {
    return forbidden()
  }
  const parsedDataResult = acceptMemberValidation.safeParse(
    getAcceptMemberFormData(formData)
  )

  if (!parsedDataResult.success) {
    console.log(parsedDataResult.error.issues)
    return { error: parsedDataResult.error.issues[0].message }
  }

  const { userId, role } = parsedDataResult.data

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

    revalidateCache('members')
  } catch (e) {
    // DB 업데이트 오류
    console.error(e)
    return { error: 'DB Update Error' }
  }

  redirect('/admin/members/accept')
}

/**
 * `deleteUserAction` 함수는 전달받은 입력값을 바탕으로 필요한 비즈니스 로직을 수행합니다.
 *
 * 구동 원리:
 * 1. 입력값(없음)을 기준으로 전처리/검증 또는 조회 조건을 구성합니다.
 * 2. 함수 본문의 조건 분기와 동기/비동기 로직을 순서대로 실행합니다.
 * 3. 계산 결과를 반환하거나 캐시/DB/리다이렉트 등 필요한 부수 효과를 반영합니다.
 *
 * 작동 결과:
 * - 호출부에서 즉시 활용 가능한 결과값 또는 실행 상태를 제공합니다.
 * - 후속 로직이 안정적으로 이어질 수 있도록 일관된 동작을 보장합니다.
 */
export async function deleteUserAction(
  prev: { error: string },
  formData: FormData
) {
  const session = await auth()
  if (!(await handlePermission(session?.user?.id, 'put', 'membersRole'))) {
    return forbidden()
  }
  const { userId } = getDeleteMemberFormData(formData)

  const parsedDataResult = deleteMemberValidation.safeParse({ userId })

  if (!parsedDataResult.success) {
    console.log(parsedDataResult.error.issues)
    return { error: parsedDataResult.error.issues[0].message }
  }

  try {
    await db.delete(users).where(eq(users.id, parsedDataResult.data.userId))

    revalidateCache('members')
  } catch (e) {
    // DB 업데이트 오류
    console.error(e)
    return { error: 'DB Update Error' }
  }

  redirect('/admin/members/accept')
}
