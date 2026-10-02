# GDGoC Yonsei 공식 웹사이트

연세대학교 Google Developer Groups on Campus(GDGoC Yonsei)의 공식 웹사이트와 동아리 관리 시스템(GYMS)이다.

- 공개 사이트: https://gdgoc.yonsei.ac.kr — 세션·프로젝트·멤버 기록, 세션 캘린더(한국어/영어)
- GYMS(`/admin`): 멤버·기수·파트·세션·프로젝트 관리, 세션 참가 신청
- GYMS MCP(`/api/mcp`): MCP 클라이언트(Claude, Codex, ChatGPT 등)에서 GYMS 기능 사용

## 기술 스택

| 영역       | 사용 기술                                                                                      |
| ---------- | ---------------------------------------------------------------------------------------------- |
| 프레임워크 | Next.js 16 (App Router, Cache Components, Proxy), React 19 (React Compiler)                    |
| 언어       | TypeScript                                                                                     |
| 데이터     | PostgreSQL + Drizzle ORM, Redis(공유 캐시, 선택)                                               |
| 인증       | Better Auth (GitHub·Google 로그인, 패스키, MCP용 OAuth 2.1 인가 서버)                          |
| 저장소     | Cloudflare R2 (presigned URL 직접 업로드)                                                      |
| 메일       | Resend + React Email                                                                           |
| UI         | Tailwind CSS 4, Jotai(관리자 전역 UI 상태), anime.js·WebGL(홈 연출), motion(관리자 애니메이션) |
| 검증       | Zod                                                                                            |
| 테스트     | Vitest, Testing Library, Playwright                                                            |
| 배포       | Dokploy(Nixpacks), GitHub Actions                                                              |

## 빠른 시작

```bash
git clone https://github.com/gdg-yonsei/gdgoc-yonsei-web.git
cd gdgoc-yonsei-web
pnpm install
cp .env.example .env   # 값 채우기
pnpm db:migrate        # 로컬 DB에만!
pnpm db:seed           # (선택) 개발용 데이터
pnpm dev               # http://localhost:3000
```

> `.env`가 운영 DB를 가리키는 상태에서 `pnpm build`·`pnpm db:migrate`를 실행하면 운영 DB에 마이그레이션이
> 적용된다. 자세한 내용은 [`docs/development.md`](./docs/development.md).

## 주요 명령

| 명령                                          | 설명                                 |
| --------------------------------------------- | ------------------------------------ |
| `pnpm dev`                                    | 개발 서버                            |
| `pnpm test` / `pnpm test:types` / `pnpm lint` | 단위 테스트 / 타입 검사 / 린트       |
| `pnpm test:e2e`                               | Playwright(일회용 로컬 DB 필요)      |
| `pnpm db:generate` / `pnpm db:migrate`        | 마이그레이션 생성 / 적용             |
| `pnpm db:seed`                                | 개발용 데이터(로컬 DB만)             |
| `pnpm build`                                  | **운영 배포용**: 마이그레이션 + 빌드 |

## 문서

| 문서                                                                                       | 내용                                                    |
| ------------------------------------------------------------------------------------------ | ------------------------------------------------------- |
| [`docs/handoff.md`](./docs/handoff.md)                                                     | **인수인계 메모**: 위험 요소, 최근 동작 변경, 후속 작업 |
| [`docs/development.md`](./docs/development.md)                                             | 개발 환경, 환경 변수, 테스트, 문제 해결                 |
| [`docs/architecture/overview.md`](./docs/architecture/overview.md)                         | 시스템 구성, 계층, 요청 흐름, 디렉터리 지도             |
| [`docs/architecture/code-organization.md`](./docs/architecture/code-organization.md)       | 코드 배치 규칙, 작성 규칙(주석·export·React)            |
| [`docs/architecture/auth-and-permissions.md`](./docs/architecture/auth-and-permissions.md) | 로그인, 역할, 권한 표, 기수 범위                        |
| [`docs/architecture/caching.md`](./docs/architecture/caching.md)                           | 캐시 태그·수명·무효화, Redis                            |
| [`docs/architecture/uploads.md`](./docs/architecture/uploads.md)                           | 이미지 업로드(웹, MCP), SSRF 방어                       |
| [`docs/architecture/mcp.md`](./docs/architecture/mcp.md)                                   | GYMS MCP 서버, OAuth, 도구                              |
| [`docs/architecture/ci-cd.md`](./docs/architecture/ci-cd.md)                               | CI 작업, 배포, 마이그레이션 규칙                        |

## GYMS MCP 연결

- Claude Code: `claude mcp add --transport http gyms https://gdgoc.yonsei.ac.kr/api/mcp`
- Claude.ai / Desktop: Customize → Connectors → Add custom connector → `https://gdgoc.yonsei.ac.kr/api/mcp`
- Cursor: `mcp.json`에 `{ "mcpServers": { "gyms": { "url": "https://gdgoc.yonsei.ac.kr/api/mcp" } } }`

평소 계정으로 로그인하고 동의 화면에서 스코프를 고른다. 역할 범위 안에서만 동작한다.

## 기여

이슈와 PR을 환영한다. 외부 기여자는 PR 전에 이슈를 먼저 열어 주세요.

## 라이선스

MIT License
