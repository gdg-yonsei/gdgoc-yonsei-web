import { auth } from '@/auth'
import handlePermission from '@/lib/admin/handle-permission'
import getPreSignedUrl from '@/lib/admin/get-pre-signed-url'
import { NextResponse } from 'next/server'
import r2Client from '@/lib/admin/r2-client'
import { DeleteObjectCommand } from '@aws-sdk/client-s3'

export interface SessionMainImagePostRequest {
  fileName: string
  type: string
}

export async function POST(request: Request) {
  const session = await auth()
  // 사용자 권한 확인
  if (!(await handlePermission(session?.user?.id, 'post', 'sessions'))) {
    return NextResponse.error()
  }

  const res = (await request.json()) as SessionMainImagePostRequest

  // 파일 업로드 경로
  const fileName = `sessions/${crypto.randomUUID()}.${res.fileName.split('.').pop()}`

  // R2 Pre Signed URL 생성
  const uploadUrl = await getPreSignedUrl(fileName, res.type)

  // Pre Signed URL 반환
  return NextResponse.json({ uploadUrl, fileName })
}

export async function DELETE(request: Request) {
  const session = await auth()
  // 사용자 권한 확인
  if (!(await handlePermission(session?.user?.id, 'delete', 'sessions'))) {
    return NextResponse.error()
  }
  const res = (await request.json()) as { imageUrl: string }

  await r2Client.send(
    new DeleteObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: res.imageUrl,
    })
  )
  return NextResponse.json({ message: 'success' })
}
