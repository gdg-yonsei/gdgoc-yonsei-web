# 인수인계 메모

시스템 구조: [`architecture/overview.md`](./architecture/overview.md)
개발 환경: [`development.md`](./development.md)

## 1. 꼭 알아야 할 위험

| 위험                                 | 내용                                                                                                                                                           | 대응                                                                                                                                                                   |
| ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **배포 빌드 = 운영 DB 마이그레이션** | Dokploy(Nixpacks)는 `nixpacks.toml`의 `pnpm build:production`(`drizzle-kit migrate && pnpm build`)으로 빌드합니다. `pnpm build`는 마이그레이션을 하지 않습니다 | 로컬에서 `pnpm build:production`·`pnpm db:migrate`를 운영 `.env`로 실행하지 않습니다. Dokploy 앱에 직접 지정한 빌드 명령이 있으면 `pnpm build:production`으로 맞춥니다 |
| **마이그레이션은 되돌릴 수 없다**    | Dokploy 빌드에서 적용되고 자동 롤백 기능이 없습니다.                                                                                                           | CI가 위험한 변경을 막는다. 파괴적 변경은 백업 후 `migration:destructive-ok`                                                                                            |
| **e2e·시드는 DB를 지운다**           | 2026-09-25에 e2e 초기화가 운영 DB를 비운 사고가 있었습니다.                                                                                                    | `assertDisposableDatabase`가 로컬 DB만 허용. 이 검사를 우회하지 않습니다.                                                                                              |
| **세션 시각 저장 규칙**              | 세션 `startAt`/`endAt`은 서울 시각을 UTC 라벨로 저장한다(`19:00Z` = 서울 19시). `createdAt` 등은 실제 시각                                                     | 비교는 `sessionWallClockNow()`, 표시는 `timeZone: 'UTC'`. `lib/format/datetime.ts` 헤더 참고                                                                           |
| **이미지 도메인 하드코딩**           | `next.config.ts`의 `images.remotePatterns`에 이미지 도메인이 직접 적혀 있습니다.                                                                               | 도메인을 바꾸면 환경 변수와 함께 고쳐야합니다.                                                                                                                         |

## 2. 검증 상태

2026-10-03, `chore/handoff-follow-ups` 브랜치 기준(로컬 일회용 Postgres 17).

- `pnpm test:types`, `pnpm lint --max-warnings=0`(type-aware 규칙 포함), `pnpm test`(869개) 통과.
- `pnpm test:e2e:prod`: 128개 중 127개 통과. 실패한 `home-motion.spec.ts`의 "UI/UX curve" 호버 테스트는 간헐적으로
  실패하는 기존 문제다. 같은 테스트를 `main` 빌드에 5번 돌려 1번 실패했고, 이 브랜치에서는 5번 중 2번 실패했다. CI는 재시도 2회로 통과한다.
- 브라우저로 공개 사이트(홈, 세션 로그, 404)와 관리자 화면(대시보드, 세션·파트·프로젝트 생성·수정, 멤버 선택기, 기수 범위,
  MCP 연결 관리)을 확인했다. 컴파일된 CSS는 분리 전과 선택자를 비교했다.

## 3. 2026-10 후속 작업 정리에서 바뀐 것

이전 인수인계의 후속 작업 16개를 모두 처리했습니다. 동작이나 운영에 영향이 있는 것만 적습니다.

- **빌드와 마이그레이션 분리**: 위 위험 표 참고. CI "Migration upgrade path"는 배포와 같은 `drizzle-kit migrate`를 운영과 같은
  상태의 DB에 실행해 본다.
- **루트 레이아웃 두 개**: `app/layout.tsx`를 없애 `app/(home)/[lang]/layout.tsx`와 `app/(admin)/layout.tsx`가 각자 루트
  레이아웃입니다. 공개 사이트의 `lang`은 `next/root-params`로 읽습니다(`getLocale()`). 두 영역 사이 이동과 언어 전환은
  문서 전체를 다시 불러옵니다. 어떤 라우트와도 맞지 않는 URL은 `app/global-not-found.tsx`(`experimental.globalNotFound`)가
  404로 응답합니다. 루트 소셜 이미지(`/opengraph-image.png`)는 `app/(admin)/`으로 옮겼습니다(URL은 같음).
- **CSS 분리**: `globals.css`(공용) + `site.css`(공개) / `admin.css`(관리자). 컴파일된 선택자를 이전 묶음과 비교해 빠진 규칙이
  없음을 확인했습니다.
- **삭제 순서**: 세션·프로젝트 삭제는 행을 먼저 지우고 커밋 뒤 R2 이미지를 지웁니다. R2가 실패하면 삭제는 성공하고 남은 키를
  `admin.delete-resource.r2-cleanup` 경고 로그로 남깁니다(고아 객체는 손으로 치웁니다).
- **새로고침 버튼**: 목록은 즉시, 세션·프로젝트 상세는 공용 태그(`*:items:*`)로 다음 방문 때 백그라운드에서 다시 만듭니다.
  이 태그가 없던 때 Redis에 저장된 상세 캐시는 수명이 끝날 때까지 버튼으로 지워지지 않습니다.
- **관리자 404 상태 코드**: 승인된 사용자의 관리자 상세 HTML 요청이면 proxy가 항목 존재를 확인하고 없으면 진짜 404를 돌려줍니다.
  로그인하지 않은 요청은 확인하지 않습니다(id 존재 여부가 드러나지 않게).
- **MCP 연결 관리**: 프로필 → 연결된 AI 도구(`/admin/profile/mcp`). 연결을 끊으면 동의·토큰을 지우고, MCP 라우트가 요청마다
  동의를 확인하므로 아직 만료되지 않은 JWT도 바로 거절됩니다. 감사 로그(최근 50건)도 같은 화면에서 봅니다.
- **소셜 이미지 라우트**: `size`/`contentType`이 `SOCIAL_IMAGE_SIZE`/`SOCIAL_IMAGE_CONTENT_TYPE` 상수를 그대로 내보내도 운영 빌드의
  메타 태그가 같음을 확인했습니다.
- **린트**: type-aware ESLint(`recommendedTypeCheckedOnly`)를 켰습니다.

## 4. 후속 작업 (이번에 하지 않은 것)

1. **`exactOptionalPropertyTypes`.** 켜면 남는 오류는 `@better-auth/mcp` 1.7.6 자체 타입 선언(엔드포인트 OpenAPI 메타데이터의
   `format?: undefined`)뿐입니다. 우회하면 `auth.api` 추론이 사라지므로 켜지 않았습니다. 우리 코드는 이미 규칙을 지키므로
   라이브러리를 올린 뒤 `tsconfig.json`에 켜고 `pnpm test:types`로 확인하면 됩니다.
2. **`next/root-params`의 `lang` 타입.** `next typegen`이 라우트 그룹을 지운 경로로 루트 레이아웃을 찾아 관리자 루트 레이아웃
   (`/`)을 모든 경로의 조상으로 봅니다. 그래서 `lang` 타입이 생성되지 않아 `lib/i18n/server.ts`에서 직접 타입을 붙였습니다.
   Next가 이 판정을 고치면 그 한 줄을 지웁니다.
3. **관리자 상세의 `connection()`.** 수정 페이지(`edit/page.tsx`)도 `connection()`을 부릅니다. 상위 `[id]` 레이아웃과 겹치지만,
   개발 모드의 instant 검증이 페이지 단위로 경고를 내므로(이번 작업 전과 같음) 그대로 두었습니다.

## 5. 의도적으로 그대로 둔 것

- **GLSL 셰이더 주석은 영어**다. 일부 GPU 드라이버가 ASCII가 아닌 셰이더 소스를 거부할 수 있습니다.
- **`app/pretendard.css`는 외부 배포본 그대로** 둔다(Prettier 제외, 라이선스 고지 유지).
- **MCP 동의 화면은 영어**

## 6. 운영 계정·외부 서비스

| 서비스           | 용도                      | 확인할 곳                                                            |
| ---------------- | ------------------------- | -------------------------------------------------------------------- |
| Dokploy          | 운영 배포                 | [`architecture/ci-cd.md`](./architecture/ci-cd.md) "처음 한 번 설정" |
| GitHub           | 저장소, Actions, OAuth 앱 | Settings → Environments `production`                                 |
| Google Cloud     | Google OAuth 클라이언트   | 승인된 리디렉션 URI                                                  |
| Cloudflare       | R2 버킷, 이미지 도메인    | 버킷 CORS, 공개 도메인                                               |
| Resend           | 메일 발송                 | 발신 도메인 인증                                                     |
| Google Analytics | 공개 사이트 통계          | 측정 ID는 `app/(home)/[lang]/layout.tsx`의 `GA_MEASUREMENT_ID`       |     |

비밀값과 계정 권한은 저장소에 없습니다. 이전 관리자에게서 직접 넘겨 받아야 합니다.
