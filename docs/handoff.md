# 인수인계 메모

새 관리자가 먼저 읽을 문서다. 시스템 구조는 [`architecture/overview.md`](./architecture/overview.md),
개발 환경은 [`development.md`](./development.md)부터 보면 된다.

## 1. 꼭 알아야 할 위험

| 위험                              | 내용                                                                                                                         | 대응                                                                                         |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| **빌드 = 운영 DB 마이그레이션**   | `pnpm build`가 `drizzle-kit migrate`를 먼저 실행한다. `.env`가 운영 DB를 가리키면 로컬 빌드가 운영에 마이그레이션을 적용한다 | 로컬에서는 `pnpm exec next build`만 쓴다. 후속 작업 "빌드와 마이그레이션 분리" 참고          |
| **마이그레이션은 되돌릴 수 없다** | Dokploy 빌드에서 적용되고 자동 롤백이 없다                                                                                   | CI가 위험한 변경을 막는다. 파괴적 변경은 백업 후 `migration:destructive-ok`                  |
| **e2e·시드는 DB를 지운다**        | 2026-09-25에 e2e 초기화가 운영 DB를 비운 사고가 있었다                                                                       | `assertDisposableDatabase`가 로컬 DB만 허용. 이 검사를 우회하지 않는다                       |
| **세션 시각 저장 규칙**           | 세션 `startAt`/`endAt`은 서울 벽시계 시각을 UTC 라벨로 저장한다(`19:00Z` = 서울 19시). `createdAt` 등은 실제 시각            | 비교는 `sessionWallClockNow()`, 표시는 `timeZone: 'UTC'`. `lib/format/datetime.ts` 헤더 참고 |
| **이미지 도메인 하드코딩**        | `next.config.ts`의 `images.remotePatterns`에 이미지 도메인이 직접 적혀 있다                                                  | 도메인을 바꾸면 환경 변수와 함께 고친다                                                      |

## 2. 이번 정리 작업에서 바뀐 동작

브랜치 `refactor/handoff-clean-code`의 `fix:` 커밋들이다. 나머지 `refactor:`·`docs:` 커밋은 동작을 바꾸지 않는다.

| 커밋                                                                              | 바뀐 점                                                                                                      |
| --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `fix(admin): stop part pages from showing parts of other generations`             | 파트 상세·수정 화면이 기수 접근 권한을 확인한다(URL을 알아도 다른 기수 파트는 403)                           |
| `fix(admin): limit the public cache refresh to CORE and LEAD`                     | 공개 캐시 전체 새로고침이 MEMBER에게도 열려 있던 것을 CORE·LEAD로 제한                                       |
| `fix(cache): expire Redis cache entries when Next.js expires them`                | Redis 캐시 항목에 TTL을 걸어 쓰이지 않는 키가 쌓이지 않게 함                                                 |
| `fix(admin): save parts, projects and sessions atomically, clean R2 after commit` | 행 + 관계 행 쓰기를 트랜잭션으로 묶고, R2 정리는 커밋 뒤에                                                   |
| `fix(admin): explain why a session unregister or participant removal failed`      | 참가 취소·참가자 제거 실패가 모두 403이던 것을 원인별로(없음/끝난 세션 → CONFLICT 등)                        |
| `fix(site): fall back to the other language the same way for every text`          | 한쪽 언어가 비었을 때 모든 콘텐츠가 같은 방식(양방향)으로 다른 언어를 보여 줌                                |
| `fix(admin): join profile image keys to the image domain with one slash`          | 프로필 이미지 URL의 이중 슬래시 수정                                                                         |
| `fix(admin): show session names in the admin language on session cards`           | 세션 화면의 두 카드가 관리자 언어로 세션 이름을 보여 줌(전에는 한쪽은 항상 한국어, 한쪽은 항상 영어)         |
| `fix(admin): render the admin 404 inside the admin shell`                         | 관리자 화면에서 없는 항목을 열면 `<html>`이 중첩되어 hydration 오류가 나던 것을, 관리자 셸 안의 404 화면으로 |
| `fix(seed): store dev-seed session times as Seoul wall clock`                     | 개발용 시드 세션이 9시간 이르게 표시되던 문제(개발 데이터만 해당)                                            |

삭제한 것: 2026 신입생 OT 페이지, 쓰이지 않던 SVG·헬퍼·검증 스키마, 대관 장소 API(`AUTO_BOOKER_URL`), 공개
`getSessions` 쿼리, 중첩된(Next가 읽지 않는) manifest 파일, 쓰이지 않는 관리자 사전 키, `SaveImageButton`.

## 2-1. 공간 대관 기능 삭제

GYMS의 강의실(공간) 대관 기능을 통째로 지웠다: `/admin/booking` 화면과 메뉴, 신청·삭제 Server Action,
`lib/server/booking/*`, 권한 리소스(`booking`, `bookingPage`), 관련 테스트와 사전 키.

DB 변경(마이그레이션 `0035_drop_web_booking_requests`):

- 관리자 화면용 미러 테이블 `web_booking_requests`와 enum `bookingStatus`를 **삭제한다.** 배포 빌드에서 바로 적용되며
  되돌릴 수 없다. 남겨야 할 신청 기록이 있으면 **배포 전에 백업**한다.
- CI의 마이그레이션 검사는 테이블 삭제를 막는다. 백업을 확인한 뒤 PR에 `migration:destructive-ok` 라벨을 붙이고
  실패한 CI 작업을 다시 실행한다.
- 외부 auto-booker 서비스가 소유한 `booking_requests` 테이블은 이 저장소의 스키마에 없으므로 **건드리지 않았다.**
  auto-booker 서비스를 더 쓰지 않는다면 그 서비스와 테이블은 운영 쪽에서 따로 정리한다.

## 3. 검증 상태

- `pnpm test:types`, `pnpm lint --max-warnings=0`, `pnpm test`: 통과(커밋마다 실행).
- `pnpm exec next build`: Dev DB(마이그레이션 + `pnpm db:seed --force`로 채움)에 연결해 통과. 모든 공개 경로가 prerender된다.
- 브라우저 확인(Playwright Chromium, 개발 서버 + Dev DB, 임시 LEAD 계정): 공개 페이지(홈, 허브, 상세, 캘린더, 404),
  로그인 화면, 관리자 화면(대시보드, 세션, 멤버, 가입 승인, 파트 수정, 프로젝트 상세, 프로필), 세션 카드 언어,
  갤러리 라벨(영어/한국어), 삭제 확인 모달과 모바일 메뉴의 포커스 처리. 실제 삭제·저장 같은 쓰기 동작은 하지 않았다.
- 개발 모드 콘솔에는 Next 16.3의 "즉시 이동" 검증 경고가 남아 있다(`/[lang]` 루트 레이아웃과 홈이 `params`를,
  관리자 레이아웃이 `connection()`을 Suspense 밖에서 읽음). `main`에서도 똑같이 나오는 기존 구조이며, 후속 작업
  "root-params 전환"과 "권한 레이아웃 정리"에서 함께 해결한다.
- **e2e(`test:e2e:prod`)는 로컬에서 실행하지 않았다.** PR을 올리면 CI가 일회용 Postgres로 실행한다.

## 4. 후속 작업 (이번에 하지 않은 것)

우선순위가 높은 것부터.

1. **빌드와 마이그레이션 분리.** `build`에서 `drizzle-kit generate && migrate`를 빼고 배포 단계(별도 명령 또는
   Dokploy pre-deploy)로 옮긴다. 로컬 빌드 사고를 막는다. CI의 "Migration upgrade path" 작업과 함께 조정해야 한다.
2. **CSS를 사이트·관리자용으로 분리.** `app/globals.css`가 공개 사이트 CSS(`styles/site-*.css`, 약 3,000줄)를
   관리자 화면에도 싣는다. 공용 토큰만 남기고 `site.css`/`admin.css`로 나눠 각 루트 레이아웃에서 import한다.
   `tests/lib/site/css-split.test.ts`를 확장하고 두 화면을 브라우저로 확인해야 한다.
3. **생성·수정 폼 필드 공유.** 세션·프로젝트·파트의 create/edit 페이지가 같은 필드 목록을 각자 갖고 있다.
   `SessionFormFields` 같은 컴포넌트로 합친다. 함께, 수정 폼 대부분에는 파트 수정 폼처럼 저장 버전별 `key`가 없어
   Next가 페이지를 유지할 때 이전 입력이 남을 수 있다. 공유 컴포넌트로 옮기면서 같이 맞춘다.
4. **멤버 선택기 통합.** `part-members-input.tsx`와 `session-part-participants-input.tsx`의 검색·필터 UI가 비슷하다.
   순수 로직은 `lib/admin/member-options.ts`로 모았으니 UI만 합치면 된다.
5. **`PageProps`/`LayoutProps` 도입.** 페이지 props 타입을 Next 생성 타입으로 바꾼다. CI에 `next typegen` 단계가 필요하다.
6. **권한 레이아웃 보일러플레이트 정리.** 20여 개 `layout.tsx`가 `requirePermission` 한 줄과 `connection()`만 한다.
   레이아웃 팩토리나 `next/root-params` 전환과 함께 정리한다(`connection()` 중복도 이때).
7. **`next/root-params` 전환.** 공개 사이트 `[lang]` 처리 방식. 루트 레이아웃 구조를 바꾸는 큰 작업이다.
8. **`services/admin/images.ts` 분할**(업로드 세션 생애주기 / 공개 진입점), **`withDbErrors` 헬퍼**(서비스의 반복 try/catch).
9. **`lib/server/admin-generation-scope.ts`의 수동 쿠키 파싱**(`getCookieFromHeader`)을 `cookies()`로 바꿀 수 있는지 확인.
10. **TypeScript·린트 강화.** type-aware ESLint 규칙(`recommendedTypeChecked`), `exactOptionalPropertyTypes`.
11. **`pretendard` npm 의존성 제거.** 폰트는 `public/`과 `app/pretendard.css`에 들어 있어 패키지는 쓰이지 않는다.
12. **소셜 이미지 라우트의 `size`/`contentType`** 을 `SOCIAL_IMAGE_SIZE` 상수로 바꿀 수 있는지 운영 빌드로 확인.
13. **삭제 시 R2 정리 순서 재검토.** 지금은 이미지를 먼저 지우고 행을 지운다(R2 실패 시 삭제 중단). 행을 먼저 지우고
    이미지는 커밋 뒤 정리하면 "행은 남았는데 이미지가 없는" 상태를 피할 수 있다. 대신 고아 객체가 남을 수 있다.
14. **MCP 연결 관리 UI.** 연결된 클라이언트 목록·해지, 감사 로그 열람.
15. **새로고침 버튼이 상세 페이지 캐시도 지우게 할지 결정.** 지금은 목록 캐시만 지운다. DB를 직접 고쳤을 때 상세
    페이지는 수명(프로젝트 상세는 최대 30일)이 끝날 때까지 이전 내용이 보인다. 항목 태그 전체를 지우려면 모든 id를
    읽어야 하므로 `revalidateTag(..., 'max')` 방식과 비용을 함께 검토한다.
16. **관리자 404의 HTTP 상태 코드.** 관리자 페이지의 `notFound()`는 스트리밍이 시작된 뒤라 화면은 404지만 상태
    코드는 200이다(공개 사이트는 proxy가 미리 확인해 진짜 404를 돌려준다). 관리자 화면은 색인되지 않아 영향은 작다.

## 5. 의도적으로 그대로 둔 것

- **GLSL 셰이더 주석은 영어**다. 일부 GPU 드라이버가 ASCII가 아닌 셰이더 소스를 거부한다.
- **`app/pretendard.css`는 외부 배포본 그대로** 둔다(Prettier 제외, 라이선스 고지 유지).
- **MCP 동의 화면은 영어**다. 외부 클라이언트 사용자를 위한 화면이다.

## 6. 운영 계정·외부 서비스

| 서비스           | 용도                      | 확인할 곳                                                            |
| ---------------- | ------------------------- | -------------------------------------------------------------------- |
| Dokploy          | 운영 배포                 | [`architecture/ci-cd.md`](./architecture/ci-cd.md) "처음 한 번 설정" |
| GitHub           | 저장소, Actions, OAuth 앱 | Settings → Environments `production`                                 |
| Google Cloud     | Google OAuth 클라이언트   | 승인된 리디렉션 URI                                                  |
| Cloudflare       | R2 버킷, 이미지 도메인    | 버킷 CORS, 공개 도메인                                               |
| Resend           | 메일 발송                 | 발신 도메인 인증                                                     |
| Google Analytics | 공개 사이트 통계          | 측정 ID는 `app/(home)/[lang]/layout.tsx`의 `GA_MEASUREMENT_ID`       |
| Google Calendar  | 공개 캘린더 구독          | `lib/site/channels.ts`의 `GOOGLE_CALENDAR`                           |

비밀값과 계정 권한은 저장소에 없다. 이전 관리자에게서 직접 넘겨받는다.
