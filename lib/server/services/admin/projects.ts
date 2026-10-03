/**
 * 프로젝트 관리 서비스(목록, 상세, 생성, 수정, 삭제).
 *
 * 서비스 함수는 웹 Server Action과 MCP 도구가 함께 쓴다. 모두 같은 순서로 동작한다:
 * 권한 확인(`authorize`, 기수 접근) → 입력 검증(zod) → DB 쓰기 → 공개 캐시 무효화.
 * 결과는 예외 대신 `ServiceResult`(성공 `ok` / 실패 `fail`)로 돌려준다.
 */
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
import { deleteImages, deleteRemovedImages } from '@/lib/server/storage/r2'
import { invalidateProjectPublicCache } from '@/lib/server/cache'
import { getProject } from '@/lib/server/fetcher/admin/get-project'
import {
  getProjects,
  type AdminProjectListItem,
} from '@/lib/server/fetcher/admin/get-projects'
import { uniqueStrings } from '@/lib/server/cache/utils'
import { logger } from '@/lib/server/logger'
import { withDbErrors } from '@/lib/server/services/admin/db-errors'
import { isUuid } from '@/lib/server/queries/public/uuid'
import { normalizeR2ImageObjectKey } from '@/lib/server/storage/object-key'
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

/** 프로젝트 입력(검증 전) 타입. */
export type ProjectInput = z.input<typeof projectValidation>

const NOT_FOUND = 'Project not found'

function parseProjectInput(input: unknown) {
  const parsed = projectValidation.safeParse(input)
  return parsed.success ? ok(parsed.data) : fromZodError(parsed.error)
}

/** 범위(기수)의 프로젝트 목록. */
export async function listProjects(
  actor: Actor,
  { generation }: { generation?: number | 'all' } = {}
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

/** 프로젝트 상세(참가자, 태그, 기수). */
export type ProjectDetail = NonNullable<
  Awaited<ReturnType<typeof loadProjectDetail>>
>

/** 프로젝트 상세. */
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
    participants: detail.participants.map((participant) => participant.id) as [
      string,
      ...string[],
    ],
    generationId: String(detail.generationId),
    repoUrl: detail.repoUrl,
    demoUrl: detail.demoUrl,
    tags: detail.tags,
  }
}

/** 프로젝트와 참가자·태그를 한 트랜잭션으로 만든다. 선택한 기수에 접근할 수 있어야 한다. */
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

/**
 * 프로젝트를 고친다. 작성자는 기수와 무관하게 자기 프로젝트를 고칠 수 있다.
 * DB를 커밋한 뒤 더는 쓰지 않는 이미지를 R2에서 지운다.
 */
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

      // 프로젝트 행과 참가자·태그 관계는 하나의 트랜잭션으로 바꾼다.
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

/**
 * 프로젝트를 지운다. 행을 먼저 지우고 커밋 뒤에 R2 이미지를 지운다. R2가 실패하면 고아 객체가 남지만,
 * 이미지가 먼저 지워져 "행은 남았는데 이미지가 없는" 상태가 되는 것보다 낫다.
 */
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
      invalidateProjectPublicCache({
        projectId,
        previousGenerationName: projectCacheContext.generationName,
      })

      // R2는 트랜잭션에 묶을 수 없다. 행을 먼저 지우고 이미지는 커밋 뒤에 지운다. R2 삭제가 실패해도
      // 쓰지 않는 객체가 남을 뿐이므로 삭제는 성공으로 처리하고, 남은 키를 로그로 남겨 손으로 치울 수 있게 한다.
      const projectImageKeys = uniqueStrings([
        ...projectImageList.images
          .map((image) => normalizeR2ImageObjectKey(image, 'projects'))
          .filter(Boolean),
        normalizeR2ImageObjectKey(projectImageList.mainImage, 'projects'),
      ])
      if (!(await deleteImages(projectImageKeys))) {
        logger.warn(
          'admin.delete-resource.r2-cleanup',
          'Row deleted but its images could not be removed from R2',
          {
            dataType: 'projects',
            dataId: projectId,
            imageKeys: projectImageKeys,
          }
        )
      }

      return ok({ id: projectId })
    },
    { dataType: 'projects', dataId: projectId },
    'DB Delete Error'
  )
}
