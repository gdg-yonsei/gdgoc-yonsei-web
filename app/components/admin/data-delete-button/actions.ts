'use server'

import { redirect } from 'next/navigation'
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
import { requirePermission } from '@/lib/server/permission/require-permission'

export default async function deleteResourceAction(
  prev: { error: string },
  formData: FormData
) {
  void prev

  const validationResult = deleteResourceValidation.safeParse({
    dataType: formData.get('dataType'),
    dataId: formData.get('dataId'),
  })

  if (!validationResult.success) {
    return {
      error: validationResult.error.issues[0]?.message ?? 'Validation failed',
    }
  }

  const { dataType, dataId } = validationResult.data

  // 삭제 대상 종류는 검증을 통과한 뒤에야 정해지므로 여기서 권한을 확인한다.
  await requirePermission('delete', dataType)

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
