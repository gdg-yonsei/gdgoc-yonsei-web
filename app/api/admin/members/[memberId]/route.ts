import { auth } from '@/auth'
import handlePermission from '@/lib/admin/handle-permission'
import { NextResponse } from 'next/server'
import db from '@/db'
import { users } from '@/db/schema/users'
import { eq } from 'drizzle-orm'
import { revalidateTag } from 'next/cache'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ memberId: string }> }
) {
  const session = await auth()
  if (!(await handlePermission(session?.user?.id, 'put', 'members'))) {
    return NextResponse.error()
  }
  const body = (await request.json()) as { profileImage: string }

  await db
    .update(users)
    .set({ image: body.profileImage })
    .where(eq(users.id, (await params).memberId))

  revalidateTag('members')
  return NextResponse.json({ success: true })
}
