'use server'

import { revalidateTag } from 'next/cache'
import db from '@/db'
import { users } from '@/db/schema/users'
import { forbidden, redirect } from 'next/navigation'
import { eq } from 'drizzle-orm'
import handlePermission from '@/lib/admin/handle-permission'
import { auth } from '@/auth'
import { memberValidation } from '@/lib/validations/member'
import { z } from 'zod'
import getMemberFormData from '@/lib/admin/get-member-form-data'

/**
 * Update Member Action
 * @param memberId - member id
 * @param prev - previous state for form error
 * @param formData - member data
 */
export async function updateProfileAction(
  memberId: string,
  prev: { error: string },
  formData: FormData
) {
  // 사용자가 member 를 수정할 권한이 있는지 확인
  const session = await auth()
  if (
    !(await handlePermission(session?.user?.id, 'put', 'members', memberId))
  ) {
    return forbidden()
  }

  // form data 에서 member data 추출
  const {
    name,
    firstName,
    lastName,
    email,
    githubId,
    instagramId,
    linkedInId,
    major,
    studentId,
    telephone,
    isForeigner,
    profileImage,
  } = getMemberFormData(formData)

  try {
    // zod validation
    memberValidation.parse({
      name,
      firstName,
      lastName,
      email,
      githubId,
      instagramId,
      linkedInId,
      major,
      studentId,
      telephone,
      isForeigner,
      profileImage,
      role: null,
    })
  } catch (err) {
    // 데이터 형식이 맞지 않을 경우 오류 반환
    if (err instanceof z.ZodError) {
      console.log(err.issues)
      return { error: err.issues[0].message }
    }
  }
  // member data 업데이트 쿼리
  try {
    await db
      .update(users)
      .set({
        name,
        firstName,
        lastName,
        email,
        githubId,
        instagramId,
        linkedInId,
        major,
        studentId: studentId ? Number(studentId) : null,
        telephone: telephone?.replaceAll('-', '').replaceAll(' ', ''),
        isForeigner,
        image: profileImage,
      })
      .where(eq(users.id, memberId))

    // 캐시 업데이트
    revalidateTag('members')
  } catch (e) {
    // DB 업데이트 오류 발생 시 오류 반환
    console.error(e)
    return { error: 'DB Update Error' }
  }

  // 성공 시 해당 member 페이지로 이동
  redirect(`/admin/profile`)
}
