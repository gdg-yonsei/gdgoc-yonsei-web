// 업로드 API는 사전 서명 URL만 발급한다. 브라우저 파일은 서버를 거치지 않고 R2로 PUT한다.
import 'server-only'

import { getAuthSession } from '@/auth'
import {
  parseRequestBody,
  privateError,
  privateForbidden,
  privateJson,
  privateOk,
} from '@/lib/server/http'
import { logger } from '@/lib/server/logger'
import { hasPermission } from '@/lib/server/permission/has-permission'
import {
  getSafeImageExtension,
  normalizeR2ImageObjectKey,
} from '@/lib/server/storage/object-key'
import { deleteImage, presignImageUpload } from '@/lib/server/storage/r2'
import {
  imageDeleteValidation,
  multipleImageUploadValidation,
  singleImageUploadValidation,
} from '@/lib/validations/admin-api'

interface ImageRouteConfig {
  resource: 'projects' | 'sessions'
}

function buildObjectKey(resource: string, fileName: string) {
  const extension = getSafeImageExtension(fileName)
  return extension ? `${resource}/${crypto.randomUUID()}.${extension}` : null
}

// POST는 { fileName, type }을 받아 { uploadUrl, fileName(객체 키) }를 반환한다.
// DELETE는 imageUrl이 이 리소스 접두사의 객체일 때만 삭제한다.
export function createSingleImageUploadRoute({ resource }: ImageRouteConfig) {
  async function POST(request: Request) {
    const session = await getAuthSession()
    if (!(await hasPermission(session?.user?.id, 'post', resource))) {
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

    const uploadUrl = await presignImageUpload(fileName, body.data.type)

    return privateJson({ uploadUrl, fileName })
  }

  async function DELETE(request: Request) {
    const session = await getAuthSession()
    if (!(await hasPermission(session?.user?.id, 'delete', resource))) {
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
      await deleteImage(objectKey)
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
    const session = await getAuthSession()
    if (!(await hasPermission(session?.user?.id, 'post', resource))) {
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

    // 모든 파일의 확장자 검사를 통과한 뒤에야 사전 서명 URL을 만든다. 일부가 거부되면
    // URL을 하나도 발급하지 않고 400을 돌려준다.
    const uploadUrls = await Promise.all(
      fileNames.map((fileName, index) =>
        presignImageUpload(fileName, body.data.images[index]!.type)
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
