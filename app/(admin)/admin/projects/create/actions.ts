'use server'

import { redirect } from 'next/navigation'
import getProjectFormData from '@/lib/server/form-data/get-project-form-data'
import { projectValidation } from '@/lib/validations/project'
import db from '@/db'
import { projects } from '@/db/schema/projects'
import { usersToProjects } from '@/db/schema/users-to-projects'
import { getLocalizedAdminPath } from '@/lib/admin-i18n/server'
import { invalidateProjectPublicCache } from '@/lib/server/cache'
import { logger } from '@/lib/server/logger'
import { getGenerationNameById } from '@/lib/server/services/cache-context'
import { resolveAdminGenerationScope } from '@/lib/server/admin-generation-scope'
import {
  authorizeAdminAction,
  getZodActionError,
  insertRowsIfAny,
  stripHtmlCharacters,
} from '@/lib/server/actions/admin'

export async function createProjectAction(
  _prev: { error: string },
  formData: FormData
) {
  const authorization = await authorizeAdminAction({
    action: 'post',
    resource: 'projects',
  })

  if (!authorization.ok) {
    return authorization.response
  }

  const { session } = authorization
  if (!session?.user?.id) {
    return { error: 'User not found' }
  }

  const {
    name,
    nameKo,
    description,
    descriptionKo,
    content,
    contentKo,
    mainImage,
    contentImages,
    participants,
    generationId,
  } = getProjectFormData(formData)

  const resolvedScope = await resolveAdminGenerationScope(session.user.id)
  if (
    resolvedScope.scope?.kind !== 'generation' ||
    resolvedScope.scope.generationId !== Number(generationId)
  ) {
    return { error: 'Select a specific generation scope before creating data.' }
  }

  try {
    projectValidation.parse({
      name,
      nameKo,
      description,
      descriptionKo,
      content,
      contentKo,
      mainImage,
      contentImages,
      participants,
      generationId,
    })
  } catch (err) {
    const validationError = getZodActionError(err, 'Validation failed')
    if (validationError) {
      return { error: validationError }
    }
  }

  try {
    if (!name || !description) {
      return { error: 'Name and Description are required' }
    }

    const nextGeneration = await getGenerationNameById(Number(generationId))

    const createProject = (
      await db
        .insert(projects)
        .values({
          name: name,
          nameKo: nameKo!,
          description: description!,
          descriptionKo: descriptionKo!,
          authorId: session.user.id,
          generationId: Number(generationId),
          images: contentImages,
          mainImage: mainImage!,
          content: stripHtmlCharacters(content),
          contentKo: stripHtmlCharacters(contentKo),
        })
        .returning({ id: projects.id })
    )[0]

    if (!createProject) {
      return { error: 'Failed to create project' }
    }

    await insertRowsIfAny(
      participants.map((participant) => ({
        projectId: createProject.id,
        userId: participant,
      })),
      (rows) => db.insert(usersToProjects).values(rows)
    )

    invalidateProjectPublicCache({
      projectId: createProject.id,
      nextGenerationName: nextGeneration?.name,
    })
  } catch (e) {
    logger.error('admin.projects.create', e)
    return { error: 'DB Update Error' }
  }

  redirect(await getLocalizedAdminPath('/admin/projects'))
}
