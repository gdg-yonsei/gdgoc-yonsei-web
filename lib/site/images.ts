/** Stock images the admin forms fall back to; never worth showing as content. */
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

export function isPlaceholderImage(src: string | null | undefined): boolean {
  return !src || PLACEHOLDER_PATHS.has(pathOf(src))
}
