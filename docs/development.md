# 개발 환경

## 1. 준비물

| 도구       | 버전                              | 비고                                                  |
| ---------- | --------------------------------- | ----------------------------------------------------- |
| Node.js    | `package.json`의 `engines.node`   | 운영 빌드 이미지는 `nixpacks.toml`에 고정             |
| pnpm       | `package.json`의 `packageManager` | `corepack enable`로 맞춘다                            |
| PostgreSQL | 16 이상(CI는 18)                  | 로컬 또는 Docker                                      |
| Redis      | 선택                              | 없으면 메모리 캐시. 여러 인스턴스 동작을 볼 때만 필요 |

## 2. 처음 실행

```bash
git clone https://github.com/gdg-yonsei/gdgoc-yonsei-web.git
cd gdgoc-yonsei-web
pnpm install
cp .env.example .env      # 값 채우기(아래 표)
pnpm db:migrate           # 로컬 DB에 마이그레이션 적용
pnpm db:seed              # (선택) 개발용 데이터
pnpm dev                  # http://localhost:3000
```

> **주의: `.env`가 운영 DB를 가리키면 안 된다.** `pnpm db:migrate`, `pnpm db:push`, `pnpm build:production`(배포 전용)은
> `.env`의 DB에 바로 마이그레이션을 적용한다. 시드와 e2e는 로컬 DB가 아니면 실행을 거부하지만, 마이그레이션은 막지 않는다.
> `pnpm build`는 마이그레이션을 하지 않지만 정적 경로를 만들려고 DB를 읽고, `auth:prepare`가 MCP 리소스 행을 넣는다.

## 3. 환경 변수

| 변수                                                                        | 필수      | 용도                                                                             |
| --------------------------------------------------------------------------- | --------- | -------------------------------------------------------------------------------- |
| `AUTH_DRIZZLE_URL`                                                          | 예        | PostgreSQL 연결 문자열                                                           |
| `BETTER_AUTH_SECRET`                                                        | 예        | 세션·JWT·MCP 업로드 토큰 서명 키(32자 이상)                                      |
| `BETTER_AUTH_URL`                                                           | 예        | 인증 서버 origin(로컬은 `http://localhost:3000`). MCP 리소스 URL도 여기서 만든다 |
| `NEXT_PUBLIC_SITE_URL`                                                      | 예        | 공개 사이트 origin(메타데이터, 사이트맵, 메일 링크)                              |
| `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`                                  | 로그인 시 | GitHub OAuth 앱. 콜백: `{BETTER_AUTH_URL}/api/auth/callback/github`              |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`                                  | 로그인 시 | Google OAuth 클라이언트. 콜백: `{BETTER_AUTH_URL}/api/auth/callback/google`      |
| `R2_ACCESS_KEY`, `R2_SECRET_KEY`, `CLOUDFLARE_ACCOUNT_ID`, `R2_BUCKET_NAME` | 업로드 시 | Cloudflare R2                                                                    |
| `NEXT_PUBLIC_IMAGE_URL`                                                     | 업로드 시 | R2 버킷 공개 도메인                                                              |
| `RESEND_API_KEY`                                                            | 메일 시   | 세션 알림 메일                                                                   |
| `REDIS_URL`                                                                 | 아니오    | 공유 캐시. `redis://` 또는 `rediss://`                                           |
| `E2E_DISPOSABLE_DATABASE_URL`                                               | 아니오    | 로컬이 아닌 일회용 DB(CI 등)를 e2e·시드 대상으로 명시적으로 허용                 |

환경 변수는 `lib/server/env-core.ts`의 기능별 함수로 검증한다. 그 기능을 처음 쓸 때 빠진 값을 알려 주므로,
R2·Resend 값이 없어도 공개 페이지 개발은 할 수 있다.

## 4. 자주 쓰는 명령

| 명령                                                 | 설명                                                                 |
| ---------------------------------------------------- | -------------------------------------------------------------------- |
| `pnpm dev`                                           | 개발 서버(Turbopack)                                                 |
| `pnpm test`                                          | Vitest 단위·컴포넌트 테스트                                          |
| `pnpm test:types`                                    | `tsc --noEmit`                                                       |
| `pnpm lint`                                          | ESLint(CI는 `--max-warnings=0`)                                      |
| `pnpm format`                                        | Prettier 전체 적용(CI는 PR에서 바뀐 파일만 검사)                     |
| `pnpm db:generate`                                   | `db/schema` 변경으로 마이그레이션 SQL 생성                           |
| `pnpm db:migrate`                                    | 마이그레이션 적용                                                    |
| `pnpm db:studio`                                     | Drizzle Studio                                                       |
| `pnpm db:seed`                                       | 개발용 데이터(아래)                                                  |
| `pnpm email:dev`                                     | React Email 미리보기 서버(`emails/`)                                 |
| `pnpm test:e2e`                                      | Playwright(일회용 DB 필요, 아래)                                     |
| `pnpm perf:measure` / `perf:budget` / `perf:instant` | 성능 측정·예산·즉시 이동 검증(운영 빌드를 3100 포트에 띄운 상태에서) |

커밋 전에는 `pnpm test:types && pnpm lint --max-warnings=0 && pnpm test`를 통과시킨다.

## 5. DB 스키마 바꾸기

1. `db/schema/*.ts`를 고친다.
2. `pnpm db:generate`로 `drizzle/`에 새 SQL과 journal 항목을 만든다.
3. 생성된 SQL을 읽어 본다. 데이터를 지우거나 다시 쓰는 변경이면 CI가 막는다(`migration:destructive-ok` 라벨 필요).
4. 로컬 DB에 `pnpm db:migrate`.
5. **이미 머지된 마이그레이션 파일은 절대 고치지 않는다.** 운영에는 이미 적용되어 있어 고쳐도 다시 실행되지 않는다.

## 6. 개발용 시드

`pnpm db:seed`(`scripts/seed-dev.ts`)는 기수 하나, 파트 7개, 멤버, 프로젝트 8개, 약 60개 세션을 넣는다.

- 다시 실행해도 된다. `dev-seed-` 표시가 붙은 이전 시드 행만 지우고 다시 넣는다(TRUNCATE하지 않음).
- 로컬 DB가 아니면 거부한다. 직접 고른 DB에 넣으려면 `--force`.
- e2e는 DB를 초기화하므로, e2e를 돌린 뒤에는 시드를 다시 실행한다.

## 7. E2E 테스트

```bash
pnpm test:e2e:install     # 처음 한 번: Chromium
pnpm test:e2e             # next dev를 3100 포트로 띄우고 실행
```

- 시작할 때 **모든 테이블을 비운다**. `AUTH_DRIZZLE_URL`이 로컬 DB(또는 `E2E_DISPOSABLE_DATABASE_URL`과 정확히 같은 DB)가
  아니면 실행을 거부한다(2026-09-25 운영 DB 초기화 사고 이후 추가된 안전장치).
- 패스키 테스트 때문에 `127.0.0.1`이 아니라 `localhost`를 쓴다(WebAuthn은 IP를 허용하지 않는다).
- CI는 운영 빌드로 `pnpm test:e2e:prod`를 돌린다.

## 8. 로컬에서 MCP 확인

1. `.env`의 `BETTER_AUTH_URL`을 `http://localhost:3000`으로 두고 `pnpm dev`.
2. `claude mcp add --transport http gyms-local http://localhost:3000/api/mcp`
3. `/mcp` → Authenticate → 브라우저에서 로그인·동의.

## 9. 문제 해결

| 증상                                    | 확인할 것                                                                                    |
| --------------------------------------- | -------------------------------------------------------------------------------------------- |
| `X is not set in environment variables` | `.env`에 그 값이 있는지. 기능별로 처음 쓸 때 검사한다                                        |
| 로그인 후 403                           | 새 계정은 `UNVERIFIED`다. DB에서 `user.role`을 `LEAD`로 바꾸거나 다른 관리자가 승인          |
| 관리자 화면 목록이 비어 있음            | 사이드바의 기수 범위. LEAD가 아니면 자신이 속한 파트의 기수만 보인다                         |
| 공개 페이지에 수정이 안 보임            | 개발 모드에서도 캐시가 동작한다. 관리자 사이드바의 새로고침 버튼(CORE·LEAD) 또는 서버 재시작 |
| 이미지 업로드 실패                      | R2 환경 변수, 버킷 CORS(PUT 허용), `next.config.ts`의 `images.remotePatterns`                |
| `pnpm build`가 DB 오류                  | 빌드는 DB를 읽는다. 대상 DB에 마이그레이션이 적용됐는지(`pnpm db:migrate`) 확인              |
