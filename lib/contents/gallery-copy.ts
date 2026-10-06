// 갤러리는 현재 언어 문구만 받는다. 전송 불가능한 함수 대신 {alt}·{index}·{total} 템플릿을 쓴다.
import type { Locale } from '@/lib/i18n'

export type GalleryCopy = {
  previous: string
  next: string
  thumbnail: string
  status: string
  slideAlt: string
}

export const galleryCopy: Record<Locale, GalleryCopy> = {
  en: {
    previous: 'Previous image',
    next: 'Next image',
    thumbnail: 'Show {alt} image {index}',
    status: '{alt} image {index} of {total}',
    slideAlt: '{alt}, image {index} of {total}',
  },
  ko: {
    previous: '이전 이미지',
    next: '다음 이미지',
    thumbnail: '{alt} 이미지 {index} 보기',
    status: '{alt} 이미지 {total}장 중 {index}번째',
    slideAlt: '{alt}, 이미지 {index}/{total}',
  },
}
