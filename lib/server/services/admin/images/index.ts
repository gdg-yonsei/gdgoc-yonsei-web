/**
 * MCP 이미지 업로드 서비스 공개 진입점.
 *
 * MCP 클라이언트(AI 도구)가 세션·프로젝트·프로필 이미지를 R2에 올리는 세 가지 방법을 제공한다.
 * 1. `createImageUpload`: 크기·형식을 서명한 사전 서명 URL 발급 → 클라이언트가 직접 PUT
 * 2. `completeImageUpload`: 업로드된 객체의 실제 형식(매직 바이트)을 확인하고 공개 URL 반환
 * 3. `importImageFromUrl`: 공개 URL의 이미지를 서버가 내려받아 R2로 스트리밍(SSRF 방어)
 *
 * 호출부는 `@/lib/server/services/admin/images`만 import한다. 구현은 직접 업로드(`direct-upload.ts`),
 * URL 가져오기(`url-import.ts`), 업로드 기록의 생애 주기(`lifecycle.ts`: 시간당 한도, 거절, 정리),
 * 공용 규칙(`shared.ts`)으로 나뉘어 있다.
 */
export {
  completeImageUpload,
  createImageUpload,
} from '@/lib/server/services/admin/images/direct-upload'
export { importImageFromUrl } from '@/lib/server/services/admin/images/url-import'
export { UPLOADS_PER_HOUR } from '@/lib/server/services/admin/images/lifecycle'
export {
  IMAGE_TARGETS,
  MAX_IMAGE_UPLOAD_BYTES,
  type ImageTarget,
  type UploadedImage,
} from '@/lib/server/services/admin/images/shared'
