/**
 * 관리자 API: 프로젝트 본문 이미지 여러 장 업로드 URL 발급(POST). 구현은 `lib/server/image-upload-route.ts`.
 */
import { createMultipleImageUploadRoute } from '@/lib/server/image-upload-route'

const handlers = createMultipleImageUploadRoute({ resource: 'projects' })

/** 업로드 URL 여러 개 발급. */
export const POST = handlers.POST
