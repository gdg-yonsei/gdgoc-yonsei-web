/**
 * `next/root-params` 대역. 실제 모듈은 Next 컴파일러가 바꿔 끼우는 자리 표시자라 Vitest에서는 예외를 던진다.
 * 테스트는 `setRootParams({ lang: 'ko' })`로 현재 경로의 루트 매개변수를 정한다.
 */
let current: { lang?: string } = { lang: 'en' }

/** 다음 렌더링이 읽을 루트 매개변수를 정한다. */
export function setRootParams(params: { lang?: string }) {
  current = params
}

/** `app/(home)/[lang]` 루트 레이아웃의 `lang`. */
export async function lang(): Promise<string | undefined> {
  return current.lang
}
