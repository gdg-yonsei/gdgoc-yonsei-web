/**
 * 공개 사이트 웹폰트(next/font). 한글 본문은 `app/pretendard.css`의 Pretendard 서브셋을 쓴다.
 */
import {
  Google_Sans,
  Google_Sans_Code,
  Google_Sans_Flex,
} from 'next/font/google'

/**
 * 라틴 본문·제목 글꼴. ROND(둥글기) 축으로 제목 글자가 GDG 마크의 캡슐 획을 닮게 한다.
 * 굵기 축 포함 약 71KB(latin)로, 예전 정적 Google Sans 파일(약 52KB)보다 조금 크다.
 */
export const googleSansFlex = Google_Sans_Flex({
  subsets: ['latin'],
  axes: ['ROND'],
  display: 'swap',
  variable: '--font-flex',
  // next/font에 이 글꼴의 메트릭 정보가 없어, 크기를 맞춘 대체 글꼴을
  // app/styles/site-theme.css에 따로 정의했다. 글꼴이 바뀔 때 글자가 밀리지 않는다.
  adjustFontFallback: false,
  fallback: ['Google Sans Flex Fallback'],
})

/**
 * 홈 히어로의 "GDGoC Yonsei" 제목 전용. 굵은 라틴 글꼴 하나만 필요하다.
 * 이 글꼴도 대체 메트릭이 없어, 바뀌는 동안에는 이미 불러온 제목 글꼴(Google Sans Flex)로 보인다.
 */
export const googleSans = Google_Sans({
  subsets: ['latin'],
  weight: '700',
  display: 'swap',
  variable: '--font-google-sans',
  adjustFontFallback: false,
})

/** 날짜, 태그, 숫자용 고정폭 글꼴. 작은 보조 텍스트에만 쓰여 미리 불러오지 않는다. */
export const googleSansCode = Google_Sans_Code({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-code-mono',
  preload: false,
  adjustFontFallback: false,
  fallback: ['Google Sans Code Fallback'],
})
