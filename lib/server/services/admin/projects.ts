import 'server-only'

import { eq } from 'drizzle-orm'
import type { z } from 'zod'
import { db } from '@/db'
import { projects } from '@/db/schema/projects'
import { usersToProjects } from '@/db/schema/users-to-projects'
import {
  insertRowsIfAny,
  replaceRelationRows,
  stripHtmlCharacters,
} from '@/lib/server/services/admin/shared'
import { deleteRemovedImages } from '@/lib/server/storage/r2'
import { invalidateProjectPublicCache } from '@/lib/server/cache'
import { getProject } from '@/lib/server/fetcher/admin/get-project'
import {
  getProjects,
  type AdminProjectListItem,
} from '@/lib/server/fetcher/admin/get-projects'
import { logger } from '@/lib/server/logger'
import { withDbErrors } from '@/lib/server/services/admin/db-errors'
import { isUuid } from '@/lib/server/queries/public/uuid'
import { cleanupDeletedResource } from '@/lib/server/services/admin/deleted-resource-cleanup'
import {
  authorize,
  canAccessGeneration,
} from '@/lib/server/services/admin/authorize'
import { resolveRequestedGenerationScope } from '@/lib/server/services/admin/generation-scope'
import { toPublicUser } from '@/lib/server/services/admin/public-user'
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
} from '@/lib/server/services/admin/cache-context'
import { syncProjectTags } from '@/lib/server/services/admin/project-tags'
import { projectValidation } from '@/lib/validations/project'

export type ProjectInput = z.input<typeof projectValidation>

const NOT_FOUND = 'Project not found'

function parseProjectInput(input: unknown) {
  const parsed = projectValidation.safeParse(input)
  return parsed.success ? ok(parsed.data) : fromZodError(parsed.error)
}

export async function listProjects(
  actor: Actor,
  { generation }: { generation?: number | 'all' | undefined } = {}
): Promise<ServiceResult<AdminProjectListItem[]>> {
  const authorization = authorize(actor, 'get', 'projectsPage')
  if (!authorization.ok) return authorization

  const resolved = await resolveRequestedGenerationScope(actor, generation)
  if (!resolved.ok) return resolved
  const scope = resolved.data
  if (!scope) return ok([])

  return ok(await getProjects(scope))
}

async function loadProjectDetail(projectId: string) {
  const project = await getProject(projectId)
  if (!project) return null

  const {
    usersToProjects: members,
    projectsToTags,
    generation,
    ...fields
  } = project
  return {
    ...fields,
    generationName: generation?.name ?? null,
    tags: projectsToTags.map((row) => row.tag.name),
    participants: members.map((row) => toPublicUser(row.user)),
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
    contentImages: detail.images,
    participants: detail.participants.map((participant) => participant.id),
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
  return withDbErrors('admin.projects.create', async () => {
    const nextGeneration = await getGenerationNameById(Number(generationId))

    // 프로젝트 행, 참가자, 태그는 함께 저장되거나 함께 실패해야 한다.
    const createdProject = await db.transaction(async (tx) => {
      const created = (
        await tx
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
      if (!created) return undefined

      await insertRowsIfAny(
        participants.map((participant) => ({
          projectId: created.id,
          userId: participant,
        })),
        (rows) => tx.insert(usersToProjects).values(rows)
      )
      await syncProjectTags(created.id, tags, tx)
      return created
    })

    if (!createdProject) {
      return fail('INTERNAL', 'Failed to create project')
    }

    projectId = createdProject.id

    invalidateProjectPublicCache({
      projectId,
      nextGenerationName: nextGeneration?.name,
    })

    return ok({ id: projectId })
  })
}

// 작성자는 기수와 무관하게 자기 프로젝트를 고친다. 커밋 뒤에 쓰지 않는 R2 이미지를 지운다.
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

  return withDbErrors(
    'admin.projects.update',
    async () => {
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

      await db.transaction(async (tx) => {
        await tx
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
            tx
              .delete(usersToProjects)
              .where(eq(usersToProjects.projectId, projectId)),
          rows: participants.map((user) => ({
            projectId,
            userId: user,
          })),
          insertRows: (rows) => tx.insert(usersToProjects).values(rows),
        })
        await syncProjectTags(projectId, tags, tx)
      })

      // R2는 트랜잭션에 묶을 수 없으므로 커밋이 끝난 뒤 지운다. 실패해도 쓰지 않는
      // 이미지가 남을 뿐이라 수정은 성공으로 처리한다.
      await deleteRemovedImages({
        previousImages: prevImages.images,
        nextImages: contentImages,
        previousMainImage: prevImages.mainImage,
        nextMainImage: mainImage,
        prefix: 'projects',
      }).catch((error: unknown) =>
        logger.error('admin.projects.update.r2-cleanup', error, { projectId })
      )

      const nextGeneration = await getGenerationNameById(Number(generationId))

      invalidateProjectPublicCache({
        projectId,
        previousGenerationName: previousProject.generationName,
        nextGenerationName: nextGeneration?.name,
      })

      return ok({ id: projectId })
    },
    {
      projectId,
    }
  )
}

// 행 삭제를 먼저 커밋해 R2 실패로 이미지 없는 행이 남지 않게 한다. R2 실패는 고아 객체를 남긴다.
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

  return withDbErrors(
    'admin.delete-resource',
    async () => {
      const projectCacheContext = await getProjectCacheContext(projectId)
      await db.delete(projects).where(eq(projects.id, projectId))
      await cleanupDeletedResource({
        dataType: 'projects',
        dataId: projectId,
        images: projectImageList.images,
        mainImage: projectImageList.mainImage,
        invalidateCache: () =>
          invalidateProjectPublicCache({
            projectId,
            previousGenerationName: projectCacheContext.generationName,
          }),
      })

      return ok({ id: projectId })
    },
    { dataType: 'projects', dataId: projectId },
    'DB Delete Error'
  )
}
