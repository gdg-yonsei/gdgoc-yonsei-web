import 'server-only'

import { DeleteObjectCommand } from '@aws-sdk/client-s3'
import { auth } from '@/auth'
import getPreSignedUrl from '@/lib/server/get-pre-signed-url'
import r2Client from '@/lib/server/r2-client'
import { getR2BucketEnv } from '@/lib/server/env'
import {
  parseRequestBody,
  privateError,
  privateForbidden,
  privateJson,
  privateOk,
} from '@/lib/server/http'
import { logger } from '@/lib/server/logger'
import handlePermission from '@/lib/server/permission/handle-permission'
import {
  getSafeImageExtension,
  normalizeR2ImageObjectKey,
} from '@/lib/server/r2-object-key'
import {
  imageDeleteValidation,
  multipleImageUploadValidation,
  singleImageUploadValidation,
} from '@/lib/validations/admin-api'

/**
 * 프로젝트와 세션의 이미지 업로드 라우트를 만든다.
 *
 * 네 개 라우트(`projects`/`sessions` × 단일/다중)가 리소스 이름과 객체 키 접두사만
 * 다른 완전히 동일한 코드였다. 복사본이 각자 조금씩 어긋나 있었기 때문에
 * (성공 응답 형태가 `{ message: 'success' }` 와 `{ success: true }` 로 갈리고,
 * R2 삭제에는 에러 처리가 아예 없었다) 한 곳으로 모은다.
 */
interface ImageRouteConfig {
  /** 권한 매트릭스의 리소스 이름이자 R2 객체 키 접두사 */
  resource: 'projects' | 'sessions'
}

function buildObjectKey(resource: string, fileName: string) {
  const extension = getSafeImageExtension(fileName)
  return extension ? `${resource}/${crypto.randomUUID()}.${extension}` : null
}

export function createSingleImageUploadRoute({ resource }: ImageRouteConfig) {
  async function POST(request: Request) {
    const session = await auth()
    if (!(await handlePermission(session?.user?.id, 'post', resource))) {
      return privateForbidden()
    }

    const body = parseRequestBody(
      singleImageUploadValidation,
      await request.json().catch(() => null)
    )
    if (!body.ok) {
      return body.response
    }

    const fileName = buildObjectKey(resource, body.data.fileName)
    if (!fileName) {
      return privateError('Invalid file extension', 400)
    }

    const uploadUrl = await getPreSignedUrl(fileName, body.data.type)

    return privateJson({ uploadUrl, fileName })
  }

  async function DELETE(request: Request) {
    const session = await auth()
    if (!(await handlePermission(session?.user?.id, 'delete', resource))) {
      return privateForbidden()
    }

    const body = parseRequestBody(
      imageDeleteValidation,
      await request.json().catch(() => null)
    )
    if (!body.ok) {
      return body.response
    }

    const objectKey = normalizeR2ImageObjectKey(body.data.imageUrl, resource)
    if (!objectKey) {
      return privateError('Invalid image key', 400)
    }

    try {
      await r2Client.send(
        new DeleteObjectCommand({
          Bucket: getR2BucketEnv().R2_BUCKET_NAME,
          Key: objectKey,
        })
      )
    } catch (error) {
      logger.error(`api.admin.${resource}.image-delete`, error, { objectKey })
      return privateError('Failed to delete the image', 500)
    }

    return privateOk()
  }

  return { POST, DELETE }
}

export function createMultipleImageUploadRoute({ resource }: ImageRouteConfig) {
  async function POST(request: Request) {
    const session = await auth()
    if (!(await handlePermission(session?.user?.id, 'post', resource))) {
      return privateForbidden()
    }

    const body = parseRequestBody(
      multipleImageUploadValidation,
      await request.json().catch(() => null)
    )
    if (!body.ok) {
      return body.response
    }

    const fileNames: string[] = []
    for (const image of body.data.images) {
      const fileName = buildObjectKey(resource, image.fileName)
      if (!fileName) {
        return privateError('Invalid file extension', 400)
      }
      fileNames.push(fileName)
    }

    // 확장자 검사를 모두 통과한 뒤에 사전 서명 URL 을 만든다.
    // 이전 구현은 검사와 발급을 한 루프에서 처리해, 뒤쪽 파일이 거부되면
    // 앞쪽 파일의 URL 을 이미 발급해 둔 상태로 400 을 반환했다.
    const uploadUrls = await Promise.all(
      fileNames.map((fileName, index) =>
        getPreSignedUrl(fileName, body.data.images[index]!.type)
      )
    )

    return privateJson({
      uploadUrls: fileNames.map((fileName, index) => ({
        fileName,
        uploadUrl: uploadUrls[index]!,
      })),
    })
  }

  return { POST }
}
