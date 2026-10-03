# 인수인계 메모

시스템 구조: [`architecture/overview.md`](./architecture/overview.md)
개발 환경: [`development.md`](./development.md)


## 1. 꼭 알아야 할 위험

| 위험                              | 내용                                                                                                                         | 대응                                                                                         |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| **빌드 = 운영 DB 마이그레이션**   | `pnpm build`가 `drizzle-kit migrate`를 먼저 실행합니다. `.env`가 운영 DB를 가리키면 로컬 빌드가 운영에 마이그레이션을 적용합니다 | 로컬에서는 `pnpm exec next build`만 사용합니다. 후속 작업 "빌드와 마이그레이션 분리" 참고          |
| **마이그레이션은 되돌릴 수 없다** | Dokploy 빌드에서 적용되고 자동  롤백 기능이 없습니다.                                                                                   | CI가 위험한 변경을 막는다. 파괴적 변경은 백업 후 `migration:destructive-ok`                  |
| **e2e·시드는 DB를 지운다**        | 2026-09-25에 e2e 초기화가 운영 DB를 비운 사고가 있었습니다.                                                                       | `assertDisposableDatabase`가 로컬 DB만 허용. 이 검사를 우회하지 않습니다.                       |
| **세션 시각 저장 규칙**           | 세션 `startAt`/`endAt`은 서울 시각을 UTC 라벨로 저장한다(`19:00Z` = 서울 19시). `createdAt` 등은 실제 시각            | 비교는 `sessionWallClockNow()`, 표시는 `timeZone: 'UTC'`. `lib/format/datetime.ts` 헤더 참고 |
| **이미지 도메인 하드코딩**        | `next.config.ts`의 `images.remotePatterns`에 이미지 도메인이 직접 적혀 있습니다.                                                  | 도메인을 바꾸면 환경 변수와 함께 고쳐야합니다.                                                      |

## 2. 검증 상태

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
| Google Analytics | 공개 사이트 통계          | 측정 ID는 `app/(home)/[lang]/layout.tsx`의 `GA_MEASUREMENT_ID`       |                          |

비밀값과 계정 권한은 저장소에 없습니다. 이전 관리자에게서 직접 넘겨 받아야 합니다.
