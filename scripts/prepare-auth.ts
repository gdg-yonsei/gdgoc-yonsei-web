/**
 * `next build` 전에 Better Auth 를 한 프로세스에서 한 번 초기화한다.
 *
 * `@better-auth/mcp`(oauth-provider)는 초기화할 때 MCP 리소스 행(`oauth_resource`)을
 * 시드한다. 새 DB 에서 `next build` 의 여러 워커가 동시에 초기화하면 같은 행을 함께
 * 넣으려다 unique 제약에 걸리는데, 라이브러리는 이 충돌을 오류 메시지로만 알아보고
 * Drizzle 은 원래 메시지를 cause 로 감싸므로 충돌이 그대로 실패가 된다(빌드 실패).
 * 여기서 먼저 시드해 두면 빌드 워커들은 이미 있는 행을 찾기만 한다.
 *
 * `auth.ts` 가 `server-only` 를 가져오므로 `tsx --conditions=react-server` 로 실행한다.
 * `.env` 는 읽지 않는다: 배포·e2e 모두 환경 변수를 직접 넘긴다.
 */
import { auth } from '../auth'

async function main() {
  await auth.$context
  console.log('Better Auth initialized (OAuth resources seeded).')
}

main().then(
  () => process.exit(0),
  (error: unknown) => {
    console.error(error)
    process.exit(1)
  }
)
