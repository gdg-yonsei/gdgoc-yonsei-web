'use server'

import { revalidateTag } from 'next/cache'
import db from '@/db'
import { forbidden, redirect } from 'next/navigation'
import { eq } from 'drizzle-orm'
import handlePermission from '@/lib/admin/handle-permission'
import { auth } from '@/auth'
import { z } from 'zod'
import { parts } from '@/db/schema/parts'
import { usersToParts } from '@/db/schema/users-to-parts'

const partValidation = z.object({
  name: z.string({ message: 'Name is required' }).nonempty('Name is required'),
  description: z.string().nullable(),
  generationId: z
    .number({ message: 'Invalid Generation' })
    .gte(1, { message: 'Invalid Generation' }),
  membersList: z.array(z.string()),
})

export async function updatePartAction(
  partId: string,
  prevState: { error: string },
  formData: FormData
) {
  const session = await auth()
  if (!(await handlePermission(session?.user?.id, 'put', 'parts', partId))) {
    return forbidden()
  }

  const name = formData.get('name') as string | null
  const description = formData.get('description') as string | null
  const generationId = Number(formData.get('generationId') as string | null)
  const membersList = JSON.parse(
    formData.get('membersList') as string
  ) as string[]

  try {
    partValidation.parse({ name, description, generationId, membersList })
  } catch (err) {
    if (err instanceof z.ZodError) {
      console.log(err.issues)
      return { error: err.issues[0].message }
    }
  }

  try {
    await db
      .update(parts)
      .set({
        name: name!,
        description: description,
        generationsId: generationId,
      })
      .where(eq(parts.id, Number(partId)))
    await db.delete(usersToParts).where(eq(usersToParts.partId, Number(partId)))
    if (membersList.length > 0) {
      await db.insert(usersToParts).values(
        membersList.map((memberId) => ({
          userId: memberId,
          partId: Number(partId),
        }))
      )
    }

    revalidateTag('parts')
  } catch (e) {
    console.error(e)
    return { error: 'DB Update Error' }
  }

  redirect(`/admin/parts/${partId}`)
}
