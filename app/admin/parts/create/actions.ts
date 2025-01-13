'use server'

import { auth } from '@/auth'
import handlePermission from '@/lib/admin/handle-permission'
import db from '@/db'
import { parts } from '@/db/schema/parts'
import { forbidden, redirect } from 'next/navigation'
import { z } from 'zod'
import { revalidateTag } from 'next/cache'
import { usersToParts } from '@/db/schema/users-to-parts'
import { partValidation } from '@/lib/validations/part'

export async function createPartAction(
  prev: { error: string },
  formData: FormData
) {
  const session = await auth()
  if (!(await handlePermission(session?.user?.id, 'put', 'parts'))) {
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
    const createPart = await db
      .insert(parts)
      .values({
        name: name!,
        description: description,
        generationsId: generationId,
      })
      .returning({ id: parts.id })

    if (membersList.length > 0) {
      await db.insert(usersToParts).values(
        membersList.map((memberId) => ({
          userId: memberId,
          partId: createPart[0].id,
        }))
      )
    }

    revalidateTag('parts')
    revalidateTag('members')
  } catch (e) {
    console.error(e)
    return { error: 'DB Update Error' }
  }

  redirect(`/admin/parts`)
}
