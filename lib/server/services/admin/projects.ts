import 'server-only'

import { eq } from 'drizzle-orm'
import type { z } from 'zod'
import db from '@/db'
import { projects } from '@/db/schema/projects'
import { usersToProjects } from '@/db/schema/users-to-projects'
import {
  deleteRemovedR2Images,
  insertRowsIfAny,
  replaceRelationRows,
  stripHtmlCharacters,
} from '@/lib/server/actions/admin'
import { invalidateProjectPublicCache } from '@/lib/server/cache'
import deleteR2Images from '@/lib/server/delete-r2-images'
import { getProject } from '@/lib/server/fetcher/admin/get-project'
import {
  getProjects,
  type AdminProjectListItem,
} from '@/lib/server/fetcher/admin/get-projects'
import { logger } from '@/lib/server/logger'
import { isUuid } from '@/lib/server/queries/public/uuid'
import { normalizeR2ImageObjectKey } from '@/lib/server/r2-object-key'
import {
  authorize,
  canAccessGeneration,
} from '@/lib/server/services/admin/authorize'
import { resolveGenerationScope } from '@/lib/server/services/admin/generation-scope'
import {
  fail,
  fromZodError,
  ok,
  type Actor,
  type ServiceResult,
} from '@/lib/server/services/admin/types'
import {
  getGenerationNameById,
  getProjectCacheContext,
} from '@/lib/server/services/cache-context'
import { syncProjectTags } from '@/lib/server/services/project-tags'
import { projectValidation } from '@/lib/validations/project'

export type ProjectInput = z.input<typeof projectValidation>

const NOT_FOUND = 'Project not found'

function parseProjectInput(input: unknown) {
  const parsed = projectValidation.safeParse(input)
  return parsed.success ? ok(parsed.data) : fromZodError(parsed.error)
}

export async function listProjects(
  actor: Actor,
  { generation }: { generation?: number | 'all' } = {}
): Promise<ServiceResult<AdminProjectListItem[]>> {
  const authorization = authorize(actor, 'get', 'projectsPage')
  if (!authorization.ok) return authorization

  const scope = await resolveGenerationScope(actor, generation)
  if (!scope) return ok([])

  return ok(await getProjects(scope))
}

async function loadProjectDetail(projectId: string) {
  const project = await getProject(projectId)
  if (!project) return null

  const { usersToProjects: members, projectsToTags, generation, ...fields } =
    project
  return {
    ...fields,
    generationName: generation?.name ?? null,
    tags: projectsToTags.map((row) => row.tag.name),
    participants: members.map((row) => ({
      id: row.user.id,
      name: row.user.name,
      firstName: row.user.firstName,
      lastName: row.user.lastName,
      firstNameKo: row.user.firstNameKo,
      lastNameKo: row.user.lastNameKo,
      image: row.user.image,
    })),
  }
}

export type ProjectDetail = NonNullable<
  Awaited<ReturnType<typeof loadProjectDetail>>
>

export async function getProjectDetail(
  actor: Actor,
  projectId: string
): Promise<ServiceResult<ProjectDetail>> {
  const authorization = authorize(actor, 'get', 'projectsPage')
  if (!authorization.ok) return authorization

  const detail = await loadProjectDetail(projectId)
  return detail ? ok(detail) : fail('NOT_FOUND', NOT_FOUND)
}

/** 상세 조회 결과를 프로젝트 검증 스키마의 입력 형태로 되돌린다(부분 수정 병합용). */
export function projectToInput(detail: ProjectDetail): ProjectInput {
  return {
    name: detail.name,
    nameKo: detail.nameKo ?? '',
    description: detail.description,
    descriptionKo: detail.descriptionKo ?? '',
    content: detail.content,
    contentKo: detail.contentKo,
    mainImage: detail.mainImage,
    contentImages: detail.images as [string, ...string[]],
    participants: detail.participants.map(
      (participant) => participant.id
    ) as [string, ...string[]],
    generationId: String(detail.generationId),
    repoUrl: detail.repoUrl,
    demoUrl: detail.demoUrl,
    tags: detail.tags,
  }
}

export async function createProject(
  actor: Actor,
  input: unknown
): Promise<ServiceResult<{ id: string }>> {
  const authorization = authorize(actor, 'post', 'projects')
  if (!authorization.ok) return authorization

  const parsed = parseProjectInput(input)
  if (!parsed.ok) return parsed

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
    repoUrl,
    demoUrl,
    tags,
  } = parsed.data

  if (!(await canAccessGeneration(actor, Number(generationId)))) {
    return fail('FORBIDDEN', 'You cannot create projects in this generation.')
  }

  let projectId = ''
  try {
    const nextGeneration = await getGenerationNameById(Number(generationId))

    const createdProject = (
      await db
        .insert(projects)
        .values({
          name,
          nameKo,
          description,
          descriptionKo,
          authorId: actor.userId,
          generationId: Number(generationId),
          images: contentImages,
          mainImage,
          content: stripHtmlCharacters(content),
          contentKo: stripHtmlCharacters(contentKo),
          repoUrl,
          demoUrl,
        })
        .returning({ id: projects.id })
    )[0]

    if (!createdProject) {
      return fail('INTERNAL', 'Failed to create project')
    }

    await insertRowsIfAny(
      participants.map((participant) => ({
        projectId: createdProject.id,
        userId: participant,
      })),
      (rows) => db.insert(usersToProjects).values(rows)
    )
    await syncProjectTags(createdProject.id, tags)

    projectId = createdProject.id

    invalidateProjectPublicCache({
      projectId,
      nextGenerationName: nextGeneration?.name,
    })
  } catch (e) {
    logger.error('admin.projects.create', e)
    return fail('INTERNAL', 'DB Update Error')
  }

  return ok({ id: projectId })
}

export async function updateProject(
  actor: Actor,
  projectId: string,
  input: unknown
): Promise<ServiceResult<{ id: string }>> {
  if (!isUuid(projectId)) return fail('NOT_FOUND', NOT_FOUND)

  const existingProject = await db.query.projects.findFirst({
    where: eq(projects.id, projectId),
    columns: { authorId: true, generationId: true },
  })
  if (!existingProject) return fail('NOT_FOUND', NOT_FOUND)

  // dataOwnerId 는 프로젝트 행의 authorId 여야 한다 (projectId 가 아니라).
  const authorization = authorize(
    actor,
    'put',
    'projects',
    existingProject.authorId
  )
  if (!authorization.ok) return authorization

  if (
    existingProject.authorId !== actor.userId &&
    !(await canAccessGeneration(actor, existingProject.generationId))
  ) {
    return fail('FORBIDDEN', 'You cannot manage projects of this generation.')
  }

  const parsed = parseProjectInput(input)
  if (!parsed.ok) return parsed

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
    tags,
  } = parsed.data

  if (existingProject.generationId !== Number(generationId)) {
    return fail(
      'VALIDATION',
      'Project generation cannot be changed from this screen.'
    )
  }

  try {
    const previousProject = await getProjectCacheContext(projectId)

    const prevImages = (
      await db
        .select({ images: projects.images, mainImage: projects.mainImage })
        .from(projects)
        .where(eq(projects.id, projectId))
        .limit(1)
    )[0]

    if (!prevImages) {
      return fail('NOT_FOUND', NOT_FOUND)
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
        name,
        nameKo,
        description,
        descriptionKo,
        content: stripHtmlCharacters(content),
        contentKo: stripHtmlCharacters(contentKo),
        images: contentImages,
        mainImage,
        generationId: Number(generationId),
        repoUrl,
        demoUrl,
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
    await syncProjectTags(projectId, tags)

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
    return fail('INTERNAL', 'DB Update Error')
  }

  return ok({ id: projectId })
}

export async function deleteProject(
  actor: Actor,
  projectId: string
): Promise<ServiceResult<{ id: string }>> {
  const authorization = authorize(actor, 'delete', 'projects')
  if (!authorization.ok) return authorization
  if (!isUuid(projectId)) return fail('NOT_FOUND', 'Data not found')

  const projectImageList = await db.query.projects.findFirst({
    where: eq(projects.id, projectId),
    columns: {
      images: true,
      mainImage: true,
      generationId: true,
    },
  })

  if (!projectImageList) {
    return fail('NOT_FOUND', 'Data not found')
  }

  if (!(await canAccessGeneration(actor, projectImageList.generationId))) {
    return fail('FORBIDDEN', 'You cannot manage projects of this generation.')
  }

  try {
    const projectCacheContext = await getProjectCacheContext(projectId)
    const projectImageKeys = [
      ...projectImageList.images
        .map((image) => normalizeR2ImageObjectKey(image, 'projects'))
        .filter(Boolean),
      normalizeR2ImageObjectKey(projectImageList.mainImage, 'projects'),
    ].filter(Boolean) as string[]

    if (!(await deleteR2Images(projectImageKeys))) {
      return fail('INTERNAL', 'R2 Image Delete Error')
    }

    await db.delete(projects).where(eq(projects.id, projectId))
    invalidateProjectPublicCache({
      projectId,
      previousGenerationName: projectCacheContext.generationName,
    })
  } catch (err) {
    logger.error('admin.delete-resource', err, {
      dataType: 'projects',
      dataId: projectId,
    })
    return fail('INTERNAL', 'DB Delete Error')
  }

  return ok({ id: projectId })
}
