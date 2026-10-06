export function joinImageUrl(baseUrl: string, objectKey: string): string {
  return `${baseUrl.trim().replace(/\/+$/, '')}/${objectKey.replace(/^\/+/, '')}`
}

// NEXT_PUBLIC_ 환경변수는 빌드 시점에 브라우저 번들에 인라인된다.
export function toPublicImageUrl(objectKey: string): string {
  return joinImageUrl(process.env.NEXT_PUBLIC_IMAGE_URL ?? '', objectKey)
}
