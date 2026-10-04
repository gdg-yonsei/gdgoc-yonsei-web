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



## 3. 주의

- 일부 GPU 드라이버가 ASCII가 아닌 셰이더 소스를 거부할 수 있기 때문에 **GLSL 셰이더 주석은 영어**로 남겨두었습니다.
- **`app/pretendard.css`는 외부 배포본 그대로** 유지(Prettier 제외, 라이선스 고지 유지).
- **MCP 동의 화면은 영어**로 작성하였습니다.

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
