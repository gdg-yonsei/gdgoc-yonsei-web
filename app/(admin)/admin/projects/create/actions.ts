'use server'

import { auth } from '@/auth'
import handlePermission from '@/lib/admin/handle-permission'
import { forbidden, redirect } from 'next/navigation'
import { z } from 'zod'
import { revalidateTag } from 'next/cache'
import getProjectFormData from '@/lib/admin/get-project-form-data'
import { projectValidation } from '@/lib/validations/project'
import db from '@/db'
import { projects } from '@/db/schema/projects'
import { usersToProjects } from '@/db/schema/users-to-projects'
/**
 * Create Project Action
 * @param prev - previous state for form error
 * @param formData - project data
 */
export async function createProjectAction(
  prev: { error: string },
  formData: FormData
) {
  const session = await auth()
  // 사용자가 프로젝트를 수정할 권한이 있는지 확인
  if (!(await handlePermission(session?.user?.id, 'post', 'projects'))) {
    return forbidden()
  }

  if (!session?.user?.id) {
    return { error: 'User not found' }
  }

  // form data 에서 프로젝트 데이터를 추출
  const {
    name,
    description,
    content,
    mainImage,
    contentImages,
    participants,
    generationId,
  } = getProjectFormData(formData)

  try {
    // zod validation
    projectValidation.parse({
      name,
      description,
      content,
      mainImage,
      contentImages,
      participants,
      generationId,
    })
  } catch (err) {
    // zod validation 에러 처리
    if (err instanceof z.ZodError) {
      console.log(err.issues)
      return { error: err.issues[0].message }
    }
  }

  try {
    if (!name || !description) {
      return { error: 'Name and Description are required' }
    }
    // 프로젝트 생성 쿼리
    const createProject = (
      await db
        .insert(projects)
        .values({
          name: name,
          description: description!,
          authorId: session.user.id,
          generationId: Number(generationId),
          images: contentImages,
          mainImage: mainImage!,
          content: content!,
        })
        .returning({ id: projects.id })
    )[0]

    if (participants.length > 0) {
      await db.insert(usersToProjects).values(
        participants.map((participant) => ({
          projectId: createProject.id,
          userId: participant,
        }))
      )
    }

    // 캐시 업데이트
    revalidateTag('projects')
  } catch (e) {
    // DB 에러 처리
    console.error(e)
    return { error: 'DB Update Error' }
  }

  redirect(`/admin/projects`)
}
