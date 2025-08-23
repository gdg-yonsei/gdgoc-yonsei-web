'use server'

import { auth } from '@/auth'
import handlePermission from '@/lib/server/permission/handle-permission'
import { forbidden, redirect } from 'next/navigation'
import getProjectFormData from '@/lib/server/form-data/get-project-form-data'
import { projectValidation } from '@/lib/validations/project'
import { z } from 'zod'
import db from '@/db'
import { projects } from '@/db/schema/projects'
import { eq } from 'drizzle-orm'
import r2Client from '@/lib/server/r2-client'
import { DeleteObjectCommand } from '@aws-sdk/client-s3'
import { usersToProjects } from '@/db/schema/users-to-projects'
import { revalidateCache } from '@/lib/server/cache'

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
  const {
    name,
    nameKo,
    description,
    descriptionKo,
    content,
    contentKo,
    contentImages,
    mainImage,
    participants,
    generationId,
  } = getProjectFormData(formData)

  try {
    // zod validation
    projectValidation.parse({
      name,
      nameKo,
      description,
      descriptionKo,
      content,
      contentKo,
      contentImages,
      mainImage,
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
    // 삭제된 이미지 R2에서 삭제
    const prevImages = (
      await db
        .select({ images: projects.images, mainImage: projects.mainImage })
        .from(projects)
        .where(eq(projects.id, projectId))
        .limit(1)
    )[0]

    const toDeleteImages = prevImages.images.filter(
      (prevImage) => !contentImages.includes(prevImage)
    )
    const deleteImagePromises = []

    if (prevImages.mainImage !== mainImage) {
      toDeleteImages.push(prevImages.mainImage)
    }

    for (const imageUrl of toDeleteImages) {
      deleteImagePromises.push(
        r2Client.send(
          new DeleteObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME,
            Key: imageUrl.replace(process.env.NEXT_PUBLIC_IMAGE_URL!, ''),
          })
        )
      )
    }

    await Promise.all(deleteImagePromises)

    // project 업데이트
    await db
      .update(projects)
      .set({
        name: name!,
        nameKo: nameKo!,
        description: description!,
        descriptionKo: descriptionKo!,
        content: content!,
        contentKo: contentKo!,
        images: contentImages,
        mainImage: mainImage!,
        generationId: Number(generationId),
        updatedAt: new Date(),
      })
      .where(eq(projects.id, projectId))

    // project 참여자 업데이트
    // 기존 참여자 삭제
    await db
      .delete(usersToProjects)
      .where(eq(usersToProjects.projectId, projectId))

    // 새로운 참여자 추가
    await db
      .insert(usersToProjects)
      .values(
        participants.map((user) => ({ projectId: projectId, userId: user }))
      )

    // 캐시 업데이트
    revalidateCache('projects')
  } catch (e) {
    // DB 업데이트 오류 발생 시 오류 반환
    console.error(e)
    return { error: 'DB Update Error' }
  }
  // 성공 시 해당 project 로 이동
  redirect(`/admin/projects/${projectId}`)
}
