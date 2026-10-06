import 'server-only'

/** 허용하는 이미지 형식. SVG는 스크립트를 담을 수 있어 받지 않는다. */
export type DetectedImageType = 'jpeg' | 'png' | 'webp' | 'gif' | 'avif'

/** 형식별 허용 확장자. 첫 번째 값이 새 객체 키의 확장자가 된다. */
export const IMAGE_TYPE_EXTENSIONS: Record<
  DetectedImageType,
  readonly string[]
> = {
  jpeg: ['jpg', 'jpeg'],
  png: ['png'],
  webp: ['webp'],
  gif: ['gif'],
  avif: ['avif'],
}

export const IMAGE_TYPE_MIME: Record<DetectedImageType, string> = {
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
  avif: 'image/avif',
}

function asciiAt(bytes: Uint8Array, start: number, text: string) {
  return [...text].every(
    (char, index) => bytes[start + index] === char.charCodeAt(0)
  )
}

// 확장자·Content-Type은 클라이언트가 정하므로 매직 바이트를 검사한다. 스크립트를 담는 SVG는 거부한다.
export function detectImageType(bytes: Uint8Array): DetectedImageType | null {
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return 'jpeg'
  }
  if (
    [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every(
      (byte, index) => bytes[index] === byte
    )
  ) {
    return 'png'
  }
  if (asciiAt(bytes, 0, 'RIFF') && asciiAt(bytes, 8, 'WEBP')) return 'webp'
  if (asciiAt(bytes, 0, 'GIF87a') || asciiAt(bytes, 0, 'GIF89a')) return 'gif'
  if (
    asciiAt(bytes, 4, 'ftyp') &&
    (asciiAt(bytes, 8, 'avif') || asciiAt(bytes, 8, 'avis'))
  ) {
    return 'avif'
  }
  return null
}
