import r2Client from '@/lib/admin/r2-client'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import { Request } from 'next/dist/compiled/@edge-runtime/primitives'
import { NextResponse } from 'next/server'
import handlePermission from '@/lib/admin/handle-permission'
import { auth } from '@/auth'

export interface PostBody {
  memberId: string
  fileName: string
  type: string
}

export async function POST(request: Request) {
  const session = await auth()
  if (!(await handlePermission(session?.user?.id, 'post', 'members'))) {
    return NextResponse.error()
  }

  const res = (await request.json()) as PostBody

  const fileName = `users/${res.memberId}/${crypto.randomUUID()}.${res.fileName.split('.').pop()}`

  const uploadUrl = await getSignedUrl(
    r2Client,
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: fileName,
      ContentType: res.type,
    }),
    { expiresIn: 3600 }
  )

  return NextResponse.json({ uploadUrl, fileName })
}
