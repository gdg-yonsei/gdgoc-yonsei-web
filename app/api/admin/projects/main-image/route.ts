/**
 * 관리자 API: 프로젝트 대표 이미지 업로드 URL 발급(POST)과 삭제(DELETE). 구현은 `lib/server/image-upload-route.ts`.
 */
import { createSingleImageUploadRoute } from '@/lib/server/image-upload-route'

const handlers = createSingleImageUploadRoute({ resource: 'projects' })

/** 업로드 URL 발급. */
export const POST = handlers.POST
/** 업로드한 이미지 삭제. */
export const DELETE = handlers.DELETE
