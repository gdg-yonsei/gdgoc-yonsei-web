/** Search Console 호출 실패. 서비스가 HTTP 상태로 안내 문구를 고른다(403 권한, 429 할당량). 토큰·조회 모듈이 함께 쓴다. */
import 'server-only'

export class SearchConsoleError extends Error {
  constructor(
    readonly status: number,
    message: string
  ) {
    super(message)
    this.name = 'SearchConsoleError'
  }
}
