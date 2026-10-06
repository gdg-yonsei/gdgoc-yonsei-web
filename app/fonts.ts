import {
  Google_Sans,
  Google_Sans_Code,
  Google_Sans_Flex,
} from 'next/font/google'

/** ROND 축으로 GDG 캡슐 획을 닮은 제목을 만들며, 굵기 축 포함 라틴 서브셋은 약 71KB다. */
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

/** 홈 히어로 전용 글꼴은 대체 메트릭이 없어, 로딩 동안 Google Sans Flex를 쓴다. */
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
