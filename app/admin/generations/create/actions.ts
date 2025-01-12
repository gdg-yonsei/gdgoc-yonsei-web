'use server'

import { auth } from '@/auth'
import handlePermission from '@/lib/admin/handle-permission'
import { generationValidation } from '@/lib/validations/generation'
import db from '@/db'
import { generations } from '@/db/schema/generations'
import { forbidden, redirect } from 'next/navigation'
import { z } from 'zod'
import { revalidateTag } from 'next/cache'

export async function createGenerationAction(
  prev: { error: string },
  formData: FormData
) {
  const session = await auth()

  if (!(await handlePermission(session?.user?.id, 'post', 'generations'))) {
    return forbidden()
  }

  const name = formData.get('name') as string
  const startDate = formData.get('startDate') as string
  const endDate = formData.get('endDate') as string | null

  try {
    generationValidation.parse({ name, startDate, endDate })
  } catch (err) {
    if (err instanceof z.ZodError) {
      console.log(err.issues)
      return { error: err.issues[0].message }
    }
  }

  try {
    await db
      .insert(generations)
      .values({
        name,
        startDate,
        endDate,
      })
      .returning({
        id: generations.id,
      })

    revalidateTag('generations')
    revalidateTag('parts')
  } catch (e) {
    console.error(e)
    return { error: 'DB Update Error' }
  }

  redirect(`/admin/generations`)
}
