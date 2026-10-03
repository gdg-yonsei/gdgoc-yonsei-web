/**
 * 서버 컴포넌트용 언어 헬퍼. 공개 사이트의 `[lang]`은 루트 레이아웃(`app/(home)/[lang]/layout.tsx`)의
 * 루트 매개변수라, 어느 서버 컴포넌트에서든 `params`를 넘겨받지 않고 읽을 수 있다.
 *
 * `next/root-params`는 서버 컴포넌트(페이지·레이아웃·`generateMetadata`)에서만 쓸 수 있다. Server Action,
 * Route Handler, 메타데이터 이미지 라우트는 지금처럼 `params`를 읽는다.
 */
import { lang } from 'next/root-params'
import { toLocale, type Locale } from '@/lib/i18n'

/**
 * `lang` getter의 실제 타입. `next typegen`은 라우트 그룹을 지운 경로로 루트 레이아웃을 찾는데, 관리자 루트
 * 레이아웃 `app/(admin)/layout.tsx`가 `/`로 보여 모든 경로의 조상이 되므로 `lang`을 찾지 못한다
 * (`.next/types/root-params.d.ts`가 비고, 모듈은 `any`가 된다). 실행 시에는 Next가 실제 레이아웃 트리로
 * 루트 매개변수를 정한다. 공개 페이지에서는 값이 있고 관리자 루트 레이아웃 아래에서는 `undefined`다.
 */
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- 위 설명대로 모듈 타입이 any다.
const readLang: () => Promise<string | undefined> = lang

/**
 * 현재 공개 페이지의 언어. 관리자 루트 레이아웃에는 `[lang]`이 없어 값이 비므로 기본 언어가 된다
 * (관리자 화면의 언어는 `lib/admin-i18n/server.ts`의 `getAdminLocale()`이 정한다).
 */
export async function getLocale(): Promise<Locale> {
  return toLocale(await readLang())
}
