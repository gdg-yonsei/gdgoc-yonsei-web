'use server'

import { revalidateTag } from 'next/cache'
import db from '@/db'
import { users } from '@/db/schema/users'
import { redirect } from 'next/navigation'
import { eq } from 'drizzle-orm'
import handlePermission from '@/lib/admin/handle-permission'
import { auth } from '@/auth'

export async function updateMemberAction(memberId: string, formData: FormData) {
  const session = await auth()
  if (
    !(await handlePermission(session?.user?.id, 'put', 'members', memberId))
  ) {
    return
  }

  const name = formData.get('name') as string | null
  const firstName = formData.get('firstName') as string | null
  const lastName = formData.get('lastName') as string | null
  const email = formData.get('email') as string | null
  const githubId = formData.get('githubId') as string | null
  const instagramId = formData.get('instagramId') as string | null
  const linkedInId = formData.get('linkedinId') as string | null
  const major = formData.get('major') as string | null
  const studentId = formData.get('studentId') as string | null
  const telephone = formData.get('telephone') as string | null

  await db
    .update(users)
    .set({
      name,
      firstName,
      lastName,
      email,
      githubId,
      instagramId,
      linkedInId,
      major,
      studentId: studentId ? Number(studentId) : null,
      telephone,
    })
    .where(eq(users.id, memberId))

  revalidateTag('members')
  redirect(`/admin/members/${memberId}`)
}
