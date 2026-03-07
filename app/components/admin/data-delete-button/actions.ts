'use server'

import { auth } from '@/auth'
import handlePermission from '@/lib/server/permission/handle-permission'
import { forbidden, redirect } from 'next/navigation'
import db from '@/db'
import { projects } from '@/db/schema/projects'
import { eq } from 'drizzle-orm'
import { sessions } from '@/db/schema/sessions'
import { generations } from '@/db/schema/generations'
import { parts } from '@/db/schema/parts'
import deleteR2Images from '@/lib/server/delete-r2-images'
import { deleteResourceValidation } from '@/lib/validations/admin-api'
import { getLocalizedAdminPath } from '@/lib/admin-i18n/server'
import {
  invalidateGenerationPublicCache,
  invalidatePartPublicCache,
  invalidateProjectPublicCache,
  invalidateSessionPublicCache,
} from '@/lib/server/cache'
import { logger } from '@/lib/server/logger'
import {
  getProjectCacheContext,
  getSessionCacheContext,
  getGenerationNameForPartId,
} from '@/lib/server/services/cache-context'
import { normalizeR2ImageObjectKey } from '@/lib/server/r2-object-key'

/**
 * `deleteResourceAction` 함수는 전달받은 입력값을 바탕으로 필요한 비즈니스 로직을 수행합니다.
 *
 * 구동 원리:
 * 1. 입력값(없음)을 기준으로 전처리/검증 또는 조회 조건을 구성합니다.
 * 2. 함수 본문의 조건 분기와 동기/비동기 로직을 순서대로 실행합니다.
 * 3. 계산 결과를 반환하거나 캐시/DB/리다이렉트 등 필요한 부수 효과를 반영합니다.
 *
 * 작동 결과:
 * - 호출부에서 즉시 활용 가능한 결과값 또는 실행 상태를 제공합니다.
 * - 후속 로직이 안정적으로 이어질 수 있도록 일관된 동작을 보장합니다.
 */
export default async function deleteResourceAction(
  prev: { error: string },
  formData: FormData
) {
  void prev
  const session = await auth()

  const validationResult = deleteResourceValidation.safeParse({
    dataType: formData.get('dataType'),
    dataId: formData.get('dataId'),
  })

  if (!validationResult.success) {
    return { error: validationResult.error.issues[0].message }
  }

  const { dataType, dataId } = validationResult.data

  // 데이터를 삭제할 권한이 있는지 확인
  const canDelete = await handlePermission(
    session?.user?.id,
    'delete',
    dataType
  )

  if (!canDelete) {
    return forbidden()
  }

  try {
    // 데이터 삭제
    switch (dataType) {
      case 'sessions': {
        const sessionCacheContext = await getSessionCacheContext(dataId)
        const sessionImageList = await db.query.sessions.findFirst({
          where: eq(sessions.id, dataId),
          columns: {
            images: true,
            mainImage: true,
          },
        })

        if (!sessionImageList) {
          return { error: 'Data not found' }
        }

        const sessionImageKeys = [
          ...sessionImageList.images
            .map((image) => normalizeR2ImageObjectKey(image, 'sessions'))
            .filter(Boolean),
          normalizeR2ImageObjectKey(sessionImageList.mainImage, 'sessions'),
        ].filter(Boolean) as string[]

        if (!(await deleteR2Images(sessionImageKeys))) {
          return { error: 'R2 Image Delete Error' }
        }
        await db.delete(sessions).where(eq(sessions.id, dataId))
        invalidateSessionPublicCache({
          sessionId: dataId,
          previousGenerationName: sessionCacheContext.generationName,
        })
        break
      }
      case 'projects': {
        const projectCacheContext = await getProjectCacheContext(dataId)
        const projectImageList = await db.query.projects.findFirst({
          where: eq(projects.id, dataId),
          columns: {
            images: true,
            mainImage: true,
          },
        })

        if (!projectImageList) {
          return { error: 'Data not found' }
        }

        const projectImageKeys = [
          ...projectImageList.images
            .map((image) => normalizeR2ImageObjectKey(image, 'projects'))
            .filter(Boolean),
          normalizeR2ImageObjectKey(projectImageList.mainImage, 'projects'),
        ].filter(Boolean) as string[]

        if (!(await deleteR2Images(projectImageKeys))) {
          return { error: 'R2 Image Delete Error' }
        }

        await db.delete(projects).where(eq(projects.id, dataId))
        invalidateProjectPublicCache({
          projectId: dataId,
          previousGenerationName: projectCacheContext.generationName,
        })
        break
      }
      case 'generations': {
        const previousGeneration = await db.query.generations.findFirst({
          where: eq(generations.id, Number(dataId)),
          columns: {
            name: true,
          },
        })

        await db.delete(generations).where(eq(generations.id, Number(dataId)))
        invalidateGenerationPublicCache({
          previousGenerationName: previousGeneration?.name,
        })
        break
      }
      case 'parts': {
        const previousPartGenerationName = await getGenerationNameForPartId(
          Number(dataId)
        )

        await db.delete(parts).where(eq(parts.id, Number(dataId)))
        invalidatePartPublicCache(
          previousPartGenerationName ? [previousPartGenerationName] : []
        )
        break
      }
      default:
        return { error: 'Data type not found' }
    }
  } catch (err) {
    logger.error('admin.delete-resource', err, {
      dataType,
      dataId,
    })
    return { error: 'DB Delete Error' }
  }

  redirect(await getLocalizedAdminPath('/admin/' + dataType))
}
