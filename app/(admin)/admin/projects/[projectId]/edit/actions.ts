'use server'

import { redirect } from 'next/navigation'
import getProjectFormData from '@/lib/server/form-data/get-project-form-data'
import { projectValidation } from '@/lib/validations/project'
import db from '@/db'
import { projects } from '@/db/schema/projects'
import { eq } from 'drizzle-orm'
import { usersToProjects } from '@/db/schema/users-to-projects'
import { getLocalizedAdminPath } from '@/lib/admin-i18n/server'
import { invalidateProjectPublicCache } from '@/lib/server/cache'
import { logger } from '@/lib/server/logger'
import {
  getGenerationNameById,
  getProjectCacheContext,
} from '@/lib/server/services/cache-context'
import {
  authorizeAdminAction,
  deleteRemovedR2Images,
  getZodActionError,
  replaceRelationRows,
  stripHtmlCharacters,
} from '@/lib/server/actions/admin'

export async function updateProjectAction(
  projectId: string,
  _prevState: { error: string },
  formData: FormData
) {
  const authorization = await authorizeAdminAction({
    action: 'put',
    resource: 'projects',
    dataOwnerId: projectId,
  })

  if (!authorization.ok) {
    return authorization.response
  }

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
    repoUrl,
    demoUrl,
  } = getProjectFormData(formData)

  try {
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
      repoUrl,
      demoUrl,
    })
  } catch (err) {
    const validationError = getZodActionError(err)
    if (validationError) {
      return { error: validationError }
    }
  }

  try {
    const [previousProject, existingProject] = await Promise.all([
      getProjectCacheContext(projectId),
      db.query.projects.findFirst({
        where: eq(projects.id, projectId),
        columns: {
          generationId: true,
        },
      }),
    ])

    if (
      !existingProject ||
      existingProject.generationId !== Number(generationId)
    ) {
      return { error: 'Project generation cannot be changed from this screen.' }
    }

    const prevImages = (
      await db
        .select({ images: projects.images, mainImage: projects.mainImage })
        .from(projects)
        .where(eq(projects.id, projectId))
        .limit(1)
    )[0]

    if (!prevImages) {
      return { error: 'Project not found' }
    }

    await deleteRemovedR2Images({
      previousImages: prevImages.images,
      nextImages: contentImages,
      previousMainImage: prevImages.mainImage,
      nextMainImage: mainImage,
      prefix: 'projects',
    })

    await db
      .update(projects)
      .set({
        name: name!,
        nameKo: nameKo!,
        description: description!,
        descriptionKo: descriptionKo!,
        content: stripHtmlCharacters(content),
        contentKo: stripHtmlCharacters(contentKo),
        images: contentImages,
        mainImage: mainImage!,
        generationId: Number(generationId),
        repoUrl: repoUrl,
        demoUrl: demoUrl,
        updatedAt: new Date(),
      })
      .where(eq(projects.id, projectId))

    await replaceRelationRows({
      deleteRows: () =>
        db
          .delete(usersToProjects)
          .where(eq(usersToProjects.projectId, projectId)),
      rows: participants.map((user) => ({
        projectId,
        userId: user,
      })),
      insertRows: (rows) => db.insert(usersToProjects).values(rows),
    })

    const nextGeneration = await getGenerationNameById(Number(generationId))

    invalidateProjectPublicCache({
      projectId,
      previousGenerationName: previousProject.generationName,
      nextGenerationName: nextGeneration?.name,
    })
  } catch (e) {
    logger.error('admin.projects.update', e, {
      projectId,
    })
    return { error: 'DB Update Error' }
  }

  redirect(await getLocalizedAdminPath(`/admin/projects/${projectId}`))
}
