/**
 * 상세 페이지 이미지 갤러리 문구(스크린리더 라벨, 이미지 대체 텍스트).
 *
 * 갤러리 컨트롤러는 클라이언트 컴포넌트라 현재 언어 것만 prop으로 넘긴다. 함수는
 * 서버에서 클라이언트로 넘길 수 없으므로 `{alt}`·`{index}`·`{total}` 템플릿으로 둔다
 * (`fillTemplate`으로 채움).
 */
import type { Locale } from '@/lib/i18n'

/** 갤러리 문구 한 언어분. */
export type GalleryCopy = {
  previous: string
  next: string
  /** 썸네일 버튼 이름. */
  thumbnail: string
  /** 현재 위치 안내(aria-live). */
  status: string
  /** 슬라이드 이미지 대체 텍스트. */
  slideAlt: string
}

/** 언어별 갤러리 문구. */
export const galleryCopy: Record<Locale, GalleryCopy> = {
  en: {
    previous: 'Previous image',
    next: 'Next image',
    thumbnail: 'Show {alt} image {index}',
    status: '{alt} image {index} of {total}',
    slideAlt: '{alt} — image {index} of {total}',
  },
  ko: {
    previous: '이전 이미지',
    next: '다음 이미지',
    thumbnail: '{alt} 이미지 {index} 보기',
    status: '{alt} 이미지 {total}장 중 {index}번째',
    slideAlt: '{alt} — 이미지 {index}/{total}',
  },
}
