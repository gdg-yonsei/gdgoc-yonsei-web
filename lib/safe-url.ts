// 사용자가 입력한 링크는 http(s)만 받는다. URL 파서는 `javascript:`·`data:`도 유효한 URL로 보므로
// 스킴을 따로 확인해야 href에 넣었을 때 스크립트가 실행되지 않는다.

export function isHttpUrl(value: string): boolean {
  try {
    const { protocol } = new URL(value)
    return protocol === 'http:' || protocol === 'https:'
  } catch {
    return false
  }
}

/** 저장된 링크가 http(s)일 때만 돌려준다. 검증이 생기기 전에 저장된 값도 화면에서 한 번 더 거른다. */
export function httpUrlOrNull(value: string | null | undefined): string | null {
  return value && isHttpUrl(value) ? value : null
}
