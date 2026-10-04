# GDGoC Yonsei 공식 웹사이트

연세대학교 Google Developer Groups on Campus(GDGoC Yonsei)의 공식 웹사이트와 동아리 관리 시스템(GYMS)입니다.

- 공개 사이트: https://gdgoc.yonsei.ac.kr — 세션·프로젝트·멤버 기록, 세션 캘린더(한국어/영어)
- GYMS(`/admin`): 멤버·기수·파트·세션·프로젝트 관리, 세션 참가 신청
- GYMS MCP(`/api/mcp`): MCP 클라이언트(Claude, Codex, ChatGPT 등)에서 GYMS 기능 사용

## 프로젝트 소개

본 프로젝트는 GDGoC Yonsei 동아리의 공식 웹사이트 구축을 통해 GDGoC Yonsei의 활동을 외부에 알리고, 활동 기록을 남기기 위해 시작하였습니다. 외부에 공개하는 동아리 홍보용 웹사이트 특성을 반영하여 SEO 최적화에 유리한 Next.js를 사용하였으며, 프로젝트 관리 복잡도 관리 및 학교 도메인 사용 등의 문제로 인해 Next.js 프레임워크에서 제공하는 Server Action을 사용하여 웹사이트 기능 구현에 필요한 백엔드 파트를 구현하였습니다.

이전에도 여러 공식 웹사이트 프로젝트가 있었지만, 오래 지속되지 못했습니다. 지속적인 관리와 관심을 통해 본 프로젝트가 계속 유지되어 GDGoC Yonsei를 알리고 홍보하는데 도움이 되었으면 합니다.

## Open Source 정책

이 프로젝트를 지속적을 유지 보수하고 다른 GDGoC에서 참고할 수 있도록 Open Sourc로 관로하기로 결정하였습니다.

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
| 배포       | Dokploy(Nixpacks)                                                                              |

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

> `.env`가 운영 DB를 가리키는 상태에서 `pnpm db:migrate`·`pnpm build:production`을 실행하면 운영 DB에
> 마이그레이션이 적용된다(`pnpm build`는 마이그레이션을 하지 않는다). 자세한 내용은 [`docs/development.md`](./docs/development.md).

## 주요 명령

| 명령                                          | 설명                               |
| --------------------------------------------- | ---------------------------------- |
| `pnpm dev`                                    | 개발 서버                          |
| `pnpm test` / `pnpm test:types` / `pnpm lint` | 단위 테스트 / 타입 검사 / 린트     |
| `pnpm test:e2e`                               | Playwright(일회용 로컬 DB 필요)    |
| `pnpm db:generate` / `pnpm db:migrate`        | 마이그레이션 생성 / 적용           |
| `pnpm db:seed`                                | 개발용 데이터(로컬 DB만)           |
| `pnpm build`                                  | 운영 빌드(마이그레이션 없음)       |
| `pnpm build:production`                       | **배포 전용**: 마이그레이션 + 빌드 |

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

MCP는 자신의 계정 권한 안에서만 작동합니다.

## 기여

이슈와 PR을 환영합니다. 외부 기여자는 PR 전에 이슈를 먼저 열어 주세요.

## 라이선스

MIT License
