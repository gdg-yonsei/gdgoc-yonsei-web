// 업로드 API는 사전 서명 URL만 발급한다. 브라우저 파일은 서버를 거치지 않고 R2로 PUT한다.
// 이미지 삭제 API는 두지 않는다. 쓰지 않게 된 이미지는 폼 저장 뒤 서비스가 참조를 확인하고 지운다.
import 'server-only'

import {
  parseRequestBody,
  privateForbidden,
  privateJson,
  serviceFailureResponse,
} from '@/lib/server/http'
import { authorizeTarget } from '@/lib/server/services/admin/images/shared'
import { presignWebImageUploads } from '@/lib/server/services/admin/images/web-upload'
import { getWebActor } from '@/lib/server/services/admin/web-actor'
import {
  multipleImageUploadValidation,
  singleImageUploadValidation,
} from '@/lib/validations/admin-api'

interface ImageRouteConfig {
  resource: 'projects' | 'sessions'
}

// POST는 { fileName, type, size }를 받아 { uploadUrl, fileName(객체 키), contentType }을 반환한다.
export function createSingleImageUploadRoute({ resource }: ImageRouteConfig) {
  async function POST(request: Request) {
    const actor = await getWebActor()
    if (!actor || !authorizeTarget(actor, resource).ok) {
      return privateForbidden()
    }

    const body = parseRequestBody(
      singleImageUploadValidation,
      await request.json().catch(() => null)
    )
    if (!body.ok) {
      return body.response
    }

    const uploads = await presignWebImageUploads(actor, resource, [body.data])
    if (!uploads.ok) return serviceFailureResponse(uploads)

    return privateJson(uploads.data[0])
  }

  return { POST }
}

export function createMultipleImageUploadRoute({ resource }: ImageRouteConfig) {
  async function POST(request: Request) {
    const actor = await getWebActor()
    if (!actor || !authorizeTarget(actor, resource).ok) {
      return privateForbidden()
    }

    const body = parseRequestBody(
      multipleImageUploadValidation,
      await request.json().catch(() => null)
    )
    if (!body.ok) {
      return body.response
    }

    // 한 장이라도 거절되면 URL을 하나도 발급하지 않고 400을 돌려준다.
    const uploads = await presignWebImageUploads(
      actor,
      resource,
      body.data.images
    )
    if (!uploads.ok) return serviceFailureResponse(uploads)

    return privateJson({ uploadUrls: uploads.data })
  }

  return { POST }
}
