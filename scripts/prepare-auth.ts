// 빌드 전 단일 프로세스로 OAuth 리소스를 시드해 병렬 워커의 unique 충돌을 피한다.
// auth.ts가 server-only를 가져오므로 tsx --conditions=react-server로 실행한다.
import path from 'node:path'
import dotenv from 'dotenv'

// 배포·e2e 셸 변수를 우선하고 빈 값만 Next production 우선순위대로 env 파일에서 채운다.
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
