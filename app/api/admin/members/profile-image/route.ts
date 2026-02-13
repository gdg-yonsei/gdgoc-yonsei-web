import { NextRequest, NextResponse } from 'next/server'
import handlePermission from '@/lib/server/permission/handle-permission'
import { auth } from '@/auth'
import getPreSignedUrl from '@/lib/server/get-pre-signed-url'
import { memberProfileImageUploadValidation } from '@/lib/validations/admin-api'
import { getSafeImageExtension } from '@/lib/server/r2-object-key'

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
  const json = await request.json().catch(() => null)
  const bodyValidationResult = memberProfileImageUploadValidation.safeParse(json)

  if (!bodyValidationResult.success) {
    return NextResponse.json(
      { error: bodyValidationResult.error.issues[0].message },
      { status: 400 }
    )
  }

  const res = bodyValidationResult.data
  // 사용자 권한 확인
  if (
    !(await handlePermission(session?.user?.id, 'put', 'members', res.memberId))
  ) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // 파일 업로드 경로
  const extension = getSafeImageExtension(res.fileName)
  if (!extension) {
    return NextResponse.json({ error: 'Invalid file extension' }, { status: 400 })
  }
  const fileName = `users/${res.memberId}/${crypto.randomUUID()}.${extension}`

  // R2 Pre Signed URL 생성
  const uploadUrl = await getPreSignedUrl(fileName, res.type)

  // Pre Signed URL 반환
  return NextResponse.json({
    uploadUrl,
    fileName: process.env.NEXT_PUBLIC_IMAGE_URL + fileName,
  })
}
