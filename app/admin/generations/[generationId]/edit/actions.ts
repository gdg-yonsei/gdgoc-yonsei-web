'use server'

import { revalidateTag } from 'next/cache'
import db from '@/db'
import { forbidden, redirect } from 'next/navigation'
import { eq } from 'drizzle-orm'
import handlePermission from '@/lib/admin/handle-permission'
import { auth } from '@/auth'
import { generations } from '@/db/schema/generations'
import { generationValidation } from '@/lib/validations/generation'
import { z } from 'zod'

export async function updateGenerationAction(
  generationId: string,
  prevState: { error: string },
  formData: FormData
) {
  const session = await auth()
  if (
    !(await handlePermission(
      session?.user?.id,
      'put',
      'generations',
      generationId
    ))
  ) {
    return forbidden()
  }

  const name = formData.get('name') as string | null
  const startDate = formData.get('startDate') as string | null
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
      .update(generations)
      .set({
        name: name!,
        startDate: startDate!,
        endDate: endDate ? endDate : null,
      })
      .where(eq(generations.id, Number(generationId)))

    revalidateTag('generations')
    revalidateTag('parts')
  } catch (e) {
    console.error(e)
    return { error: 'DB Update Error' }
  }

  redirect(`/admin/generations/${generationId}`)
}
