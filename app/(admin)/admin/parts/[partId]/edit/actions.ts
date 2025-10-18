'use server'

import db from '@/db'
import { forbidden, redirect } from 'next/navigation'
import { eq } from 'drizzle-orm'
import handlePermission from '@/lib/server/permission/handle-permission'
import { auth } from '@/auth'
import { z } from 'zod'
import { parts } from '@/db/schema/parts'
import { usersToParts } from '@/db/schema/users-to-parts'
import { partValidation } from '@/lib/validations/part'
import getPartFormData from '@/lib/server/form-data/get-part-form-data'
import { revalidateCache } from '@/lib/server/cache'

/**
 * Update Part Action
 * @param partId - part id
 * @param prevState - previous state for form error
 * @param formData - part data
 */
export async function updatePartAction(
  partId: string,
  prevState: { error: string },
  formData: FormData
) {
  // 사용자가 part 를 수정할 권한이 있는지 확인
  const session = await auth()
  if (!(await handlePermission(session?.user?.id, 'put', 'parts', partId))) {
    return forbidden()
  }

  // form data 에서 part data 추출
  const {
    name,
    description,
    generationId,
    membersList,
    doubleBoardMembersList,
  } = getPartFormData(formData)

  try {
    // zod validation
    partValidation.parse({
      name,
      description,
      generationId,
      membersList,
      doubleBoardMembersList,
    })
  } catch (err) {
    // zod validation 에러 처리
    if (err instanceof z.ZodError) {
      console.log(err.issues)
      return { error: err.issues[0].message }
    }
  }

  try {
    const partIdNumber = Number(partId)
    // part 정보 업데이트 쿼리
    await db
      .update(parts)
      .set({
        name: name!,
        description: description,
        generationsId: generationId,
        updatedAt: new Date(),
      })
      .where(eq(parts.id, partIdNumber))
    // 파트에 연결된 모든 멤버 정보 삭제
    await db.delete(usersToParts).where(eq(usersToParts.partId, partIdNumber))

    const userToPartData: {
      userId: string
      partId: number
      userType: 'Core' | 'Primary' | 'Secondary'
    }[] = []

    for (const member of membersList) {
      userToPartData.push({
        userId: member,
        partId: partIdNumber,
        userType: 'Primary',
      })
    }

    for (const doubleMember of doubleBoardMembersList) {
      userToPartData.push({
        userId: doubleMember,
        partId: partIdNumber,
        userType: 'Secondary',
      })
    }

    // 파트에 멤버 정보 새로 추가
    if (membersList.length > 0) {
      await db.insert(usersToParts).values(userToPartData)
    }

    // 캐시 업데이트
    revalidateCache(['parts', 'members'])
  } catch (e) {
    // DB 업데이트 오류 처리
    console.error(e)
    return { error: 'DB Update Error' }
  }

  redirect(`/admin/parts/${partId}`)
}
