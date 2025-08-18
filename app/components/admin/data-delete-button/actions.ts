'use server'

import { auth } from '@/auth'
import handlePermission, {
  ResourceType,
} from '@/lib/server/permission/handle-permission'
import { forbidden, redirect } from 'next/navigation'
import db from '@/db'
import { projects } from '@/db/schema/projects'
import { eq } from 'drizzle-orm'
import { sessions } from '@/db/schema/sessions'
import { generations } from '@/db/schema/generations'
import { parts } from '@/db/schema/parts'
import { revalidateTag } from 'next/cache'
import deleteR2Images from '@/lib/server/delete-r2-images'

export default async function dataDeleteAction(
  prev: { error: string },
  formData: FormData
) {
  const session = await auth()
  const dataType = formData.get('dataType') as ResourceType
  const dataId = formData.get('dataId') as string | null

  // 삭제할 데이터 id 확인
  if (!dataId) {
    return { error: 'Data ID not found' }
  }

  // 데이터를 삭제할 권한이 있는지 확인
  const canDelete = await handlePermission(
    session?.user?.id,
    'delete',
    dataType
  )

  if (!canDelete) {
    forbidden()
  }

  try {
    // 데이터 삭제
    switch (dataType) {
      case 'sessions':
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
          ...sessionImageList.images.map((image) =>
            image.replace(process.env.NEXT_PUBLIC_IMAGE_URL!, '')
          ),
          sessionImageList.mainImage.replace(
            process.env.NEXT_PUBLIC_IMAGE_URL!,
            ''
          ),
        ]

        if (!(await deleteR2Images(sessionImageKeys))) {
          return { error: 'R2 Image Delete Error' }
        }
        await db.delete(sessions).where(eq(sessions.id, dataId))
        revalidateTag('sessions')
        break
      case 'projects':
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
          ...projectImageList.images.map((image) =>
            image.replace(process.env.NEXT_PUBLIC_IMAGE_URL!, '')
          ),
          projectImageList.mainImage.replace(
            process.env.NEXT_PUBLIC_IMAGE_URL!,
            ''
          ),
        ]

        if (!(await deleteR2Images(projectImageKeys))) {
          return { error: 'R2 Image Delete Error' }
        }

        await db.delete(projects).where(eq(projects.id, dataId))
        revalidateTag('projects')
        break
      case 'generations':
        await db.delete(generations).where(eq(generations.id, Number(dataId)))
        revalidateTag('generations')
        revalidateTag('parts')
        revalidateTag('members')
        break
      case 'parts':
        await db.delete(parts).where(eq(parts.id, Number(dataId)))
        revalidateTag('parts')
        revalidateTag('members')
        break
      default:
        return { error: 'Data type not found' }
    }
  } catch (err) {
    console.error(err)
    return { error: 'DB Delete Error' }
  }

  redirect('/admin/' + dataType)
}
