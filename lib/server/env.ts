/**
 * Next 앱 서버 코드가 쓰는 환경변수 진입점.
 *
 * `env-core.ts`를 그대로 다시 내보내되 `server-only`를 붙여, 비밀값을 읽는 코드가 실수로
 * 클라이언트 번들에 들어가면 빌드가 실패하게 한다.
 */
import 'server-only'

export * from './env-core'
