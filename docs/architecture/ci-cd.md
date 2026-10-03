# CI/CD

## 흐름

```text
PR ──► CI (ci.yml) ───────────────────────────► 필수 체크 "CI passed"
                                                         │ merge
main ──► CD (cd.yml): CI (같은 workflow) ──► Dokploy 배포 ──► 스모크 테스트(운영)
```

- **CI**는 모든 PR과 merge queue에서 돌고, CD가 배포 전에 `main`에서 한 번 더 돌린다.
- **CD**는 CI가 통과한 커밋이 여전히 `main`의 최신 커밋일 때만 Dokploy 배포를 시작한다. 빌드가 끝날 때까지 기다린 뒤
  https://gdgoc.yonsei.ac.kr 에 스모크 테스트를 한다.
- **CodeQL**(`codeql.yml`)은 PR, `main`, 매주 JS/TS와 workflow 자체를 검사한다.
- **Dependabot**(`.github/dependabot.yml`)은 매주 npm과 Actions 업데이트를 묶어 PR을 연다.

## CI 작업

| 작업                            | 잡아내는 것                                                                                                                                                                                                                                                                                  |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Typecheck, lint, format, schema | `tsc`, ESLint(경고 0), PR이 바꾼 파일의 Prettier. `db/schema`를 바꾸고 마이그레이션을 커밋하지 않은 경우(배포는 커밋된 마이그레이션만 적용하므로 새 코드가 운영 DB에 없는 컬럼을 읽게 된다), `package.json`과 다른 버전을 조용히 고정하는 `pnpm-workspace.yaml` overrides, 위험한 마이그레이션(아래). |
| Unit tests                      | Vitest와 커버리지 보고(작업 요약, `coverage` 아티팩트).                                                                                                                                                                                                                                      |
| Migration upgrade path          | 운영과 같은 상태를 다시 만든다: Postgres 18을 **base** 리비전까지 마이그레이션하고 base 코드로 시드한 뒤, 이 리비전의 마이그레이션을 얹는다. 다시 한 번 실행해(멱등이어야 함) 새 코드로 시드한다.                                                                                            |
| E2E (production build)          | 일회용 Postgres에서 `pnpm test:e2e:prod`. 실패하면 trace·영상·보고서를 올린다. 같은 빌드로 성능 예산도 측정하지만 **보고만 하고 막지 않는다**(공유 러너의 시간 측정은 잡음이 크다).                                                                                                          |
| Dependency security             | `dependency-review`가 high/critical 취약점이 있는 의존성을 추가하는 PR을 실패시킨다. `pnpm audit`은 보고만 한다.                                                                                                                                                                             |
| Workflow lint                   | `.github/workflows`에 `actionlint`.                                                                                                                                                                                                                                                          |
| CI passed                       | 위 작업들을 모은다. 브랜치 보호에는 **이 체크 하나만** 필수로 지정한다.                                                                                                                                                                                                                      |

CI는 실제 비밀값을 보지 않는다. `ci.yml`의 값은 모두 자리 표시자이고, DB 쓰기는 작업 자체의 Postgres 서비스
(`127.0.0.1`)로 간다. `scripts/lib/disposable-database.ts`가 이 주소만 허용한다.

## 마이그레이션 규칙 (`scripts/ci/check-migrations.mjs`)

운영은 Dokploy 빌드 중에 마이그레이션을 적용하고, 자동 롤백은 없다. 그래서 다음이면 실패한다.

- journal과 `.sql` 파일이 맞지 않거나, 새 journal 항목의 `when`이 앞선 모든 항목보다 새롭지 않을 때
  (drizzle은 최신 DB에서 그 마이그레이션을 건너뛴다)
- base 브랜치에 이미 있는 마이그레이션을 고쳤을 때
- 새 마이그레이션이 테이블·컬럼·타입을 지우거나, TRUNCATE·DELETE를 하거나, 컬럼 타입을 바꿀 때.
  백업이 있을 때만 PR 라벨 `migration:destructive-ok`를 붙이고 실패한 CI 작업을 다시 실행한다(라벨을 붙여도
  새 실행이 시작되지 않는다).

이름 변경, `SET NOT NULL`, `NOT VALID` 없는 제약, 기존 테이블에 `CONCURRENTLY` 없는 인덱스는 경고만 한다.

## 처음 한 번 설정

1. **Dokploy.** API 키를 만든다(Settings → Profile → API). `official-website-nextjs` 앱의 **Auto Deploy를 끈다**.
   켜 두면 CI보다 먼저 push마다 바로 배포된다.
2. **GitHub → Settings → Environments → `production`.**
   - Secret `DOKPLOY_API_KEY`
   - Variables `DOKPLOY_URL`(Dokploy 패널 origin), `DOKPLOY_APPLICATION_ID`(`FYUWCshUbgtzPlWbQ3cIs`)
   - 선택: 필수 검토자를 지정해 배포마다 사람이 승인하게 할 수 있다.
3. **`main` 브랜치 보호.** PR과 상태 체크 **CI passed**를 필수로 한다.
4. **라벨.** `migration:destructive-ok`, Dependabot용 `dependencies`, `ci`를 만든다.

2단계 전까지 CD는 CI와 스모크 테스트만 돌리고 배포는 안내 메시지와 함께 건너뛴다.

## 수동 실행

- **Actions → CD → Run workflow**에서 _smoke-only_를 고르면 배포 없이 운영을 점검한다.
- `node scripts/ci/smoke-test.mjs https://gdgoc.yonsei.ac.kr`로 같은 검사를 로컬에서 돌린다. GET 요청만 보낸다.

## 배포 환경 메모

- Dokploy는 Nixpacks로 빌드한다(`nixpacks.toml`: Node 버전과 corepack 버전 고정 이유가 주석에 있다).
- 배포 빌드 명령은 `nixpacks.toml`의 `[phases.build]`에 있는 `pnpm build:production`
  (`drizzle-kit migrate && pnpm build`)이다. 마이그레이션은 **배포에서만** 적용된다.
- `pnpm build`는 `pnpm auth:prepare && next build`다. 마이그레이션은 하지 않지만 정적 경로를 만들려고 DB를 읽는다.
  `drizzle-kit generate`는 빌드에서 돌리지 않는다. 스키마와 커밋된 마이그레이션이 맞는지는 CI가 확인한다.
