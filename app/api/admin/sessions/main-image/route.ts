import { auth } from '@/auth'
import handlePermission from '@/lib/server/permission/handle-permission'
import getPreSignedUrl from '@/lib/server/get-pre-signed-url'
import { NextResponse } from 'next/server'
import r2Client from '@/lib/server/r2-client'
import { DeleteObjectCommand } from '@aws-sdk/client-s3'
import {
  imageDeleteValidation,
  singleImageUploadValidation,
} from '@/lib/validations/admin-api'
import {
  getSafeImageExtension,
  normalizeR2ImageObjectKey,
} from '@/lib/server/r2-object-key'
import { getR2BucketEnv } from '@/lib/server/env'

export interface SessionMainImagePostRequest {
  fileName: string
  type: string
}

/**
 * `POST` 컴포넌트는 전달받은 props와 현재 상태를 기반으로 화면(UI)을 구성하여 렌더링합니다.
 *
 * 구동 원리:
 * 1. 입력값(`request`, `Request`)을 읽고 필요한 계산/조건 분기 로직을 수행합니다.
 * 2. 이벤트 핸들러와 상태 변화를 반영하여 어떤 UI를 보여줄지 결정합니다.
 * 3. 최종 JSX를 반환해 호출 위치의 화면에 결과를 렌더링합니다.
 *
 * 작동 결과:
 * - 사용자에게 현재 데이터/상태에 맞는 인터페이스를 제공합니다.
 * - 상위 컴포넌트와 props를 통해 연결되어 페이지 상호작용 흐름을 완성합니다.
 */
export async function POST(request: Request) {
  const session = await auth()
  // 사용자 권한 확인
  if (!(await handlePermission(session?.user?.id, 'post', 'sessions'))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const json = await request.json().catch(() => null)
  const bodyValidationResult = singleImageUploadValidation.safeParse(json)

  if (!bodyValidationResult.success) {
    return NextResponse.json(
      { error: bodyValidationResult.error.issues[0]?.message ?? 'Validation failed' },
      { status: 400 }
    )
  }

  const res = bodyValidationResult.data

  // 파일 업로드 경로
  const extension = getSafeImageExtension(res.fileName)
  if (!extension) {
    return NextResponse.json({ error: 'Invalid file extension' }, { status: 400 })
  }
  const fileName = `sessions/${crypto.randomUUID()}.${extension}`

  // R2 Pre Signed URL 생성
  const uploadUrl = await getPreSignedUrl(fileName, res.type)

  // Pre Signed URL 반환
  return NextResponse.json({ uploadUrl, fileName })
}

/**
 * `DELETE` 컴포넌트는 전달받은 props와 현재 상태를 기반으로 화면(UI)을 구성하여 렌더링합니다.
 *
 * 구동 원리:
 * 1. 입력값(`request`, `Request`)을 읽고 필요한 계산/조건 분기 로직을 수행합니다.
 * 2. 이벤트 핸들러와 상태 변화를 반영하여 어떤 UI를 보여줄지 결정합니다.
 * 3. 최종 JSX를 반환해 호출 위치의 화면에 결과를 렌더링합니다.
 *
 * 작동 결과:
 * - 사용자에게 현재 데이터/상태에 맞는 인터페이스를 제공합니다.
 * - 상위 컴포넌트와 props를 통해 연결되어 페이지 상호작용 흐름을 완성합니다.
 */
export async function DELETE(request: Request) {
  const session = await auth()
  // 사용자 권한 확인
  if (!(await handlePermission(session?.user?.id, 'delete', 'sessions'))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const json = await request.json().catch(() => null)
  const bodyValidationResult = imageDeleteValidation.safeParse(json)

  if (!bodyValidationResult.success) {
    return NextResponse.json(
      { error: bodyValidationResult.error.issues[0]?.message ?? 'Validation failed' },
      { status: 400 }
    )
  }

  const objectKey = normalizeR2ImageObjectKey(
    bodyValidationResult.data.imageUrl,
    'sessions'
  )

  if (!objectKey) {
    return NextResponse.json({ error: 'Invalid image key' }, { status: 400 })
  }

  await r2Client.send(
    new DeleteObjectCommand({
      Bucket: getR2BucketEnv().R2_BUCKET_NAME,
      Key: objectKey,
    })
  )
  return NextResponse.json({ message: 'success' })
}
