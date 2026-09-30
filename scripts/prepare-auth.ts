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
 */
import path from 'node:path'
import dotenv from 'dotenv'

// `next build` 와 같은 환경을 만든다: 셸 변수(배포·e2e)가 항상 이기고, 비어 있는 값만
// Next 의 production 우선순위대로 env 파일에서 채운다. 로컬에서 `.env` 만으로
// `pnpm build` 를 돌려도 동작해야 한다.
dotenv.config({
  path: ['.env.production.local', '.env.local', '.env.production', '.env'].map(
    (file) => path.join(process.cwd(), file)
  ),
  quiet: true,
})

async function main() {
  // env 파일을 읽은 뒤에 가져와야 auth 모듈이 설정을 찾는다.
  const { auth } = await import('../auth')
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
