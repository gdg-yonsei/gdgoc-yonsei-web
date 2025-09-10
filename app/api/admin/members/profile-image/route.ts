import { NextRequest, NextResponse } from 'next/server'
import handlePermission from '@/lib/server/permission/handle-permission'
import { auth } from '@/auth'
import getPreSignedUrl from '@/lib/server/get-pre-signed-url'

export interface PostBody {
  memberId: string
  fileName: string
  type: string
}

/**
 * 사용자의 프로필 이미지를 업로드 할 수 있는 URL 을 반환하는 API
 * @param request
 * @constructor
 */
export async function POST(request: NextRequest) {
  const session = await auth()
  const res = (await request.json()) as PostBody
  // 사용자 권한 확인
  if (
    !(await handlePermission(session?.user?.id, 'put', 'members', res.memberId))
  ) {
    return NextResponse.error()
  }

  // 파일 업로드 경로
  const fileName = `users/${res.memberId}/${crypto.randomUUID()}.${res.fileName.split('.').pop()}`

  // R2 Pre Signed URL 생성
  const uploadUrl = await getPreSignedUrl(fileName, res.type)

  // Pre Signed URL 반환
  return NextResponse.json({
    uploadUrl,
    fileName: process.env.NEXT_PUBLIC_IMAGE_URL + fileName,
  })
}
