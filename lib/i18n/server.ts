// next/root-params는 서버 컴포넌트 전용이다. Action·Handler·메타데이터 이미지 라우트는 params를 읽는다.
import { lang } from 'next/root-params'
import { toLocale, type Locale } from '@/lib/i18n'

// typegen은 관리자 루트를 모든 경로의 조상으로 보아 lang 타입을 any로 만든다.
// 실행 시 공개 루트의 lang은 문자열, 관리자 루트에서는 undefined다.
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- 위 설명대로 모듈 타입이 any다.
const readLang: () => Promise<string | undefined> = lang

// 관리자 루트에는 lang이 없어 기본 언어를 쓴다. 관리자 UI 언어는 getAdminLocale()이 정한다.
export async function getLocale(): Promise<Locale> {
  return toLocale(await readLang())
}
