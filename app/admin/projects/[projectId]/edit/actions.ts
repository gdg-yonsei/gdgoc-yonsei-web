'use server'

import { auth } from '@/auth'
import handlePermission from '@/lib/admin/handle-permission'
import { forbidden, redirect } from 'next/navigation'
import getProjectFormData from '@/lib/admin/get-project-form-data'
import { projectValidation } from '@/lib/validations/project'
import { z } from 'zod'
import db from '@/db'
import { projects } from '@/db/schema/projects'
import { eq } from 'drizzle-orm'
import { revalidateTag } from 'next/cache'

/**
 * Update Project Action
 * @param projectId - project id
 * @param prevState - previous state for form error
 * @param formData - project data
 */
export async function updateProjectAction(
  projectId: string,
  prevState: { error: string },
  formData: FormData
) {
  const session = await auth()
  // 사용자가 project 를 수정할 권한이 있는지 확인
  if (
    !(await handlePermission(session?.user?.id, 'put', 'projects', projectId))
  ) {
    return forbidden()
  }

  // form data 에서 project data 추출
  const { name, description } = getProjectFormData(formData)

  try {
    // zod validation
    projectValidation.parse({ name, description })
  } catch (err) {
    // zod validation 에러 처리
    if (err instanceof z.ZodError) {
      console.log(err.issues)
      return { error: err.issues[0].message }
    }
  }

  try {
    // project 업데이트
    await db
      .update(projects)
      .set({
        name: name!,
        description: description!,
      })
      .where(eq(projects.id, projectId))

    // 캐시 업데이트
    revalidateTag('projects')
  } catch (e) {
    // DB 업데이트 오류 발생 시 오류 반환
    console.error(e)
    return { error: 'DB Update Error' }
  }
  // 성공 시 해당 project 로 이동
  redirect(`/admin/projects/${projectId}`)
}
