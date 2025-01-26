import { auth } from '@/auth'
import handlePermission from '@/lib/admin/handle-permission'
import getPreSignedUrl from '@/lib/admin/get-pre-signed-url'
import { NextResponse } from 'next/server'
import r2Client from '@/lib/admin/r2-client'
import { DeleteObjectCommand } from '@aws-sdk/client-s3'

export interface ProjectContentImagePostRequest {
  images: { fileName: string; type: string }[]
}

export async function POST(request: Request) {
  const session = await auth()
  // 사용자 권한 확인
  if (!(await handlePermission(session?.user?.id, 'post', 'projects'))) {
    return NextResponse.error()
  }

  const res = (await request.json()) as ProjectContentImagePostRequest

  const uploadUrlsPromise = []
  const fileNames: string[] = []

  for (const image of res.images) {
    // 파일 업로드 경로
    const fileName = `projects/${crypto.randomUUID()}.${image.fileName.split('.').pop()}`

    // R2 Pre Signed URL 생성
    uploadUrlsPromise.push(getPreSignedUrl(fileName, image.type))
    fileNames.push(fileName)
  }

  const uploadUrls = await Promise.all(uploadUrlsPromise)

  const responseData: { fileName: string; uploadUrl: string }[] = []

  for (let i = 0; i < uploadUrls.length; i++) {
    responseData.push({ fileName: fileNames[i], uploadUrl: uploadUrls[i] })
  }

  // Pre Signed URL 반환
  return NextResponse.json({ uploadUrls: responseData })
}

export async function DELETE(request: Request) {
  const session = await auth()
  // 사용자 권한 확인
  if (!(await handlePermission(session?.user?.id, 'delete', 'projects'))) {
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
