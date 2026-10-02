/**
 * 공개 이미지 URL 조립 헬퍼.
 *
 * R2 객체 키(`sessions/{uuid}.png`)를 공개 도메인(`NEXT_PUBLIC_IMAGE_URL`)과 이어 붙인다.
 * 서버(업로드 API, MCP)와 브라우저(업로드 컴포넌트, 프로필 이미지)가 같은 규칙을
 * 쓰도록 순수 함수로 둔다.
 */

/** 기본 URL 끝의 슬래시와 키 앞의 슬래시 개수와 상관없이 슬래시 하나로 이어 붙인다. */
export function joinImageUrl(baseUrl: string, objectKey: string): string {
  return `${baseUrl.trim().replace(/\/+$/, '')}/${objectKey.replace(/^\/+/, '')}`
}

/**
 * 브라우저 번들에서 쓰는 공개 이미지 URL.
 * `NEXT_PUBLIC_` 환경변수는 빌드 시점에 인라인되므로 클라이언트에서도 읽을 수 있다.
 */
export function toPublicImageUrl(objectKey: string): string {
  return joinImageUrl(process.env.NEXT_PUBLIC_IMAGE_URL ?? '', objectKey)
}
