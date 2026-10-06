// next/root-params는 Next 컴파일러가 교체하는 자리표시자여서 Vitest에서 예외를 던지므로 대역을 쓴다.
let current: { lang?: string } = { lang: 'en' }

export function setRootParams(params: { lang?: string }) {
  current = params
}

export async function lang(): Promise<string | undefined> {
  return current.lang
}
