/** 관리자 폼이 이미지가 없을 때 쓰는 기본 이미지. 콘텐츠로 보여 줄 가치가 없다. */
const PLACEHOLDER_PATHS = new Set([
  '/project-default.png',
  '/session-default.png',
  '/default-image.png',
])

function pathOf(src: string): string {
  try {
    return new URL(src, 'https://placeholder.invalid').pathname
  } catch {
    return src
  }
}

/** 기본(자리표시) 이미지인지. 소셜 카드·사이트맵에서 기본 이미지는 빼고 쓴다. */
export function isPlaceholderImage(src: string | null | undefined): boolean {
  return !src || PLACEHOLDER_PATHS.has(pathOf(src))
}
