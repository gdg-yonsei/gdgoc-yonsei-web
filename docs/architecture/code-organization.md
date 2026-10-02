# 코드 배치와 작성 규칙

새 코드를 어디에 두고 어떻게 쓰는지 정리한다. 처음 보는 사람이 다음 질문에 바로 답할 수 있게 하는 것이 목표다.

1. 이 코드는 어디에 두는가?
2. 공개/관리자 조회는 어디에 있는가?
3. 쓰기(비즈니스 규칙)는 어디에 있는가?
4. 외부 입력은 어디서 검증하는가?
5. 권한은 어디서 확인하는가?
6. 캐시 무효화는 어디에 정의되어 있는가?
7. 무엇이 클라이언트에서 돌고, 무엇이 서버 전용인가?

## 1. 배치 결정표

| 만들려는 것                         | 위치                                       | 비고                                                                         |
| ----------------------------------- | ------------------------------------------ | ---------------------------------------------------------------------------- |
| 한 라우트에서만 쓰는 UI             | 그 라우트 폴더(`_components/`, `_lib/`)    | 예: `app/(home)/[lang]/_components/home/`                                    |
| 여러 화면이 쓰는 UI                 | `app/components/{admin,site,header,auth}/` | 관리자 전용은 `admin/`, 공개 사이트는 `site/`                                |
| 공개 사이트 DB 조회                 | `lib/server/queries/public/`               | `'use cache: remote'` + 태그·수명. [`caching.md`](./caching.md)              |
| 관리자 DB 조회                      | `lib/server/fetcher/admin/`                | 캐시하지 않는다. 같은 요청 안 중복은 React `cache()`                         |
| 쓰기, 권한, 비즈니스 규칙           | `lib/server/services/admin/`               | `Actor`를 받고 `ServiceResult`를 돌려준다                                    |
| 관리자 폼 Server Action             | 라우트의 `actions.ts`                      | `runAdminFormAction` + 서비스 호출만. 5~10줄                                 |
| FormData → 서비스 입력 변환         | `lib/server/form-data/`                    | 검증은 서비스(zod)가 한다                                                    |
| 외부 입력 스키마(zod)               | `lib/validations/`                         | 도메인 전용이면 도메인 폴더에 둔다(예: `lib/mcp/tools/*`의 도구 입력 스키마) |
| 권한 규칙                           | `lib/server/permission/policy.ts`          | 역할 × 작업 × 리소스 표. 기수·대상 역할 규칙은 `services/admin/authorize.ts` |
| 캐시 태그·수명·무효화               | `lib/server/cache/`                        | 서비스는 `invalidation.ts`의 함수만 부른다                                   |
| R2 접근                             | `lib/server/storage/r2.ts`                 | 다른 곳에서 S3 클라이언트를 만들지 않는다                                    |
| MCP 도구                            | `lib/mcp/tools/`                           | zod 입력 → 서비스 호출 → 결과 변환만                                         |
| 순수 도메인 함수(클라이언트도 사용) | `lib/site/`, `lib/format/`, `lib/i18n/`    | `server-only`·DB import 금지                                                 |
| 공개 사이트 문구                    | `lib/contents/`                            | `Record<Locale, …>` 모양. 클라이언트에는 현재 언어 것만 넘긴다               |
| 관리자 화면 문구                    | `lib/admin-i18n/messages/{en,ko}.ts`       | 키를 추가하면 두 파일 모두. 타입이 강제한다                                  |
| 환경 변수                           | `lib/server/env-core.ts`의 `get*Env()`     | `process.env`를 직접 읽지 않는다                                             |
| DB 테이블                           | `db/schema/*.ts` + `pnpm db:generate`      | 마이그레이션 SQL은 손으로 고치지 않는다                                      |
| 스크립트(CI·시드·측정)              | `scripts/`                                 | 파괴적인 스크립트는 `assertDisposableDatabase` 필수                          |

## 2. 의존 방향과 경계

```text
app ──► lib ──► db
         │
         └──► lib/site, lib/format, lib/i18n (순수, 어디서나 사용)
```

- `lib/**`, `db/**`는 `@/app/*`를 import할 수 없다(ESLint `no-restricted-imports`).
- 서버 전용 모듈은 맨 위에 `import 'server-only'`를 둔다. 클라이언트 번들에 들어가면 빌드가 실패한다.
  - 예외: `lib/server/env-core.ts`, `lib/server/cache/policy.ts`, `lib/server/cache/tags.ts`는 `next.config.ts`나
    tsx 스크립트(시드, e2e)가 import하므로 붙이지 않는다. 앱 코드에서는 `lib/server/env.ts`를 쓴다.
- 클라이언트 컴포넌트에는 필요한 값만 props로 넘긴다. 큰 사전·DB 행 전체를 넘기면 RSC payload와 번들이 커진다.

## 3. 쓰기 흐름의 표준 모양

```ts
// app/(admin)/admin/parts/create/actions.ts
'use server'

export async function createPartAction(
  _prev: AdminFormState,
  formData: FormData
) {
  return runAdminFormAction({
    run: async (actor) => {
      const input = parsePartForm(formData)
      const scope = await requireCreationScope(actor, input.generationId)
      return scope.ok ? createPart(actor, input) : scope
    },
    redirectTo: '/admin/parts',
  })
}
```

서비스 함수(`lib/server/services/admin/parts.ts`)의 순서:

1. `authorize(actor, action, resource, ownerId?)` — 스코프와 역할
2. 기수 접근(`canAccessGeneration`) 같은 표 밖 규칙
3. zod로 입력 검증 → 실패하면 `fail('VALIDATION', …, fieldErrorsFromZod(error))`
4. `db.transaction`으로 행과 관계 행을 함께 쓴다
5. `invalidate*PublicCache(...)`로 공개 캐시 무효화
6. 외부 부수효과(R2 삭제, 메일)는 `runAfterResponse`로 커밋 뒤에
7. `ok(data)` 또는 `fail(code, message)`

`ServiceResult`의 실패 코드는 웹에서는 폼 오류/redirect(`runAdminFormAction`), API에서는 HTTP 상태
(`serviceFailureResponse`), MCP에서는 도구 오류로 바뀐다.

## 4. React와 Next.js 규칙

- **서버 컴포넌트가 기본**이다. 상태·이벤트·브라우저 API가 필요할 때만 `'use client'`를 붙인다.
- **React Compiler가 켜져 있으므로** `useMemo`/`useCallback`/`React.memo`를 쓰지 않는다.
  effect 안에서 최신 콜백이 필요하면 `useEffectEvent`를 쓴다(`lib/hooks/use-dialog-focus.ts` 참고).
- 폼은 `DataForm`(`useActionState`) + Server Action. 제출 중 표시는 `useFormStatus`.
- 페이지 데이터는 서버에서 읽고, 느린 부분은 `<Suspense>`로 감싸 스트리밍한다. 공개 사이트의 정적 셸은
  `params`를 읽지 않는 부분과 읽는 부분을 나눠 둔다(`ArchiveHubShell`).
- 링크 경로는 `lib/site/routes.ts`(`localeHref`, `sessionPath` …)로 만든다. 관리자 경로는 `localizeAdminHref`.
- Next 16의 새 API를 쓰기 전에 `node_modules/next/dist/docs/`의 해당 문서를 확인한다(AGENTS.md).

## 5. 이름과 export

- `lib/**`, `db/**`: **named export만** 쓴다.
- React 컴포넌트 파일: 주 컴포넌트 하나를 **default export**한다. 같이 쓰는 작은 하위 컴포넌트는 named export.
- Next 특수 파일(`page`, `layout`, `route`, `opengraph-image` …)은 Next 규칙을 따른다.
- 파일 이름은 kebab-case, 컴포넌트는 PascalCase, 훅은 `use`로 시작한다.
- 도메인 용어를 그대로 쓴다: 기수(generation), 파트(part), 세션(session), 프로젝트(project), 멤버(member),
  범위(scope), 행위자(actor).

## 6. 주석 규칙

- 모든 파일 맨 위에 한국어 `/** … */` 헤더: 이 파일의 역할, 어디서 쓰이는지, 서버/클라이언트 경계, 주의점.
- 모든 export에 한국어 JSDoc: 매개변수·반환값의 의미와 부수효과(DB 쓰기, 캐시 무효화, R2, 메일).
- 코드를 그대로 읽어 주는 주석은 쓰지 않는다. "왜"를 적는다(비즈니스 규칙, 성능·캐시 결정, 브라우저 버그 회피).
- 과거 이야기("예전에는 …였다")가 아니라 현재의 의도를 적는다.
- 예외: GLSL 셰이더 문자열 안의 주석은 영어(ASCII)로 둔다. 일부 GPU 드라이버가 ASCII가 아닌 소스를 거부한다.
- 이름으로 설명할 수 있으면 주석보다 이름을 고친다.

## 7. 스타일과 CSS

- Tailwind 4. 관리자 화면은 `app/globals.css`의 토큰과 `admin-*` 유틸리티, 공개 사이트는 `app/styles/site-*.css`.
- 클래스 조합은 `cn()`(clsx + tailwind-merge). 단, 서로 충돌하는 색 클래스를 일부러 겹치는 경우(로딩 스피너)는 쓰지 않는다.
- 홈 전용 CSS(`site-home.css`)는 홈 페이지만 import한다. 전역 CSS에 넣지 않는다(테스트가 확인).
- 서식은 Prettier(`pnpm format`). CI는 PR에서 바뀐 파일만 검사한다. `app/pretendard.css`는 외부 배포본이라 제외.

## 8. 테스트 배치

| 대상                                | 위치                           | 도구                             |
| ----------------------------------- | ------------------------------ | -------------------------------- |
| 순수 함수(경로, 필터, 포매터, 정책) | `tests/lib/**`                 | Vitest                           |
| 서비스(권한·검증·트랜잭션)          | `tests/lib/server/services/**` | Vitest + DB 모의                 |
| 컴포넌트                            | `tests/components/**`          | Testing Library                  |
| 사용자 흐름                         | `tests/e2e/**`                 | Playwright(일회용 Postgres 필요) |

`vitest.setup.ts`는 `next/server`의 `after`를 즉시 실행하도록 모의한다. 날짜에 의존하는 테스트는
`vi.setSystemTime`으로 시간을 고정한다.

## 9. 추출 기준

함수나 컴포넌트를 뽑아낼 때:

- 뽑는다: 바뀌는 이유가 다를 때, 의미 있는 비즈니스 규칙일 때, 따로 테스트할 수 있을 때, 실제로 재사용될 때,
  인프라를 격리할 때, 읽는 부담이 크게 줄 때.
- 뽑지 않는다: 줄 수가 길다는 이유만으로, JSX가 커 보여서, 그럴듯한 이름이 떠올라서, 한 번만 쓰이고 흐름을
  더 따라가기 어렵게 만들 때.
