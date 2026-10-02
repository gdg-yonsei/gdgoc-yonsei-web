/**
 * 관리자 웹 이미지 업로드 API 라우트 팩토리(프로젝트·세션).
 *
 * 브라우저는 이 API에서 사전 서명 URL을 받아 R2에 파일을 직접 올린다(서버를 거치지
 * 않는다). 흐름: 권한 확인 → 파일 이름 검증 → 객체 키 생성 → 사전 서명 URL 발급.
 * `app/api/admin/{projects,sessions}/{main,content}-image/route.ts`가 이 팩토리로 만든
 * 핸들러를 그대로 내보낸다.
 */
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

/** 라우트 설정. 네 라우트(리소스 × 단일/다중)는 리소스 이름만 다르다. */
interface ImageRouteConfig {
  /** 권한 매트릭스의 리소스 이름이자 R2 객체 키 접두사 */
  resource: 'projects' | 'sessions'
}

/** `{리소스}/{UUID}.{확장자}` 객체 키를 만든다. 허용하지 않는 확장자면 `null`. */
function buildObjectKey(resource: string, fileName: string) {
  const extension = getSafeImageExtension(fileName)
  return extension ? `${resource}/${crypto.randomUUID()}.${extension}` : null
}

/**
 * 이미지 한 장 업로드(POST)와 삭제(DELETE) 핸들러를 만든다.
 * - POST: `{ fileName, type }` → `{ uploadUrl, fileName(객체 키) }`
 * - DELETE: `{ imageUrl }` → 해당 리소스 접두사의 객체만 지운다
 */
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

/** 여러 장 업로드(POST) 핸들러를 만든다. `{ images: [...] }` → `{ uploadUrls: [...] }` */
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
