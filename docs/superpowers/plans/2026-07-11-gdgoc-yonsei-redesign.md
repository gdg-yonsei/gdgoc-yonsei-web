# GDGoC Yonsei Visual Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 홈·전역 크롬 전면 리디자인 + Activity Heatmap 시그니처 + `/[lang]/about` 신설 + motion(LazyMotion) 애니메이션 시스템 + 스키마 확장(sessions.category, projects.repoUrl/demoUrl) + 로컬 시드.

**Architecture:** Next.js 16(App Router, `cacheComponents: true`) 서버 컴포넌트가 `'use cache: remote'` 쿼리로 데이터를 조회해 직렬화하고, 애니메이션은 `'use client'` island(`m.*` + LazyMotion/domAnimation)에 국한한다. 시각 토큰은 Tailwind v4 `@theme`(globals.css)이 정본이다. 스펙: `docs/superpowers/specs/2026-07-11-gdgoc-yonsei-redesign-design.md`.

**Tech Stack:** Next 16.2 / React 19.2 / Tailwind v4 / drizzle-orm+postgres / motion 12 / vitest+RTL / Playwright.

## Global Constraints

- 작업 디렉토리(항상 여기서 실행): `/config/workspace/gdgoc-yonsei-web/.claude/worktrees/visual-redesign` (브랜치 `worktree-visual-redesign`)
- 패키지 매니저 **pnpm** (Node >=20 <=24). `pnpm build`는 `drizzle-kit generate && drizzle-kit migrate && next build`라서 **로컬 Postgres(.env의 AUTH_DRIZZLE_URL) 필요**.
- 시맨틱 토큰(정확값): `--surface: #f6f7fb`, `--surface-raised: #ffffff`, `--ink: #0b1220`, `--yonsei-blue: #1b3a75`. 기존 `--color-gdg-*` 토큰 삭제 금지.
- 카테고리 enum 값(정확히 이 5개): `tech_talk`, `part_session`, `hackathon`, `demo_day`, `devrel`. pgEnum 이름: `activityCategory`.
- 히트맵 색 매핑: tech_talk→`bg-gdg-blue-300`, part_session→`bg-gdg-green-300`, hackathon→`bg-gdg-red-300`, demo_day→`bg-yonsei-blue`, devrel→`bg-gdg-yellow-300`. 동률 우선순위: hackathon > demo_day > tech_talk > part_session > devrel. 농도: 1건 0.45 / 2건 0.7 / 3건+ 1.0 (opacity).
- 애니메이션: 신규 클라이언트 컴포넌트는 전부 `m.*`(LazyMotion). transform/opacity만 애니메이션. box-shadow/width/height/top/left 애니메이션 금지. `backdrop-filter: blur`는 헤더 한정. 모든 모션에 `useReducedMotion()` 분기.
- 스크롤 리빌 통일: `whileInView` + `viewport={{ once: true, margin: '-10% 0px' }}`.
- 카피는 전부 en/ko 이중 언어. `Locale` 타입은 `@/i18n-config`.
- 각 태스크 완료 시 커밋. 태스크 14·16 이후에는 `pnpm build`도 실행.
- 기존 파일 중 삭제 금지: `app/(home)/[lang]/activity-card.tsx`, `app/components/show-more-content.tsx`, `app/components/svg/**`, `app/fonts/google-sans.woff2`.
- 테스트 실행: `pnpm test`(vitest), `pnpm test:types`(tsc). 개별 파일: `pnpm vitest run <path>`.

## File Structure (신규/수정 지도)

```
app/fonts/pretendard-variable.woff2            (new, Task 1)
app/fonts/jetbrains-mono-variable.woff2        (new, Task 1)
app/(home)/[lang]/layout.tsx                   (modify: fonts Task 1, colors Task 2, provider Task 9)
app/globals.css                                (modify: fonts Task 1, tokens Task 2, heatmap CSS Task 11, cleanup Task 16)
db/schema/sessions.ts                          (modify Task 3: category enum)
db/schema/projects.ts                          (modify Task 3: repoUrl/demoUrl)
drizzle/00XX_*.sql                             (generated+backfill Task 3)
lib/validations/session.ts                     (modify Task 4)
lib/server/form-data/get-session-form-data.ts  (modify Task 4)
app/(admin)/admin/sessions/{create,[sessionId]/edit}/{page,actions}.tsx|ts (modify Task 4)
lib/validations/project.ts                     (modify Task 5)
lib/server/form-data/get-project-form-data.ts  (modify Task 5)
app/(admin)/admin/projects/{create,[projectId]/edit}/{page,actions}.tsx|ts (modify Task 5)
lib/heatmap.ts                                 (new Task 6: 주 버킷팅·색·우선순위·opacity)
lib/server/queries/public/home.ts              (new Task 7: 쿼리 4종)
scripts/seed/helpers.ts + scripts/seed-dev.ts  (new Task 8)
app/components/motion/lazy-motion-provider.tsx (new Task 9)
app/components/motion/reveal.tsx               (new Task 9)
app/(home)/[lang]/template.tsx                 (new Task 9: enter fade)
vitest.setup.ts                                (modify Task 9: motion mock 확장)
app/components/home/starfield-canvas.tsx       (new Task 10)
app/components/home/hero.tsx                   (new Task 10)
app/components/home/activity-heatmap.tsx       (new Task 11)
lib/contents/parts-section.ts                  (modify Task 12: bentoParts named export 추가)
app/components/home/parts-bento-grid.tsx       (new Task 12)
app/components/home/projects-showcase.tsx      (new Task 13)
app/components/home/about-teaser.tsx           (new Task 14)
app/(home)/[lang]/page.tsx                     (rewrite Task 14)
lib/contents/about-page.ts                     (new Task 15)
app/components/about/*.tsx                     (new Task 15: hero/story/programs/timeline/stats/parts-deepdive)
app/(home)/[lang]/about/page.tsx               (new Task 15)
lib/server/queries/public/sitemap.ts           (modify Task 15: /about 추가)
tests/e2e/public-route-matrix.spec.ts          (modify Task 15: /about 라우트)
app/components/header/*, app/components/footer.tsx (modify Task 16)
삭제(Task 16): app/(home)/[lang]/{welcome-page,about-page,activities-page,parts-page,activities-list,part-card,home-page-background}.tsx
```

실행 순서는 아래 태스크 번호 순서 그대로다(스펙 §13: Phase 1 → 4 → 2 → 3 → 5 → 6에 대응).

---

### Task 1: 폰트 self-host (Pretendard Variable + JetBrains Mono Variable)

**Files:**
- Create: `app/fonts/pretendard-variable.woff2`, `app/fonts/jetbrains-mono-variable.woff2` (npm 패키지에서 복사)
- Modify: `app/(home)/[lang]/layout.tsx` (googleSans 제거, 두 폰트 등록)
- Modify: `app/globals.css` (`@theme inline` 폰트 매핑)
- Modify: `package.json` (devDeps: pretendard, @fontsource-variable/jetbrains-mono)

**Interfaces:**
- Produces: CSS 변수 `--font-pretendard`, `--font-jetbrains-mono`; Tailwind 유틸 `font-sans`(Pretendard), `font-mono`(JetBrains Mono). 이후 모든 태스크가 `font-mono`를 데이터 라벨에 사용.

- [ ] **Step 1: 패키지 설치 및 woff2 복사**

```bash
pnpm add -D pretendard @fontsource-variable/jetbrains-mono
cp node_modules/pretendard/dist/web/variable/woff2/PretendardVariable.woff2 app/fonts/pretendard-variable.woff2
cp node_modules/@fontsource-variable/jetbrains-mono/files/jetbrains-mono-latin-wght-normal.woff2 app/fonts/jetbrains-mono-variable.woff2
ls -la app/fonts/
```

Expected: `app/fonts/`에 `google-sans.woff2`(기존 유지) + 신규 woff2 2개. 만약 pretendard 패키지 경로가 다르면 `find node_modules/pretendard -name '*.woff2' | grep -i variable`로 실제 경로 확인 후 복사.

- [ ] **Step 2: layout.tsx 폰트 교체**

`app/(home)/[lang]/layout.tsx`에서 `googleSans` 선언 블록(주석 `// Google Product Sans 폰트` 포함)을 아래로 교체:

```tsx
// 본문 서체: Pretendard Variable (self-hosted)
const pretendard = localFont({
  src: '../../fonts/pretendard-variable.woff2',
  display: 'swap',
  variable: '--font-pretendard',
  weight: '45 920',
})

// 데이터·라벨 서체: JetBrains Mono Variable (self-hosted)
const jetbrainsMono = localFont({
  src: '../../fonts/jetbrains-mono-variable.woff2',
  display: 'swap',
  variable: '--font-jetbrains-mono',
  weight: '100 800',
})
```

그리고 `<html>` className을 다음으로 교체(색상 클래스는 Task 2에서 다시 바꿈):

```tsx
className={`text-gdg-black bg-neutral-50 font-sans ${pretendard.variable} ${jetbrainsMono.variable}`}
```

- [ ] **Step 3: globals.css에 @theme inline 폰트 매핑 추가**

`app/globals.css`의 기존 `@theme { --color-logo-blue: ... }` 블록 **바로 아래**에 추가:

```css
@theme inline {
  --font-sans:
    var(--font-pretendard), 'Pretendard Variable', 'Apple SD Gothic Neo',
    'Noto Sans KR', system-ui, sans-serif;
  --font-mono:
    var(--font-jetbrains-mono), 'JetBrains Mono', ui-monospace, SFMono-Regular,
    Menlo, monospace;
}
```

- [ ] **Step 4: 검증**

```bash
pnpm test:types && pnpm test
grep -rn "googleSans\|google-sans" app --include='*.tsx' --include='*.ts'
```

Expected: tsc 통과, vitest 182+ 전부 통과, grep 결과 없음(woff2 파일 자체는 grep 대상 아님).

- [ ] **Step 5: Commit**

```bash
git add app/fonts app/globals.css "app/(home)/[lang]/layout.tsx" package.json pnpm-lock.yaml
git commit -m "feat: self-host Pretendard and JetBrains Mono variable fonts"
```

---

### Task 2: 시맨틱 컬러 토큰 + 베이스 스타일

**Files:**
- Modify: `app/globals.css`
- Modify: `app/(home)/[lang]/layout.tsx` (html 색상 클래스)

**Interfaces:**
- Produces: Tailwind 유틸 `bg-surface`, `bg-surface-raised`, `text-ink`, `text-yonsei-blue`, `bg-yonsei-blue`, `border-ink/10` 등 + 전역 `:focus-visible` 링 + `.cv-auto` 유틸. 이후 모든 UI 태스크가 사용.

- [ ] **Step 1: 토큰 추가**

`app/globals.css` 최상단 `@plugin` 줄 바로 아래에 추가:

```css
:root {
  --surface: #f6f7fb;
  --surface-raised: #ffffff;
  --ink: #0b1220;
  --yonsei-blue: #1b3a75;
}
```

Task 1에서 만든 `@theme inline` 블록 안에 폰트 변수 아래로 추가:

```css
  --color-surface: var(--surface);
  --color-surface-raised: var(--surface-raised);
  --color-ink: var(--ink);
  --color-yonsei-blue: var(--yonsei-blue);
```

- [ ] **Step 2: 베이스 포커스 링 + content-visibility 유틸 추가**

`@layer utilities` 블록 안(`.no-scrollbar` 아래)에 추가:

```css
  .cv-auto {
    content-visibility: auto;
    contain-intrinsic-size: auto 640px;
  }
```

파일 끝(shooting-star CSS 위 아무 곳)에 추가:

```css
@layer base {
  :focus-visible {
    outline: 2px solid var(--yonsei-blue);
    outline-offset: 2px;
  }
}
```

- [ ] **Step 3: html 클래스 교체**

`app/(home)/[lang]/layout.tsx`의 html className에서 `text-gdg-black bg-neutral-50` → `bg-surface text-ink`:

```tsx
className={`bg-surface text-ink font-sans ${pretendard.variable} ${jetbrainsMono.variable}`}
```

- [ ] **Step 4: 검증**

```bash
pnpm test:types && pnpm test
```

Expected: 전부 통과.

- [ ] **Step 5: Commit**

```bash
git add app/globals.css "app/(home)/[lang]/layout.tsx"
git commit -m "feat: add semantic color tokens, focus ring, and cv-auto utility"
```

---

### Task 3: 스키마 확장 — sessions.category + projects.repoUrl/demoUrl + 마이그레이션·backfill

**Files:**
- Modify: `db/schema/sessions.ts`, `db/schema/projects.ts`
- Create(generated): `drizzle/00XX_*.sql` (backfill UPDATE 추가)

**Interfaces:**
- Produces: `activityCategoryEnum`(export, `db/schema/sessions.ts`), `sessions.category`(notNull, default `'tech_talk'`), `projects.repoUrl: string | null`, `projects.demoUrl: string | null`. Task 4·5·7·8이 소비.

- [ ] **Step 1: sessions 스키마에 enum + 컬럼 추가**

`db/schema/sessions.ts`의 `sessionTypeEnum` 선언 아래에 추가:

```ts
export const activityCategoryEnum = pgEnum('activityCategory', [
  'tech_talk',
  'part_session',
  'hackathon',
  'demo_day',
  'devrel',
])
```

`sessions` 테이블 정의의 `type: sessionTypeEnum('type').default('Part Session'),` 줄 아래에 추가:

```ts
  category: activityCategoryEnum('category').notNull().default('tech_talk'),
```

- [ ] **Step 2: projects 스키마에 URL 컬럼 추가**

`db/schema/projects.ts`의 `images: jsonb('images')...` 줄 아래에 추가:

```ts
  repoUrl: text('repoUrl'),
  demoUrl: text('demoUrl'),
```

- [ ] **Step 3: 마이그레이션 생성 + backfill 추가**

```bash
pnpm db:generate
ls -t drizzle/*.sql | head -1
```

Expected: 새 `drizzle/00XX_<이름>.sql` 생성(CREATE TYPE + ALTER TABLE 3건). 그 파일 **끝**에 backfill을 덧붙인다:

```sql
--> statement-breakpoint
UPDATE "sessions" SET "category" = 'part_session' WHERE "type" = 'Part Session';
```

- [ ] **Step 4: 마이그레이션 적용 + 확인**

```bash
pnpm db:migrate
```

Expected: 에러 없이 완료. (로컬 DB 필요 — 실패 시 docker compose 등으로 Postgres 기동 후 재시도.)

- [ ] **Step 5: 타입·테스트 확인 후 커밋**

```bash
pnpm test:types && pnpm test
git add db/schema/sessions.ts db/schema/projects.ts drizzle
git commit -m "feat: add session activity category enum and project repo/demo URL columns"
```

---

### Task 4: 세션 category 배선 — zod·form-data·어드민 폼·액션

**Files:**
- Modify: `lib/validations/session.ts`, `lib/server/form-data/get-session-form-data.ts`
- Modify: `app/(admin)/admin/sessions/create/page.tsx`, `app/(admin)/admin/sessions/create/actions.ts`
- Modify: `app/(admin)/admin/sessions/[sessionId]/edit/page.tsx`, `app/(admin)/admin/sessions/[sessionId]/edit/actions.ts`
- Create: `tests/lib/validations/session-category.test.ts`
- Modify(필요 시): `tests/lib/validations/validations.test.ts`, `tests/lib/server/admin-actions-crud/sessions.test.ts`, `tests/lib/server/form-data/form-data.test.ts`

**Interfaces:**
- Consumes: Task 3의 `sessions.category` 컬럼.
- Produces: `sessionValidation`에 필수 필드 `category`(z.enum 5종), `getSessionFormData()` 반환에 `category: 'tech_talk' | 'part_session' | 'hackathon' | 'demo_day' | 'devrel'`(폼값 없거나 불량이면 `'tech_talk'` 폴백). 어드민 폼 name은 `category`.

- [ ] **Step 1: 실패하는 테스트 작성**

Create `tests/lib/validations/session-category.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { sessionValidation } from '@/lib/validations/session'

const baseSession = {
  name: 'T19 Week 1',
  nameKo: 'T19 1주차',
  description: 'desc',
  descriptionKo: '설명',
  mainImage: null,
  contentImages: [],
  location: 'Engineering Hall',
  locationKo: '공학원',
  maxCapacity: 30,
  internalOpen: true,
  publicOpen: false,
  startAt: new Date('2026-03-03T10:00:00Z'),
  endAt: new Date('2026-03-03T12:00:00Z'),
  partId: '1',
  participantId: ['user-1'],
  type: 'General Session' as const,
  displayOnWebsite: true,
}

describe('sessionValidation category', () => {
  it('accepts every activity category', () => {
    const categories = [
      'tech_talk',
      'part_session',
      'hackathon',
      'demo_day',
      'devrel',
    ] as const
    for (const category of categories) {
      expect(() =>
        sessionValidation.parse({ ...baseSession, category })
      ).not.toThrow()
    }
  })

  it('rejects an unknown category', () => {
    expect(() =>
      sessionValidation.parse({ ...baseSession, category: 'workshop' })
    ).toThrow()
  })

  it('rejects a missing category', () => {
    expect(() => sessionValidation.parse(baseSession)).toThrow()
  })
})
```

- [ ] **Step 2: 실패 확인**

Run: `pnpm vitest run tests/lib/validations/session-category.test.ts`
Expected: FAIL — `rejects an unknown category`와 `rejects a missing category`가 실패(현재 zod가 category 키를 모름 → strip 후 통과해버림).

- [ ] **Step 3: zod 스키마 구현**

`lib/validations/session.ts`의 `const SessionTypeEnum = ...` 아래에 추가:

```ts
const ActivityCategoryEnum = z.enum([
  'tech_talk',
  'part_session',
  'hackathon',
  'demo_day',
  'devrel',
])
```

`type: SessionTypeEnum,` 줄 아래에 필드 추가:

```ts
    category: ActivityCategoryEnum,
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `pnpm vitest run tests/lib/validations/session-category.test.ts`
Expected: PASS (3 tests)

- [ ] **Step 5: form-data 확장**

`lib/server/form-data/get-session-form-data.ts` 상단(함수 밖)에 추가:

```ts
const ACTIVITY_CATEGORIES = [
  'tech_talk',
  'part_session',
  'hackathon',
  'demo_day',
  'devrel',
] as const

export type ActivityCategoryFormValue = (typeof ACTIVITY_CATEGORIES)[number]
```

반환 타입 주석 객체에 `category: ActivityCategoryFormValue` 추가. 함수 본문의 `const type = ...` 근처에 추가:

```ts
  const rawCategory = formData.get('category')
  const category: ActivityCategoryFormValue = ACTIVITY_CATEGORIES.includes(
    rawCategory as ActivityCategoryFormValue
  )
    ? (rawCategory as ActivityCategoryFormValue)
    : 'tech_talk'
```

return 객체에 `category,` 추가.

- [ ] **Step 6: 액션·폼 배선**

`app/(admin)/admin/sessions/create/actions.ts`:
1. `getSessionFormData(formData)` 구조 분해에 `category,` 추가.
2. `sessionValidation.parse({ ... })` 페이로드에 `category,` 추가.
3. `db.insert(sessions).values({ ... })`에 `category: category,` 추가(`type: type,` 줄 옆).

`app/(admin)/admin/sessions/[sessionId]/edit/actions.ts` (update 액션 — create와 동일 패턴): 구조 분해·validation 페이로드·`.set({ ... })` 객체 3곳에 `category` 추가.

`app/(admin)/admin/sessions/create/page.tsx` — 기존 `DataSelectInput ... name={'type'}` 블록 **바로 아래**에 추가:

```tsx
        <DataSelectInput
          data={[
            { name: 'Tech Talk (T19)', value: 'tech_talk' },
            { name: 'Part Session', value: 'part_session' },
            { name: 'Hackathon', value: 'hackathon' },
            { name: 'Demo Day', value: 'demo_day' },
            { name: 'DevRel / Social', value: 'devrel' },
          ]}
          name={'category'}
          title={'Activity Category'}
          defaultValue={'tech_talk'}
        />
```

`app/(admin)/admin/sessions/[sessionId]/edit/page.tsx` — 같은 위치(기존 `name={'type'}` select 아래)에 동일 블록을 추가하되 `defaultValue={sessionData.category ?? 'tech_talk'}` (edit 페이지가 세션을 담는 변수명을 그대로 사용 — `grep -n "type\b.*DataSelectInput\|defaultValue={.*type" "app/(admin)/admin/sessions/[sessionId]/edit/page.tsx"`로 확인).

- [ ] **Step 7: 전체 테스트 실행 + 기존 픽스처 갱신**

Run: `pnpm test`
Expected: `sessionValidation.parse(...)`를 객체 리터럴로 호출하는 기존 테스트(`tests/lib/validations/validations.test.ts` 등)가 category 누락으로 FAIL할 수 있음 → 해당 페이로드마다 `category: 'tech_talk',` 추가. 어드민 액션 테스트가 insert/update 인자를 정확 비교하면 기대 객체에도 `category: 'tech_talk'` 추가. FormData 기반 테스트는 폴백 덕에 자동 통과. 최종적으로 `pnpm test && pnpm test:types` 전부 PASS.

- [ ] **Step 8: Commit**

```bash
git add lib/validations/session.ts lib/server/form-data/get-session-form-data.ts "app/(admin)/admin/sessions" tests
git commit -m "feat: wire session activity category through validation and admin forms"
```

---

### Task 5: 프로젝트 repoUrl/demoUrl 배선 — zod·form-data·어드민 폼·액션

**Files:**
- Modify: `lib/validations/project.ts`, `lib/server/form-data/get-project-form-data.ts`
- Modify: `app/(admin)/admin/projects/create/page.tsx`, `app/(admin)/admin/projects/create/actions.ts`
- Modify: `app/(admin)/admin/projects/[projectId]/edit/page.tsx`, `app/(admin)/admin/projects/[projectId]/edit/actions.ts`
- Create: `tests/lib/validations/project-urls.test.ts`

**Interfaces:**
- Consumes: Task 3의 `projects.repoUrl/demoUrl`.
- Produces: `projectValidation`에 `repoUrl`/`demoUrl`(`z.string().trim().url().nullable()`), `getProjectFormData()` 반환에 `repoUrl: string | null`/`demoUrl: string | null`(빈 문자열→null). 폼 name: `repoUrl`, `demoUrl`.

- [ ] **Step 1: 실패하는 테스트 작성**

Create `tests/lib/validations/project-urls.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { projectValidation } from '@/lib/validations/project'

const baseProject = {
  name: 'Campus Compass',
  nameKo: '캠퍼스 나침반',
  description: 'desc',
  descriptionKo: '설명',
  content: 'content',
  contentKo: '내용',
  mainImage: '/project-default.png',
  contentImages: ['/img-1.png'],
  participants: ['user-1'],
  generationId: '1',
}

describe('projectValidation urls', () => {
  it('accepts null repo/demo urls', () => {
    expect(() =>
      projectValidation.parse({ ...baseProject, repoUrl: null, demoUrl: null })
    ).not.toThrow()
  })

  it('accepts valid https urls', () => {
    expect(() =>
      projectValidation.parse({
        ...baseProject,
        repoUrl: 'https://github.com/gdg-yonsei/web',
        demoUrl: 'https://gdgoc.yonsei.ac.kr',
      })
    ).not.toThrow()
  })

  it('rejects a malformed url', () => {
    expect(() =>
      projectValidation.parse({
        ...baseProject,
        repoUrl: 'not-a-url',
        demoUrl: null,
      })
    ).toThrow()
  })
})
```

- [ ] **Step 2: 실패 확인**

Run: `pnpm vitest run tests/lib/validations/project-urls.test.ts`
Expected: FAIL — `accepts null...`(키 없음으로 통과하지만 null 명시 시 strip이라 통과함) 중 `rejects a malformed url`이 실패.

- [ ] **Step 3: 구현**

`lib/validations/project.ts`의 `generationId:` 필드 아래에 추가:

```ts
  repoUrl: z.string().trim().url('Repository URL must be a valid URL').nullable(),
  demoUrl: z.string().trim().url('Demo URL must be a valid URL').nullable(),
```

`lib/server/form-data/get-project-form-data.ts` 함수 밖에 헬퍼 추가:

```ts
function getNullableUrl(formData: FormData, key: string): string | null {
  const value = formData.get(key)
  if (typeof value !== 'string') {
    return null
  }
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}
```

반환 타입에 `repoUrl: string | null` / `demoUrl: string | null` 추가, 본문에:

```ts
  const repoUrl = getNullableUrl(formData, 'repoUrl')
  const demoUrl = getNullableUrl(formData, 'demoUrl')
```

return 객체에 `repoUrl, demoUrl,` 추가.

- [ ] **Step 4: 테스트 통과 확인**

Run: `pnpm vitest run tests/lib/validations/project-urls.test.ts`
Expected: PASS (3 tests)

- [ ] **Step 5: 액션·폼 배선**

`app/(admin)/admin/projects/create/actions.ts`: 구조 분해에 `repoUrl, demoUrl` 추가 → `projectValidation.parse({...})`에 추가 → `db.insert(projects).values({...})`에 `repoUrl: repoUrl, demoUrl: demoUrl,` 추가.

`app/(admin)/admin/projects/[projectId]/edit/actions.ts`: 동일 3곳(`.set({...})`).

`app/(admin)/admin/projects/create/page.tsx`: import 추가 `import DataInput from '@/app/components/admin/data-input'`, `BilingualTextareaField`(description) 블록 아래에:

```tsx
        <DataInput
          title={'Repository URL'}
          defaultValue={null}
          name={'repoUrl'}
          placeholder={'https://github.com/gdg-yonsei/...'}
          type={'url'}
        />
        <DataInput
          title={'Demo URL'}
          defaultValue={null}
          name={'demoUrl'}
          placeholder={'https://...'}
          type={'url'}
        />
```

edit 페이지도 동일 블록에 `defaultValue={projectData.repoUrl}` / `defaultValue={projectData.demoUrl}` (edit 페이지의 프로젝트 데이터 변수명을 grep으로 확인해 맞춤).

- [ ] **Step 6: 전체 테스트 + 픽스처 갱신**

Run: `pnpm test && pnpm test:types`
Expected: `projectValidation.parse` 객체 리터럴 픽스처들이 FAIL하면 `repoUrl: null, demoUrl: null` 추가. 최종 전부 PASS.

- [ ] **Step 7: Commit**

```bash
git add lib/validations/project.ts lib/server/form-data/get-project-form-data.ts "app/(admin)/admin/projects" tests
git commit -m "feat: wire project repo/demo URLs through validation and admin forms"
```

---

### Task 6: `lib/heatmap.ts` — 주 버킷팅·색·우선순위·opacity (TDD)

**Files:**
- Create: `lib/heatmap.ts`
- Test: `tests/lib/heatmap.test.ts`

**Interfaces:**
- Produces (이후 태스크가 그대로 소비하는 시그니처):
  - `ACTIVITY_CATEGORIES`, `type ActivityCategory`
  - `CATEGORY_PRIORITY: readonly ActivityCategory[]`
  - `CATEGORY_CELL_CLASS: Record<ActivityCategory, string>`, `CATEGORY_LABEL: Record<ActivityCategory, { en: string; ko: string }>`
  - `HEATMAP_WEEKS = 52`, `WEEK_MS`
  - `type HeatmapSessionInput = { id: string; name: string; nameKo: string; startAt: string; category: ActivityCategory; participantCount: number }`
  - `type HeatmapWeek = { weekKey: string; weekStartIso: string; count: number; dominantCategory: ActivityCategory | null; sessions: HeatmapSessionInput[] }`
  - `startOfWeekUtc(date: Date): Date`, `buildHeatmapWeeks(sessions, reference): HeatmapWeek[]`, `dominantCategoryOf(sessions): ActivityCategory | null`, `intensityOpacity(count: number): number`

- [ ] **Step 1: 실패하는 테스트 작성**

Create `tests/lib/heatmap.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import {
  buildHeatmapWeeks,
  dominantCategoryOf,
  HEATMAP_WEEKS,
  intensityOpacity,
  startOfWeekUtc,
  type HeatmapSessionInput,
} from '@/lib/heatmap'

function makeSession(
  overrides: Partial<HeatmapSessionInput>
): HeatmapSessionInput {
  return {
    id: 's-1',
    name: 'Session',
    nameKo: '세션',
    startAt: '2026-07-07T10:00:00.000Z',
    category: 'tech_talk',
    participantCount: 10,
    ...overrides,
  }
}

const REFERENCE = new Date('2026-07-11T09:00:00.000Z') // 토요일

describe('startOfWeekUtc', () => {
  it('returns Monday 00:00 UTC for a mid-week date', () => {
    expect(
      startOfWeekUtc(new Date('2026-07-11T09:00:00.000Z')).toISOString()
    ).toBe('2026-07-06T00:00:00.000Z')
  })

  it('keeps Monday in its own week and Sunday in the previous week', () => {
    expect(
      startOfWeekUtc(new Date('2026-07-06T00:00:00.000Z')).toISOString()
    ).toBe('2026-07-06T00:00:00.000Z')
    expect(
      startOfWeekUtc(new Date('2026-07-05T23:59:59.000Z')).toISOString()
    ).toBe('2026-06-29T00:00:00.000Z')
  })
})

describe('buildHeatmapWeeks', () => {
  it('always returns 52 weeks, oldest first, ending at the reference week', () => {
    const weeks = buildHeatmapWeeks([], REFERENCE)
    expect(weeks).toHaveLength(HEATMAP_WEEKS)
    expect(weeks[51]!.weekKey).toBe('2026-07-06')
    expect(weeks[0]!.weekKey).toBe('2025-07-14')
    expect(
      weeks.every((week) => week.count === 0 && week.dominantCategory === null)
    ).toBe(true)
  })

  it('buckets sessions into their UTC week', () => {
    const weeks = buildHeatmapWeeks(
      [
        makeSession({ id: 'a', startAt: '2026-07-06T00:00:00.000Z' }),
        makeSession({ id: 'b', startAt: '2026-07-05T23:00:00.000Z' }),
      ],
      REFERENCE
    )
    expect(weeks[51]!.sessions.map((session) => session.id)).toEqual(['a'])
    expect(weeks[50]!.sessions.map((session) => session.id)).toEqual(['b'])
  })

  it('ignores sessions outside the 52-week window', () => {
    const weeks = buildHeatmapWeeks(
      [makeSession({ startAt: '2024-01-01T00:00:00.000Z' })],
      REFERENCE
    )
    expect(weeks.reduce((sum, week) => sum + week.count, 0)).toBe(0)
  })
})

describe('dominantCategoryOf', () => {
  it('picks the majority category', () => {
    expect(
      dominantCategoryOf([
        makeSession({ category: 'devrel' }),
        makeSession({ category: 'devrel' }),
        makeSession({ category: 'hackathon' }),
      ])
    ).toBe('devrel')
  })

  it('breaks ties by priority (hackathon > demo_day > tech_talk > part_session > devrel)', () => {
    expect(
      dominantCategoryOf([
        makeSession({ category: 'devrel' }),
        makeSession({ category: 'demo_day' }),
      ])
    ).toBe('demo_day')
  })

  it('returns null for an empty week', () => {
    expect(dominantCategoryOf([])).toBe(null)
  })
})

describe('intensityOpacity', () => {
  it('maps counts to 0.45 / 0.7 / 1.0 steps', () => {
    expect(intensityOpacity(1)).toBe(0.45)
    expect(intensityOpacity(2)).toBe(0.7)
    expect(intensityOpacity(3)).toBe(1)
    expect(intensityOpacity(9)).toBe(1)
  })
})
```

- [ ] **Step 2: 실패 확인**

Run: `pnpm vitest run tests/lib/heatmap.test.ts`
Expected: FAIL — `Cannot find module '@/lib/heatmap'` 계열 에러.

- [ ] **Step 3: 구현**

Create `lib/heatmap.ts` (클라이언트에서도 import 가능해야 하므로 `server-only` 금지):

```ts
export const ACTIVITY_CATEGORIES = [
  'tech_talk',
  'part_session',
  'hackathon',
  'demo_day',
  'devrel',
] as const

export type ActivityCategory = (typeof ACTIVITY_CATEGORIES)[number]

/** 동률 시 우선순위 (앞이 우선) */
export const CATEGORY_PRIORITY: readonly ActivityCategory[] = [
  'hackathon',
  'demo_day',
  'tech_talk',
  'part_session',
  'devrel',
]

/** 히트맵 셀·범례·인디케이터 색 (스펙 §5.1) */
export const CATEGORY_CELL_CLASS: Record<ActivityCategory, string> = {
  tech_talk: 'bg-gdg-blue-300',
  part_session: 'bg-gdg-green-300',
  hackathon: 'bg-gdg-red-300',
  demo_day: 'bg-yonsei-blue',
  devrel: 'bg-gdg-yellow-300',
}

export const CATEGORY_LABEL: Record<
  ActivityCategory,
  { en: string; ko: string }
> = {
  tech_talk: { en: 'Tech Talk', ko: '테크토크' },
  part_session: { en: 'Part Session', ko: '파트 세션' },
  hackathon: { en: 'Hackathon', ko: '해커톤' },
  demo_day: { en: 'Demo Day', ko: '데모데이' },
  devrel: { en: 'DevRel · Social', ko: 'DevRel · 소셜' },
}

export const HEATMAP_WEEKS = 52

const DAY_MS = 24 * 60 * 60 * 1000
export const WEEK_MS = 7 * DAY_MS

export type HeatmapSessionInput = {
  id: string
  name: string
  nameKo: string
  /** ISO datetime string (UTC) */
  startAt: string
  category: ActivityCategory
  participantCount: number
}

export type HeatmapWeek = {
  /** 주 시작 월요일(UTC), YYYY-MM-DD */
  weekKey: string
  weekStartIso: string
  count: number
  dominantCategory: ActivityCategory | null
  sessions: HeatmapSessionInput[]
}

/** 해당 시각이 속한 주의 월요일 00:00(UTC) */
export function startOfWeekUtc(date: Date): Date {
  const day = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  )
  const weekdayOffset = (day.getUTCDay() + 6) % 7 // Mon=0 ... Sun=6
  return new Date(day.getTime() - weekdayOffset * DAY_MS)
}

function toWeekKey(weekStart: Date): string {
  return weekStart.toISOString().slice(0, 10)
}

export function dominantCategoryOf(
  sessions: readonly HeatmapSessionInput[]
): ActivityCategory | null {
  if (sessions.length === 0) {
    return null
  }

  const counts = new Map<ActivityCategory, number>()
  for (const session of sessions) {
    counts.set(session.category, (counts.get(session.category) ?? 0) + 1)
  }

  let best: ActivityCategory = CATEGORY_PRIORITY[0]!
  let bestCount = 0
  for (const category of CATEGORY_PRIORITY) {
    const count = counts.get(category) ?? 0
    if (count > bestCount) {
      best = category
      bestCount = count
    }
  }

  return bestCount > 0 ? best : null
}

export function buildHeatmapWeeks(
  sessions: readonly HeatmapSessionInput[],
  reference: Date
): HeatmapWeek[] {
  const currentWeekStart = startOfWeekUtc(reference)

  const buckets = new Map<string, HeatmapSessionInput[]>()
  for (const session of sessions) {
    const weekKey = toWeekKey(startOfWeekUtc(new Date(session.startAt)))
    const bucket = buckets.get(weekKey)
    if (bucket) {
      bucket.push(session)
    } else {
      buckets.set(weekKey, [session])
    }
  }

  const weeks: HeatmapWeek[] = []
  for (let index = HEATMAP_WEEKS - 1; index >= 0; index -= 1) {
    const weekStart = new Date(currentWeekStart.getTime() - index * WEEK_MS)
    const weekKey = toWeekKey(weekStart)
    const bucketSessions = buckets.get(weekKey) ?? []
    weeks.push({
      weekKey,
      weekStartIso: weekStart.toISOString(),
      count: bucketSessions.length,
      dominantCategory: dominantCategoryOf(bucketSessions),
      sessions: bucketSessions,
    })
  }

  return weeks
}

/** 주당 활동 수 → 셀 opacity (스펙 §8) */
export function intensityOpacity(count: number): number {
  if (count <= 0) {
    return 1
  }
  if (count === 1) {
    return 0.45
  }
  if (count === 2) {
    return 0.7
  }
  return 1
}
```

- [ ] **Step 4: 통과 확인**

Run: `pnpm vitest run tests/lib/heatmap.test.ts`
Expected: PASS (10 tests)

- [ ] **Step 5: Commit**

```bash
git add lib/heatmap.ts tests/lib/heatmap.test.ts
git commit -m "feat: add heatmap week-bucketing, category color, and intensity utilities"
```

---

### Task 7: public 읽기 모델 4종 — `lib/server/queries/public/home.ts`

**Files:**
- Create: `lib/server/queries/public/home.ts`
- Test: `tests/lib/server/fetcher/home-queries.test.ts`

**Interfaces:**
- Consumes: Task 3 스키마, Task 6 `HEATMAP_WEEKS`/`WEEK_MS`. 기존 `cacheQuery`, `publicCachePolicy`, 태그 함수들, `getSessionVisibilityBucket`(호출부에서).
- Produces (홈·어바웃 페이지가 소비):
  - `getHeatmapSessions(locale: Locale, visibilityBucket: string)` → `{ id, name, nameKo, startAt: Date | null, category, internalCount: number, externalCount: number }[]`
  - `getFeaturedProjects(locale)` → `{ id, name, nameKo, description, descriptionKo, mainImage, repoUrl, demoUrl, generationName, tags: string[] }[]` (≤9, 최신 기수)
  - `getCommunityStats(locale)` → `{ sessionCount, participantTotal, projectCount, partCount }`
  - `getGenerationTimeline(locale, visibilityBucket)` → `{ id, name, startDate, endDate, sessions: TimelineSessionDTO[] }[]`
  - `export type FeaturedProject`, `export type CommunityStats`, `export type GenerationTimelineEntry`, `export type TimelineSessionDTO`

- [ ] **Step 1: 실패하는 테스트 작성**

Create `tests/lib/server/fetcher/home-queries.test.ts` (기존 `public-fetchers.test.ts`와 같은 mock 방식):

```ts
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockCacheQuery = vi.fn()
const mockGenerationsFindFirst = vi.fn()
const mockSelect = vi.fn()

vi.mock('@/db', () => ({
  default: {
    query: {
      generations: { findFirst: mockGenerationsFindFirst },
    },
    select: mockSelect,
  },
}))

vi.mock('@/lib/server/cache', async () => {
  const actual =
    await vi.importActual<typeof import('@/lib/server/cache')>(
      '@/lib/server/cache'
    )
  return { ...actual, cacheQuery: mockCacheQuery }
})

function createSelectChain(result: unknown) {
  const resolved = Promise.resolve(result)
  const chain = {
    from: vi.fn(() => chain),
    leftJoin: vi.fn(() => chain),
    where: vi.fn(() => chain),
    orderBy: vi.fn(() => chain),
    then: (
      onFulfilled: (value: unknown) => unknown,
      onRejected?: (reason: unknown) => unknown
    ) => resolved.then(onFulfilled, onRejected),
  }
  return chain
}

const BUCKET = '2026-07-11T09:00:00.000Z'

describe('home queries', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('getHeatmapSessions returns rows and tags the session list', async () => {
    const rows = [
      {
        id: 's-1',
        name: 'T19',
        nameKo: 'T19',
        startAt: new Date('2026-07-07T10:00:00Z'),
        category: 'tech_talk',
        internalCount: 8,
        externalCount: 2,
      },
    ]
    mockSelect.mockReturnValueOnce(createSelectChain(rows))

    const { getHeatmapSessions } =
      await import('@/lib/server/queries/public/home')
    const result = await getHeatmapSessions('en', BUCKET)

    expect(result).toEqual(rows)
    expect(mockCacheQuery).toHaveBeenCalledWith('sessionList', [
      'session:list:en',
    ])
  })

  it('getFeaturedProjects flattens tags and stamps the generation name', async () => {
    mockGenerationsFindFirst.mockResolvedValue({
      id: 4,
      name: '25-26',
      projects: [
        {
          id: 'p-1',
          name: 'Compass',
          nameKo: '나침반',
          description: 'd',
          descriptionKo: 'ㄷ',
          mainImage: '/project-default.png',
          repoUrl: 'https://github.com/x',
          demoUrl: null,
          projectsToTags: [{ tag: { name: 'Next.js' } }],
        },
      ],
    })

    const { getFeaturedProjects } =
      await import('@/lib/server/queries/public/home')
    const result = await getFeaturedProjects('ko')

    expect(result).toEqual([
      {
        id: 'p-1',
        name: 'Compass',
        nameKo: '나침반',
        description: 'd',
        descriptionKo: 'ㄷ',
        mainImage: '/project-default.png',
        repoUrl: 'https://github.com/x',
        demoUrl: null,
        generationName: '25-26',
        tags: ['Next.js'],
      },
    ])
    expect(mockCacheQuery).toHaveBeenCalledWith('projectList', [
      'project:list:ko',
      'generation:latest:ko',
    ])
  })

  it('getFeaturedProjects returns [] when no generation exists', async () => {
    mockGenerationsFindFirst.mockResolvedValue(undefined)

    const { getFeaturedProjects } =
      await import('@/lib/server/queries/public/home')

    expect(await getFeaturedProjects('en')).toEqual([])
  })

  it('getCommunityStats sums internal and external participants', async () => {
    mockSelect
      .mockReturnValueOnce(createSelectChain([{ value: 60 }]))
      .mockReturnValueOnce(createSelectChain([{ value: 400 }]))
      .mockReturnValueOnce(createSelectChain([{ value: 50 }]))
      .mockReturnValueOnce(createSelectChain([{ value: 8 }]))
      .mockReturnValueOnce(createSelectChain([{ value: 7 }]))
    mockGenerationsFindFirst.mockResolvedValue({ id: 4 })

    const { getCommunityStats } =
      await import('@/lib/server/queries/public/home')
    const result = await getCommunityStats('en')

    expect(result).toEqual({
      sessionCount: 60,
      participantTotal: 450,
      projectCount: 8,
      partCount: 7,
    })
    expect(mockCacheQuery).toHaveBeenCalledWith('sessionList', [
      'session:list:en',
      'project:list:en',
      'member:list:en',
    ])
  })

  it('getGenerationTimeline groups sessions under their generation', async () => {
    const rows = [
      {
        generationId: 3,
        generationName: '24-25',
        startDate: '2024-09-01',
        endDate: '2025-08-31',
        sessionId: 's-1',
        sessionName: 'Demo Day',
        sessionNameKo: '데모데이',
        sessionStartAt: new Date('2024-12-20T10:00:00Z'),
        sessionCategory: 'demo_day',
      },
      {
        generationId: 3,
        generationName: '24-25',
        startDate: '2024-09-01',
        endDate: '2025-08-31',
        sessionId: null,
        sessionName: null,
        sessionNameKo: null,
        sessionStartAt: null,
        sessionCategory: null,
      },
      {
        generationId: 4,
        generationName: '25-26',
        startDate: '2025-09-01',
        endDate: null,
        sessionId: 's-2',
        sessionName: 'T19',
        sessionNameKo: 'T19',
        sessionStartAt: new Date('2025-09-16T10:00:00Z'),
        sessionCategory: 'tech_talk',
      },
    ]
    mockSelect.mockReturnValueOnce(createSelectChain(rows))

    const { getGenerationTimeline } =
      await import('@/lib/server/queries/public/home')
    const result = await getGenerationTimeline('en', BUCKET)

    expect(result).toHaveLength(2)
    expect(result[0]).toMatchObject({
      id: 3,
      name: '24-25',
      sessions: [{ id: 's-1', category: 'demo_day' }],
    })
    expect(result[1]!.sessions).toHaveLength(1)
    expect(mockCacheQuery).toHaveBeenCalledWith('sessionList', [
      'session:list:en',
      'generation:list:en',
    ])
  })
})
```

- [ ] **Step 2: 실패 확인**

Run: `pnpm vitest run tests/lib/server/fetcher/home-queries.test.ts`
Expected: FAIL — `Cannot find module '@/lib/server/queries/public/home'`.

- [ ] **Step 3: 구현**

Create `lib/server/queries/public/home.ts`:

```ts
import 'server-only'

import db from '@/db'
import { externalParticipants } from '@/db/schema/external-participants'
import { generations } from '@/db/schema/generations'
import { parts } from '@/db/schema/parts'
import { projects } from '@/db/schema/projects'
import { sessions } from '@/db/schema/sessions'
import { userToSession } from '@/db/schema/user-to-session'
import type { Locale } from '@/i18n-config'
import { HEATMAP_WEEKS, WEEK_MS, type ActivityCategory } from '@/lib/heatmap'
import {
  cacheQuery,
  generationLatestTag,
  generationListTag,
  memberListTag,
  projectListTag,
  sessionListTag,
} from '@/lib/server/cache'
import { publicCachePolicy } from '@/lib/server/cache/policy'
import { and, asc, desc, eq, gte, lte, sql } from 'drizzle-orm'

/** 최근 52주 히트맵용 공개 세션 + 참여 인원 카운트 */
export async function getHeatmapSessions(
  locale: Locale,
  visibilityBucket: string
) {
  'use cache: remote'

  cacheQuery(publicCachePolicy.sessionList, [sessionListTag(locale)])

  const bucketDate = new Date(visibilityBucket)
  const windowStart = new Date(bucketDate.getTime() - HEATMAP_WEEKS * WEEK_MS)

  return db
    .select({
      id: sessions.id,
      name: sessions.name,
      nameKo: sessions.nameKo,
      startAt: sessions.startAt,
      category: sessions.category,
      internalCount:
        sql<number>`(select count(*) from "userToSession" uts where uts."sessionId" = ${sessions.id})`.mapWith(
          Number
        ),
      externalCount:
        sql<number>`(select count(*) from "external_participants" ep where ep."sessionId" = ${sessions.id})`.mapWith(
          Number
        ),
    })
    .from(sessions)
    .where(
      and(
        eq(sessions.displayOnWebsite, true),
        gte(sessions.startAt, windowStart),
        lte(sessions.startAt, bucketDate)
      )
    )
    .orderBy(asc(sessions.startAt))
}

/** 최신 기수의 프로젝트 최대 9개 (태그 포함) */
export async function getFeaturedProjects(locale: Locale) {
  'use cache: remote'

  cacheQuery(publicCachePolicy.projectList, [
    projectListTag(locale),
    generationLatestTag(locale),
  ])

  const latestGeneration = await db.query.generations.findFirst({
    orderBy: desc(generations.startDate),
    columns: { id: true, name: true },
    with: {
      projects: {
        columns: {
          id: true,
          name: true,
          nameKo: true,
          description: true,
          descriptionKo: true,
          mainImage: true,
          repoUrl: true,
          demoUrl: true,
        },
        orderBy: desc(projects.updatedAt),
        limit: 9,
        with: {
          projectsToTags: {
            with: { tag: { columns: { name: true } } },
          },
        },
      },
    },
  })

  if (!latestGeneration) {
    return []
  }

  return latestGeneration.projects.map((project) => ({
    id: project.id,
    name: project.name,
    nameKo: project.nameKo,
    description: project.description,
    descriptionKo: project.descriptionKo,
    mainImage: project.mainImage,
    repoUrl: project.repoUrl,
    demoUrl: project.demoUrl,
    generationName: latestGeneration.name,
    tags: project.projectsToTags.map((projectToTag) => projectToTag.tag.name),
  }))
}

/** 커뮤니티 집계 (하드코딩 금지 — 스펙 §9 Stats) */
export async function getCommunityStats(locale: Locale) {
  'use cache: remote'

  cacheQuery(publicCachePolicy.sessionList, [
    sessionListTag(locale),
    projectListTag(locale),
    memberListTag(locale),
  ])

  const countValue = sql<number>`count(*)`.mapWith(Number)

  const [
    sessionRows,
    internalRows,
    externalRows,
    projectRows,
    latestGeneration,
  ] = await Promise.all([
    db
      .select({ value: countValue })
      .from(sessions)
      .where(eq(sessions.displayOnWebsite, true)),
    db.select({ value: countValue }).from(userToSession),
    db.select({ value: countValue }).from(externalParticipants),
    db.select({ value: countValue }).from(projects),
    db.query.generations.findFirst({
      orderBy: desc(generations.startDate),
      columns: { id: true },
    }),
  ])

  const partRows = latestGeneration
    ? await db
        .select({ value: countValue })
        .from(parts)
        .where(eq(parts.generationsId, latestGeneration.id))
    : [{ value: 0 }]

  return {
    sessionCount: sessionRows[0]?.value ?? 0,
    participantTotal:
      (internalRows[0]?.value ?? 0) + (externalRows[0]?.value ?? 0),
    projectCount: projectRows[0]?.value ?? 0,
    partCount: partRows[0]?.value ?? 0,
  }
}

export type TimelineSessionDTO = {
  id: string
  name: string
  nameKo: string
  startAt: Date
  category: ActivityCategory
}

/** 기수별 연혁 타임라인 (공개 세션 압축 컬럼 포함) */
export async function getGenerationTimeline(
  locale: Locale,
  visibilityBucket: string
) {
  'use cache: remote'

  cacheQuery(publicCachePolicy.sessionList, [
    sessionListTag(locale),
    generationListTag(locale),
  ])

  const bucketDate = new Date(visibilityBucket)

  const rows = await db
    .select({
      generationId: generations.id,
      generationName: generations.name,
      startDate: generations.startDate,
      endDate: generations.endDate,
      sessionId: sessions.id,
      sessionName: sessions.name,
      sessionNameKo: sessions.nameKo,
      sessionStartAt: sessions.startAt,
      sessionCategory: sessions.category,
    })
    .from(generations)
    .leftJoin(parts, eq(parts.generationsId, generations.id))
    .leftJoin(
      sessions,
      and(
        eq(sessions.partId, parts.id),
        eq(sessions.displayOnWebsite, true),
        lte(sessions.startAt, bucketDate)
      )
    )
    .orderBy(asc(generations.startDate), asc(sessions.startAt))

  const timeline = new Map<
    number,
    {
      id: number
      name: string
      startDate: string
      endDate: string | null
      sessions: TimelineSessionDTO[]
    }
  >()

  for (const row of rows) {
    let entry = timeline.get(row.generationId)
    if (!entry) {
      entry = {
        id: row.generationId,
        name: row.generationName,
        startDate: row.startDate,
        endDate: row.endDate,
        sessions: [],
      }
      timeline.set(row.generationId, entry)
    }
    if (
      row.sessionId !== null &&
      row.sessionStartAt !== null &&
      row.sessionCategory !== null
    ) {
      entry.sessions.push({
        id: row.sessionId,
        name: row.sessionName ?? '',
        nameKo: row.sessionNameKo ?? '',
        startAt: row.sessionStartAt,
        category: row.sessionCategory,
      })
    }
  }

  return [...timeline.values()]
}

export type HeatmapSessionRow = Awaited<
  ReturnType<typeof getHeatmapSessions>
>[number]
export type FeaturedProject = Awaited<
  ReturnType<typeof getFeaturedProjects>
>[number]
export type CommunityStats = Awaited<ReturnType<typeof getCommunityStats>>
export type GenerationTimelineEntry = Awaited<
  ReturnType<typeof getGenerationTimeline>
>[number]
```

- [ ] **Step 4: 통과 확인**

Run: `pnpm vitest run tests/lib/server/fetcher/home-queries.test.ts && pnpm test:types`
Expected: PASS (5 tests) + tsc 클린.

- [ ] **Step 5: Commit**

```bash
git add lib/server/queries/public/home.ts tests/lib/server/fetcher/home-queries.test.ts
git commit -m "feat: add public home/about read-model queries"
```

---

### Task 8: 로컬 시드 — `scripts/seed-dev.ts` + `pnpm db:seed`

**Files:**
- Create: `scripts/seed/helpers.ts`, `scripts/seed-dev.ts`
- Test: `tests/lib/seed-helpers.test.ts`
- Modify: `package.json` (script `db:seed`, devDep `tsx`)

**Interfaces:**
- Consumes: Task 3 스키마(category/repoUrl/demoUrl 포함), 전체 db/schema.
- Produces: `pnpm db:seed` — 재실행 가능(마커 기반 정리), 로컬 DB 가드(`--force` 없으면 localhost 계열만). helpers: `weeklyOccurrences(options)`, `buildSessionPlans(): SeedSessionPlan[]`, `SEED_WINDOW`, `SEED_BREAKS`.

- [ ] **Step 1: 실패하는 헬퍼 테스트 작성**

Create `tests/lib/seed-helpers.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import {
  buildSessionPlans,
  SEED_WINDOW,
  weeklyOccurrences,
} from '../../scripts/seed/helpers'

describe('weeklyOccurrences', () => {
  it('generates weekly dates on the requested UTC weekday', () => {
    const dates = weeklyOccurrences({
      from: new Date('2025-09-01T00:00:00.000Z'),
      to: new Date('2025-09-30T23:59:59.000Z'),
      weekday: 2,
      hourUtc: 10,
    })
    expect(dates.map((date) => date.toISOString())).toEqual([
      '2025-09-02T10:00:00.000Z',
      '2025-09-09T10:00:00.000Z',
      '2025-09-16T10:00:00.000Z',
      '2025-09-23T10:00:00.000Z',
      '2025-09-30T10:00:00.000Z',
    ])
  })

  it('skips dates inside skip ranges', () => {
    const dates = weeklyOccurrences({
      from: new Date('2025-09-01T00:00:00.000Z'),
      to: new Date('2025-09-30T23:59:59.000Z'),
      weekday: 2,
      hourUtc: 10,
      skipRanges: [
        {
          from: new Date('2025-09-08T00:00:00.000Z'),
          to: new Date('2025-09-14T23:59:59.000Z'),
        },
      ],
    })
    expect(dates.map((date) => date.toISOString())).not.toContain(
      '2025-09-09T10:00:00.000Z'
    )
    expect(dates).toHaveLength(4)
  })

  it('supports biweekly steps', () => {
    const dates = weeklyOccurrences({
      from: new Date('2025-09-01T00:00:00.000Z'),
      to: new Date('2025-09-30T23:59:59.000Z'),
      weekday: 2,
      hourUtc: 10,
      stepWeeks: 2,
    })
    expect(dates.map((date) => date.toISOString())).toEqual([
      '2025-09-02T10:00:00.000Z',
      '2025-09-16T10:00:00.000Z',
      '2025-09-30T10:00:00.000Z',
    ])
  })
})

describe('buildSessionPlans', () => {
  it('produces a realistic year of activities covering all five categories', () => {
    const plans = buildSessionPlans()
    expect(plans.length).toBeGreaterThanOrEqual(40)
    expect(new Set(plans.map((plan) => plan.category))).toEqual(
      new Set(['tech_talk', 'part_session', 'hackathon', 'demo_day', 'devrel'])
    )
    expect(plans.every((plan) => plan.endAt > plan.startAt)).toBe(true)
    expect(plans.every((plan) => plan.startAt >= SEED_WINDOW.from)).toBe(true)
  })
})
```

- [ ] **Step 2: 실패 확인**

Run: `pnpm vitest run tests/lib/seed-helpers.test.ts`
Expected: FAIL — helpers 모듈 없음.

- [ ] **Step 3: helpers 구현**

Create `scripts/seed/helpers.ts`:

```ts
export type SeedCategory =
  | 'tech_talk'
  | 'part_session'
  | 'hackathon'
  | 'demo_day'
  | 'devrel'

export type SeedSessionPlan = {
  name: string
  nameKo: string
  category: SeedCategory
  startAt: Date
  endAt: Date
  location: string
  locationKo: string
}

export type DateRange = { from: Date; to: Date }

const DAY_MS = 24 * 60 * 60 * 1000

function isInRanges(date: Date, ranges: readonly DateRange[]): boolean {
  return ranges.some((range) => date >= range.from && date <= range.to)
}

/** from~to 사이 특정 요일(UTC)·시각의 반복 일정 생성 (skipRanges 제외) */
export function weeklyOccurrences(options: {
  from: Date
  to: Date
  /** 0=일 ... 6=토 (UTC) */
  weekday: number
  hourUtc: number
  stepWeeks?: number
  skipRanges?: readonly DateRange[]
}): Date[] {
  const { from, to, weekday, hourUtc, stepWeeks = 1, skipRanges = [] } = options

  const first = new Date(
    Date.UTC(
      from.getUTCFullYear(),
      from.getUTCMonth(),
      from.getUTCDate(),
      hourUtc
    )
  )
  while (first.getUTCDay() !== weekday) {
    first.setUTCDate(first.getUTCDate() + 1)
  }

  const dates: Date[] = []
  for (
    let cursor = new Date(first);
    cursor <= to;
    cursor = new Date(cursor.getTime() + stepWeeks * 7 * DAY_MS)
  ) {
    if (!isInRanges(cursor, skipRanges)) {
      dates.push(new Date(cursor))
    }
  }
  return dates
}

/** 시드 기수 활동 기간: 2025-09 ~ 2026-06 */
export const SEED_WINDOW = {
  from: new Date('2025-09-01T00:00:00.000Z'),
  to: new Date('2026-06-30T23:59:59.000Z'),
}

/** 방학·시험 공백 (히트맵 밀도가 현실적으로 보이도록) */
export const SEED_BREAKS: readonly DateRange[] = [
  {
    from: new Date('2025-12-15T00:00:00.000Z'),
    to: new Date('2026-01-05T23:59:59.000Z'),
  },
  {
    from: new Date('2026-02-09T00:00:00.000Z'),
    to: new Date('2026-03-01T23:59:59.000Z'),
  },
]

function twoHourSlot(start: Date): { startAt: Date; endAt: Date } {
  return { startAt: start, endAt: new Date(start.getTime() + 2 * 60 * 60 * 1000) }
}

export function buildSessionPlans(): SeedSessionPlan[] {
  const plans: SeedSessionPlan[] = []

  // 매주 화요일 19:00 KST (10:00 UTC) — T19
  weeklyOccurrences({
    ...SEED_WINDOW,
    weekday: 2,
    hourUtc: 10,
    skipRanges: SEED_BREAKS,
  }).forEach((date, index) => {
    plans.push({
      name: `T19 Week ${index + 1}`,
      nameKo: `T19 ${index + 1}주차`,
      category: 'tech_talk',
      ...twoHourSlot(date),
      location: 'Engineering Hall B039',
      locationKo: '공학원 B039',
    })
  })

  // 격주 목요일 — 파트 세션
  weeklyOccurrences({
    ...SEED_WINDOW,
    weekday: 4,
    hourUtc: 10,
    stepWeeks: 2,
    skipRanges: SEED_BREAKS,
  }).forEach((date, index) => {
    plans.push({
      name: `Part Session ${index + 1}`,
      nameKo: `파트 세션 ${index + 1}회`,
      category: 'part_session',
      ...twoHourSlot(date),
      location: 'Yonsei-Samsung Library',
      locationKo: '연세삼성학술정보관',
    })
  })

  const specials: Array<
    Omit<SeedSessionPlan, 'startAt' | 'endAt'> & { dateIso: string }
  > = [
    { name: 'Namu-thon', nameKo: '나무톤', category: 'hackathon', dateIso: '2025-11-08T01:00:00.000Z', location: 'Baekyang Nuri', locationKo: '백양누리' },
    { name: 'The Bridge Hackathon', nameKo: '브릿지 해커톤', category: 'hackathon', dateIso: '2026-02-21T01:00:00.000Z', location: 'Seoul & Tokyo', locationKo: '서울·도쿄' },
    { name: 'oTP Demo Day', nameKo: 'oTP 데모데이', category: 'demo_day', dateIso: '2025-12-12T09:00:00.000Z', location: 'Engineering Hall Auditorium', locationKo: '공학원 대강당' },
    { name: 'Yonsei X Korea Demo Day', nameKo: '연세 X 고려 데모데이', category: 'demo_day', dateIso: '2026-05-30T05:00:00.000Z', location: 'Korea University', locationKo: '고려대학교' },
    { name: 'Welcome Networking Night', nameKo: '웰컴 네트워킹 나이트', category: 'devrel', dateIso: '2025-09-19T09:00:00.000Z', location: 'Sinchon', locationKo: '신촌' },
    { name: 'DevRel Insight Night', nameKo: 'DevRel 인사이트 나이트', category: 'devrel', dateIso: '2025-10-31T09:00:00.000Z', location: 'Student Union', locationKo: '학생회관' },
    { name: 'Alumni Career Talk', nameKo: '알럼나이 커리어 토크', category: 'devrel', dateIso: '2026-03-27T09:00:00.000Z', location: 'Online', locationKo: '온라인' },
    { name: 'Google I/O Watch Party', nameKo: '구글 I/O 워치 파티', category: 'devrel', dateIso: '2026-05-08T09:00:00.000Z', location: 'Engineering Hall B039', locationKo: '공학원 B039' },
  ]
  for (const special of specials) {
    plans.push({
      name: special.name,
      nameKo: special.nameKo,
      category: special.category,
      ...twoHourSlot(new Date(special.dateIso)),
      location: special.location,
      locationKo: special.locationKo,
    })
  }

  return plans.sort((a, b) => a.startAt.getTime() - b.startAt.getTime())
}
```

- [ ] **Step 4: 헬퍼 테스트 통과 확인**

Run: `pnpm vitest run tests/lib/seed-helpers.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 5: 시드 스크립트 작성 + 스크립트 등록**

```bash
pnpm add -D tsx
```

`package.json`의 scripts에 추가(`"db:studio"` 줄 아래):

```json
    "db:seed": "tsx scripts/seed-dev.ts",
```

Create `scripts/seed-dev.ts`:

```ts
import 'dotenv/config'
import { eq, inArray, like } from 'drizzle-orm'
import db from '../db'
import { generations } from '../db/schema/generations'
import { parts } from '../db/schema/parts'
import { projects } from '../db/schema/projects'
import { projectsToTags } from '../db/schema/projects-to-tags'
import { sessions } from '../db/schema/sessions'
import { tags } from '../db/schema/tags'
import { users } from '../db/schema/users'
import { usersToParts } from '../db/schema/users-to-parts'
import { usersToProjects } from '../db/schema/users-to-projects'
import { userToSession } from '../db/schema/user-to-session'
import { buildSessionPlans } from './seed/helpers'

const SEED_PREFIX = 'dev-seed-'
const SEED_GENERATION_NAME = '25-26'
const ALLOWED_DB_HOSTS = ['localhost', '127.0.0.1', '0.0.0.0', 'db', 'postgres']

const SEED_PARTS = [
  { name: 'Organizer', displayOrder: 1 },
  { name: 'Front-End', displayOrder: 2 },
  { name: 'Back-End', displayOrder: 3 },
  { name: 'ML/AI', displayOrder: 4 },
  { name: 'Cloud', displayOrder: 5 },
  { name: 'UI/UX', displayOrder: 6 },
  { name: 'DevRel', displayOrder: 7 },
]

const SEED_MEMBERS = [
  { first: 'Jimin', last: 'Kim', firstKo: '지민', lastKo: '김' },
  { first: 'Seoyeon', last: 'Lee', firstKo: '서연', lastKo: '이' },
  { first: 'Doyun', last: 'Park', firstKo: '도윤', lastKo: '박' },
  { first: 'Haeun', last: 'Choi', firstKo: '하은', lastKo: '최' },
  { first: 'Jiho', last: 'Jung', firstKo: '지호', lastKo: '정' },
  { first: 'Yuna', last: 'Kang', firstKo: '유나', lastKo: '강' },
  { first: 'Minjun', last: 'Cho', firstKo: '민준', lastKo: '조' },
  { first: 'Chaewon', last: 'Yoon', firstKo: '채원', lastKo: '윤' },
  { first: 'Sunwoo', last: 'Jang', firstKo: '선우', lastKo: '장' },
  { first: 'Ari', last: 'Lim', firstKo: '아리', lastKo: '임' },
  { first: 'Taeyang', last: 'Han', firstKo: '태양', lastKo: '한' },
  { first: 'Sia', last: 'Oh', firstKo: '시아', lastKo: '오' },
  { first: 'Juwon', last: 'Seo', firstKo: '주원', lastKo: '서' },
  { first: 'Nayun', last: 'Kwon', firstKo: '나윤', lastKo: '권' },
  { first: 'Ian', last: 'Hwang', firstKo: '이안', lastKo: '황' },
  { first: 'Dana', last: 'Song', firstKo: '다나', lastKo: '송' },
]

const SEED_TAGS = [
  'Next.js',
  'TypeScript',
  'Flutter',
  'FastAPI',
  'PyTorch',
  'Firebase',
  'Kotlin',
  'Go',
  'Terraform',
  'Figma',
]

const SEED_PROJECTS = [
  { name: 'Campus Compass', nameKo: '캠퍼스 나침반', description: 'Indoor navigation for Yonsei campus buildings.', descriptionKo: '연세 캠퍼스 실내 길찾기 서비스.', tags: ['Flutter', 'Firebase'], repoUrl: 'https://github.com/gdg-yonsei/campus-compass', demoUrl: 'https://campus-compass.example.com' },
  { name: 'Lecture Lens', nameKo: '렉처 렌즈', description: 'AI-powered lecture summarization and search.', descriptionKo: 'AI 강의 요약·검색 도구.', tags: ['PyTorch', 'FastAPI'], repoUrl: 'https://github.com/gdg-yonsei/lecture-lens', demoUrl: null },
  { name: 'Green Route', nameKo: '그린 루트', description: 'Carbon-aware commute planner for students.', descriptionKo: '탄소 배출을 고려한 통학 경로 추천.', tags: ['Next.js', 'TypeScript'], repoUrl: 'https://github.com/gdg-yonsei/green-route', demoUrl: 'https://green-route.example.com' },
  { name: 'Mokdori', nameKo: '먹도리', description: 'Campus restaurant queue and review service.', descriptionKo: '학식·맛집 대기열과 리뷰 서비스.', tags: ['Kotlin', 'Firebase'], repoUrl: null, demoUrl: 'https://mokdori.example.com' },
  { name: 'Cloud Atlas', nameKo: '클라우드 아틀라스', description: 'Terraform templates for student projects.', descriptionKo: '학생 프로젝트용 Terraform 템플릿 모음.', tags: ['Terraform', 'Go'], repoUrl: 'https://github.com/gdg-yonsei/cloud-atlas', demoUrl: null },
  { name: 'Study Sync', nameKo: '스터디 싱크', description: 'Real-time study group matching platform.', descriptionKo: '실시간 스터디 그룹 매칭 플랫폼.', tags: ['Next.js', 'Firebase'], repoUrl: 'https://github.com/gdg-yonsei/study-sync', demoUrl: 'https://study-sync.example.com' },
  { name: 'Sign Bridge', nameKo: '사인 브릿지', description: 'Sign language translation with on-device ML.', descriptionKo: '온디바이스 ML 수어 번역.', tags: ['PyTorch', 'Flutter'], repoUrl: 'https://github.com/gdg-yonsei/sign-bridge', demoUrl: null },
  { name: 'Portfolio Kit', nameKo: '포트폴리오 킷', description: 'Design-system-driven portfolio builder.', descriptionKo: '디자인 시스템 기반 포트폴리오 빌더.', tags: ['Figma', 'TypeScript'], repoUrl: 'https://github.com/gdg-yonsei/portfolio-kit', demoUrl: 'https://portfolio-kit.example.com' },
]

function assertLocalDatabase() {
  const rawUrl = process.env.AUTH_DRIZZLE_URL
  if (!rawUrl) {
    console.error('AUTH_DRIZZLE_URL is not set.')
    process.exit(1)
  }
  const hostname = new URL(rawUrl).hostname
  if (!ALLOWED_DB_HOSTS.includes(hostname) && !process.argv.includes('--force')) {
    console.error(
      `Refusing to seed non-local database host "${hostname}". Pass --force to override.`
    )
    process.exit(1)
  }
}

/** 이전 시드 데이터만 마커 기반으로 제거 (TRUNCATE 금지) */
async function cleanupPreviousSeed() {
  await db.delete(sessions).where(like(sessions.authorId, `${SEED_PREFIX}%`))
  await db.delete(projects).where(like(projects.authorId, `${SEED_PREFIX}%`))

  const generation = await db.query.generations.findFirst({
    where: eq(generations.name, SEED_GENERATION_NAME),
  })
  if (generation) {
    await db.delete(parts).where(eq(parts.generationsId, generation.id))
    await db.delete(generations).where(eq(generations.id, generation.id))
  }

  await db.delete(users).where(like(users.id, `${SEED_PREFIX}%`))
  // tags는 실데이터와 공유될 수 있으므로 삭제하지 않고 onConflictDoNothing으로 upsert한다.
}

async function main() {
  assertLocalDatabase()
  await cleanupPreviousSeed()

  const generation = (
    await db
      .insert(generations)
      .values({
        name: SEED_GENERATION_NAME,
        startDate: '2025-09-01',
        endDate: '2026-08-31',
      })
      .returning({ id: generations.id, name: generations.name })
  )[0]!

  const insertedParts = await db
    .insert(parts)
    .values(
      SEED_PARTS.map((part) => ({
        name: part.name,
        description: `${part.name} part`,
        generationsId: generation.id,
        displayOrder: part.displayOrder,
      }))
    )
    .returning({ id: parts.id, name: parts.name })

  const organizerRow = {
    id: `${SEED_PREFIX}organizer`,
    name: 'dev-seed-organizer',
    email: `${SEED_PREFIX}organizer@example.com`,
    role: 'LEAD' as const,
    firstName: 'Hana',
    lastName: 'Yu',
    firstNameKo: '하나',
    lastNameKo: '유',
    isForeigner: false,
  }
  const memberRows = SEED_MEMBERS.map((member, index) => ({
    id: `${SEED_PREFIX}member-${String(index + 1).padStart(2, '0')}`,
    name: `${member.first} ${member.last}`,
    email: `${SEED_PREFIX}member-${index + 1}@example.com`,
    role: 'MEMBER' as const,
    firstName: member.first,
    lastName: member.last,
    firstNameKo: member.firstKo,
    lastNameKo: member.lastKo,
    isForeigner: false,
  }))
  await db.insert(users).values([organizerRow, ...memberRows])

  const organizerPartId = insertedParts.find(
    (part) => part.name === 'Organizer'
  )!.id
  const rotatingParts = insertedParts.filter(
    (part) => part.name !== 'Organizer'
  )
  await db.insert(usersToParts).values([
    { userId: organizerRow.id, partId: organizerPartId, userType: 'Core' as const },
    ...memberRows.map((member, index) => ({
      userId: member.id,
      partId: rotatingParts[index % rotatingParts.length]!.id,
      userType: 'Primary' as const,
    })),
  ])

  const plans = buildSessionPlans()
  let partSessionCursor = 0
  const insertedSessions = await db
    .insert(sessions)
    .values(
      plans.map((plan) => ({
        name: plan.name,
        nameKo: plan.nameKo,
        description: `${plan.name} — a GDGoC Yonsei activity.`,
        descriptionKo: `${plan.nameKo} — GDGoC Yonsei 활동입니다.`,
        authorId: organizerRow.id,
        partId:
          plan.category === 'part_session'
            ? rotatingParts[partSessionCursor++ % rotatingParts.length]!.id
            : organizerPartId,
        internalOpen: true,
        publicOpen: false,
        maxCapacity: 40,
        location: plan.location,
        locationKo: plan.locationKo,
        type:
          plan.category === 'part_session'
            ? ('Part Session' as const)
            : ('General Session' as const),
        category: plan.category,
        displayOnWebsite: true,
        startAt: plan.startAt,
        endAt: plan.endAt,
      }))
    )
    .returning({ id: sessions.id })

  // 세션별 5~15명 결정적 참여 배정
  const attendanceRows = insertedSessions.flatMap((session, sessionIndex) => {
    const attendeeCount = 5 + ((sessionIndex * 7) % 11)
    return Array.from({ length: attendeeCount }, (_, offset) => ({
      userId: memberRows[(sessionIndex + offset) % memberRows.length]!.id,
      sessionId: session.id,
    }))
  })
  await db.insert(userToSession).values(attendanceRows)

  await db
    .insert(tags)
    .values(SEED_TAGS.map((name) => ({ name })))
    .onConflictDoNothing()
  const tagRows = await db
    .select({ id: tags.id, name: tags.name })
    .from(tags)
    .where(inArray(tags.name, SEED_TAGS))
  const tagIdByName = new Map(tagRows.map((tag) => [tag.name, tag.id]))

  const insertedProjects = await db
    .insert(projects)
    .values(
      SEED_PROJECTS.map((project) => ({
        name: project.name,
        nameKo: project.nameKo,
        description: project.description,
        descriptionKo: project.descriptionKo,
        content: `# ${project.name}\n\n${project.description}`,
        contentKo: `# ${project.nameKo}\n\n${project.descriptionKo}`,
        authorId: organizerRow.id,
        generationId: generation.id,
        repoUrl: project.repoUrl,
        demoUrl: project.demoUrl,
      }))
    )
    .returning({ id: projects.id })

  await db.insert(projectsToTags).values(
    insertedProjects.flatMap((project, index) =>
      SEED_PROJECTS[index]!.tags.map((tagName) => ({
        projectId: project.id,
        tagId: tagIdByName.get(tagName)!,
      }))
    )
  )
  await db.insert(usersToProjects).values(
    insertedProjects.flatMap((project, index) =>
      [0, 1, 2].map((offset) => ({
        projectId: project.id,
        userId: memberRows[(index * 3 + offset) % memberRows.length]!.id,
      }))
    )
  )

  console.log(
    `Seeded: generation "${generation.name}", ${insertedParts.length} parts, ${
      memberRows.length + 1
    } users, ${insertedSessions.length} sessions, ${attendanceRows.length} attendances, ${insertedProjects.length} projects.`
  )
  process.exit(0)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
```

- [ ] **Step 6: 실행 + 재실행 가능 확인**

```bash
pnpm db:seed
pnpm db:seed
```

Expected: 두 번 모두 같은 요약 로그(예: `... 64 sessions, ... 8 projects.`)로 성공. 참고: `db/index.ts`가 `@/...` alias를 쓰는데 tsx가 해석하지 못하면(모듈 not found 에러) `db:seed` 스크립트를 `"tsx --tsconfig tsconfig.json scripts/seed-dev.ts"`로 바꿔 재시도.

- [ ] **Step 7: 전체 테스트 + Commit**

```bash
pnpm test && pnpm test:types
git add scripts package.json pnpm-lock.yaml tests/lib/seed-helpers.test.ts
git commit -m "feat: add deterministic local dev seed script (pnpm db:seed)"
```

---

### Task 9: 모션 인프라 — LazyMotion 프로바이더·Reveal·template + vitest mock 확장

**Files:**
- Create: `app/components/motion/lazy-motion-provider.tsx`, `app/components/motion/reveal.tsx`, `app/(home)/[lang]/template.tsx`
- Modify: `app/(home)/[lang]/layout.tsx`(프로바이더 배선), `app/components/header/navigation-list.tsx`·`app/components/show-more-content.tsx`(`motion.*`→`m.*`), `vitest.setup.ts`
- Test: `tests/components/motion-reveal.test.tsx`

**Interfaces:**
- Produces: `<LazyMotionProvider>`(layout에서 body 전체 래핑), `<Reveal className delay>`(whileInView once 페이드+y8 — 이후 태스크들의 표준 스크롤 리빌), route enter 페이드 template. vitest의 motion/react mock이 `m`/`LazyMotion`/`useReducedMotion`/`useScroll`/`useTransform`/`animate` 제공(**useReducedMotion은 테스트에서 항상 true**).

- [ ] **Step 1: 실패하는 테스트 작성**

Create `tests/components/motion-reveal.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import Reveal from '@/app/components/motion/reveal'

describe('Reveal', () => {
  it('renders its children', () => {
    render(<Reveal>hello reveal</Reveal>)
    expect(screen.getByText('hello reveal')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: 실패 확인**

Run: `pnpm vitest run tests/components/motion-reveal.test.tsx`
Expected: FAIL — 모듈 없음.

- [ ] **Step 3: vitest.setup.ts mock 확장 (구현 전에 먼저)**

`vitest.setup.ts`에서 기존 `vi.mock('motion/react', () => ({ motion: createMotionProxy() }))` 블록을 아래로 교체:

```ts
vi.mock('motion/react', () => {
  const proxy = createMotionProxy()
  return {
    motion: proxy,
    m: proxy,
    LazyMotion: ({ children }: React.PropsWithChildren) => children,
    AnimatePresence: ({ children }: React.PropsWithChildren) => children,
    domAnimation: {},
    domMax: {},
    useReducedMotion: () => true,
    useScroll: () => ({
      scrollYProgress: { get: () => 0, on: () => () => {} },
    }),
    useTransform: () => 0,
    animate: (
      _from: number,
      to: number,
      options?: { onUpdate?: (value: number) => void }
    ) => {
      options?.onUpdate?.(to)
      return { stop: () => {} }
    },
  }
})
```

그리고 `grep -n "matchMedia" vitest.setup.ts`로 확인해 **없으면** 파일 끝(IntersectionObserverMock 아래)에 추가:

```ts
if (!window.matchMedia) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))
  )
}
```

- [ ] **Step 4: 컴포넌트 구현**

Create `app/components/motion/lazy-motion-provider.tsx`:

```tsx
'use client'

import { LazyMotion, domAnimation } from 'motion/react'
import type { ReactNode } from 'react'

/** m.* 컴포넌트용 전역 LazyMotion 컨텍스트 (domAnimation 서브셋) */
export default function LazyMotionProvider({
  children,
}: {
  children: ReactNode
}) {
  return <LazyMotion features={domAnimation}>{children}</LazyMotion>
}
```

Create `app/components/motion/reveal.tsx`:

```tsx
'use client'

import { m, useReducedMotion } from 'motion/react'
import type { ReactNode } from 'react'

/** 표준 스크롤 리빌 래퍼: opacity 0→1 + y 8px→0, 1회 실행 */
export default function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode
  className?: string
  delay?: number
}) {
  const shouldReduce = useReducedMotion()

  return (
    <m.div
      className={className}
      initial={shouldReduce ? false : { opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-10% 0px' }}
      transition={{ duration: 0.5, ease: 'easeOut', delay }}
    >
      {children}
    </m.div>
  )
}
```

Create `app/(home)/[lang]/template.tsx`:

```tsx
'use client'

import { m, useReducedMotion } from 'motion/react'
import type { ReactNode } from 'react'

/** 라우트 enter 페이드 (exit 애니메이션은 비범위 — 스펙 §10) */
export default function Template({ children }: { children: ReactNode }) {
  const shouldReduce = useReducedMotion()

  return (
    <m.div
      initial={shouldReduce ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
    >
      {children}
    </m.div>
  )
}
```

- [ ] **Step 5: layout 배선 + m 전환**

`app/(home)/[lang]/layout.tsx`: `import LazyMotionProvider from '@/app/components/motion/lazy-motion-provider'` 추가, body 내부를 래핑:

```tsx
      <body>
        <LazyMotionProvider>
          <Header lang={lang} />
          {children}
          <Footer />
        </LazyMotionProvider>
      </body>
```

`app/components/header/navigation-list.tsx`: `import { motion } from 'motion/react'` → `import { m } from 'motion/react'`, 본문의 `motion.div` → `m.div` (1곳, MotionLink 내부).

`app/components/show-more-content.tsx`: 동일하게 `motion` → `m` 교체 (import 1곳 + `motion.div` 1곳).

- [ ] **Step 6: 통과 확인**

Run: `pnpm vitest run tests/components/motion-reveal.test.tsx && pnpm test && pnpm test:types`
Expected: 신규 1 테스트 PASS + 기존 전체 PASS(모의 확장은 상위 집합이라 기존 테스트 영향 없음).

- [ ] **Step 7: Commit**

```bash
git add app/components/motion "app/(home)/[lang]/template.tsx" "app/(home)/[lang]/layout.tsx" app/components/header/navigation-list.tsx app/components/show-more-content.tsx vitest.setup.ts tests/components/motion-reveal.test.tsx
git commit -m "feat: add LazyMotion provider, Reveal helper, and route enter template"
```

---

### Task 10: 홈 히어로 + Starfield 캔버스

**Files:**
- Create: `app/components/home/starfield-canvas.tsx`, `app/components/home/hero.tsx`
- Test: `tests/components/home-hero.test.tsx`

**Interfaces:**
- Consumes: Task 2 토큰, Task 9 mock.
- Produces: `<Hero lang={Locale}>` — Task 14 홈 페이지가 소비. Starfield는 hero 내부 구현 세부.

- [ ] **Step 1: 실패하는 테스트 작성**

Create `tests/components/home-hero.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import Hero from '@/app/components/home/hero'

describe('Hero', () => {
  it('renders the headline and CTA links', () => {
    render(<Hero lang={'en'} />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Connect. Learn. Grow.'
    )
    expect(screen.getByRole('link', { name: 'About us' })).toHaveAttribute(
      'href',
      '/en/about'
    )
    expect(screen.getByRole('link', { name: 'Join us' })).toHaveAttribute(
      'href',
      '/en/recruit'
    )
  })

  it('renders Korean CTAs for ko locale', () => {
    render(<Hero lang={'ko'} />)
    expect(screen.getByRole('link', { name: '소개 보기' })).toHaveAttribute(
      'href',
      '/ko/about'
    )
  })
})
```

- [ ] **Step 2: 실패 확인**

Run: `pnpm vitest run tests/components/home-hero.test.tsx`
Expected: FAIL — 모듈 없음.

- [ ] **Step 3: Starfield 구현**

Create `app/components/home/starfield-canvas.tsx` (단일 canvas + rAF, 탭 비가시 시 정지, reduced-motion이면 1회 정적 드로우 — 스펙 §7):

```tsx
'use client'

import { useEffect, useRef } from 'react'

const STAR_COLORS = ['#4285f4', '#34a853', '#f9ab00', '#ea4335', '#1b3a75']
const STAR_DENSITY = 1 / 14000 // px²당 별 밀도
const STREAK_INTERVAL_MS = 2600
const STREAK_LIFETIME_MS = 900

type Star = {
  x: number
  y: number
  radius: number
  color: string
  phase: number
  speed: number
}

type Streak = { x: number; y: number; angle: number; bornAt: number; color: string }

export default function StarfieldCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) {
      return
    }
    const context = canvas.getContext('2d')
    if (!context) {
      return
    }

    const reduceMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2)

    let stars: Star[] = []
    let streaks: Streak[] = []
    let rafId = 0
    let lastStreakAt = 0
    let width = 0
    let height = 0

    function pickColor(): string {
      return STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)]!
    }

    function seedStars() {
      const count = Math.max(30, Math.round(width * height * STAR_DENSITY))
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: 0.6 + Math.random() * 1.6,
        color: pickColor(),
        phase: Math.random() * Math.PI * 2,
        speed: 0.4 + Math.random() * 0.8,
      }))
    }

    function drawFrame(time: number) {
      if (!context) {
        return
      }
      context.clearRect(0, 0, width, height)

      for (const star of stars) {
        const twinkle = reduceMotion
          ? 0.55
          : 0.3 + 0.45 * Math.abs(Math.sin(star.phase + time * 0.001 * star.speed))
        context.globalAlpha = twinkle
        context.fillStyle = star.color
        context.beginPath()
        context.arc(star.x, star.y, star.radius, 0, Math.PI * 2)
        context.fill()
      }

      if (!reduceMotion) {
        if (time - lastStreakAt > STREAK_INTERVAL_MS) {
          lastStreakAt = time
          streaks.push({
            x: Math.random() * width,
            y: Math.random() * height * 0.5,
            angle: Math.random() > 0.5 ? Math.PI / 4 : (3 * Math.PI) / 4,
            bornAt: time,
            color: pickColor(),
          })
        }
        streaks = streaks.filter(
          (streak) => time - streak.bornAt < STREAK_LIFETIME_MS
        )
        for (const streak of streaks) {
          const progress = (time - streak.bornAt) / STREAK_LIFETIME_MS
          const distance = progress * 220
          const headX = streak.x + Math.cos(streak.angle) * distance
          const headY = streak.y + Math.sin(streak.angle) * distance
          context.globalAlpha = 0.7 * (1 - progress)
          context.strokeStyle = streak.color
          context.lineWidth = 2
          context.beginPath()
          context.moveTo(
            headX - Math.cos(streak.angle) * 60,
            headY - Math.sin(streak.angle) * 60
          )
          context.lineTo(headX, headY)
          context.stroke()
        }
      }

      context.globalAlpha = 1
    }

    function loop(time: number) {
      drawFrame(time)
      rafId = requestAnimationFrame(loop)
    }

    function resize() {
      if (!canvas) {
        return
      }
      width = canvas.clientWidth
      height = canvas.clientHeight
      canvas.width = Math.round(width * pixelRatio)
      canvas.height = Math.round(height * pixelRatio)
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
      seedStars()
      if (reduceMotion) {
        drawFrame(0)
      }
    }

    function handleVisibility() {
      cancelAnimationFrame(rafId)
      if (!document.hidden && !reduceMotion) {
        rafId = requestAnimationFrame(loop)
      }
    }

    resize()
    if (!reduceMotion) {
      rafId = requestAnimationFrame(loop)
    }

    window.addEventListener('resize', resize)
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('resize', resize)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={'absolute inset-0 -z-10 h-full w-full'}
    />
  )
}
```

- [ ] **Step 4: Hero 구현**

Create `app/components/home/hero.tsx`:

```tsx
'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'
import { m, useReducedMotion } from 'motion/react'
import type { Locale } from '@/i18n-config'

const StarfieldCanvas = dynamic(
  () => import('@/app/components/home/starfield-canvas'),
  { ssr: false }
)

const heroContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
}

const heroItem = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
} as const

const HERO_COPY = {
  tagline: {
    en: 'Google Developer Group on Campus · Yonsei University',
    ko: 'Google Developer Group on Campus · 연세대학교',
  },
  subtitle: {
    en: 'A community of student developers who connect, learn, and grow together — building solutions for campus and society.',
    ko: '함께 연결되고, 배우고, 성장하는 학생 개발자 커뮤니티 — 캠퍼스와 사회를 위한 솔루션을 만듭니다.',
  },
  aboutCta: { en: 'About us', ko: '소개 보기' },
  joinCta: { en: 'Join us', ko: '함께하기' },
} as const

export default function Hero({ lang }: { lang: Locale }) {
  const shouldReduce = useReducedMotion()

  return (
    <section
      className={
        'relative flex min-h-[calc(100svh-4.5rem)] w-full flex-col items-center justify-center overflow-hidden px-6 py-24'
      }
    >
      <StarfieldCanvas />
      <m.div
        variants={heroContainer}
        initial={shouldReduce ? 'visible' : 'hidden'}
        animate={'visible'}
        className={
          'flex w-full max-w-4xl flex-col items-center gap-6 text-center'
        }
      >
        <m.p
          variants={heroItem}
          className={
            'text-yonsei-blue font-mono text-xs tracking-widest uppercase md:text-sm'
          }
        >
          {HERO_COPY.tagline[lang]}
        </m.p>
        <m.h1
          variants={heroItem}
          className={
            'text-ink text-5xl font-bold tracking-tight text-balance md:text-7xl'
          }
        >
          Connect. <span className={'text-gdg-blue-300'}>Learn.</span>{' '}
          <span className={'text-yonsei-blue'}>Grow.</span>
        </m.h1>
        <m.p variants={heroItem} className={'text-ink/70 max-w-xl text-lg'}>
          {HERO_COPY.subtitle[lang]}
        </m.p>
        <m.div
          variants={heroItem}
          className={'flex flex-wrap justify-center gap-3'}
        >
          <Link
            href={`/${lang}/about`}
            className={
              'bg-yonsei-blue rounded-full px-6 py-2.5 font-semibold text-white transition-transform hover:-translate-y-0.5'
            }
          >
            {HERO_COPY.aboutCta[lang]}
          </Link>
          <Link
            href={`/${lang}/recruit`}
            className={
              'border-ink/15 bg-surface-raised text-ink rounded-full border px-6 py-2.5 font-semibold transition-transform hover:-translate-y-0.5'
            }
          >
            {HERO_COPY.joinCta[lang]}
          </Link>
        </m.div>
      </m.div>
    </section>
  )
}
```

- [ ] **Step 5: 통과 확인**

Run: `pnpm vitest run tests/components/home-hero.test.tsx && pnpm test:types`
Expected: PASS (2 tests). jsdom에서 canvas `getContext`가 null이어도 컴포넌트는 조기 return으로 안전.

- [ ] **Step 6: Commit**

```bash
git add app/components/home/starfield-canvas.tsx app/components/home/hero.tsx tests/components/home-hero.test.tsx
git commit -m "feat: add home hero with GPU-friendly starfield canvas"
```

---

### Task 11: Activity Heatmap 아일랜드 + 리빌 CSS

**Files:**
- Create: `app/components/home/activity-heatmap.tsx`
- Modify: `app/globals.css` (셀 리빌 keyframes)
- Test: `tests/components/activity-heatmap.test.tsx`

**Interfaces:**
- Consumes: Task 6의 `HeatmapWeek`/`CATEGORY_CELL_CLASS`/`CATEGORY_LABEL`/`CATEGORY_PRIORITY`/`intensityOpacity`.
- Produces: `<ActivityHeatmap weeks={HeatmapWeek[]} lang={Locale}>` — Task 14가 소비. 셀은 `button`(aria-label), 상세 패널은 `aria-live` + 고정 min-h(CLS 방지). 스펙 §8의 absolute 툴팁 대신 **예약 공간 detail panel** 방식을 채택 — '레이아웃 밀림 없음'·키보드 접근 요건을 더 단순하게 충족하는 구현 세부 변경.

- [ ] **Step 1: 실패하는 테스트 작성**

Create `tests/components/activity-heatmap.test.tsx`:

```tsx
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import ActivityHeatmap from '@/app/components/home/activity-heatmap'
import { buildHeatmapWeeks } from '@/lib/heatmap'

const REFERENCE = new Date('2026-07-11T09:00:00.000Z')

describe('ActivityHeatmap', () => {
  it('renders 52 week cells and the empty caption when there is no data', () => {
    render(
      <ActivityHeatmap weeks={buildHeatmapWeeks([], REFERENCE)} lang={'en'} />
    )
    expect(screen.getAllByRole('button')).toHaveLength(52)
    expect(screen.getByText('No activities recorded yet.')).toBeInTheDocument()
  })

  it('shows week details when a filled cell receives focus', () => {
    const weeks = buildHeatmapWeeks(
      [
        {
          id: 's-1',
          name: 'T19 Week 1',
          nameKo: 'T19 1주차',
          startAt: '2026-07-07T10:00:00.000Z',
          category: 'tech_talk',
          participantCount: 12,
        },
      ],
      REFERENCE
    )
    render(<ActivityHeatmap weeks={weeks} lang={'en'} />)

    const filledCell = screen.getByRole('button', {
      name: 'Week of 2026-07-06: 1 activities',
    })
    fireEvent.focus(filledCell)

    expect(screen.getByText('T19 Week 1')).toBeInTheDocument()
    expect(screen.getByText(/12 participants/)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: 실패 확인**

Run: `pnpm vitest run tests/components/activity-heatmap.test.tsx`
Expected: FAIL — 모듈 없음.

- [ ] **Step 3: 컴포넌트 구현**

Create `app/components/home/activity-heatmap.tsx`:

```tsx
'use client'

import { type CSSProperties, useState } from 'react'
import { m } from 'motion/react'
import type { Locale } from '@/i18n-config'
import {
  CATEGORY_CELL_CLASS,
  CATEGORY_LABEL,
  CATEGORY_PRIORITY,
  intensityOpacity,
  type HeatmapWeek,
} from '@/lib/heatmap'

const HEATMAP_COPY = {
  caption: { en: 'Last 52 weeks', ko: '최근 52주' },
  empty: {
    en: 'No activities recorded yet.',
    ko: '아직 기록된 활동이 없어요.',
  },
} as const

function formatWeekLabel(weekKey: string, lang: Locale): string {
  return lang === 'ko' ? `${weekKey} 주` : `Week of ${weekKey}`
}

function cellAriaLabel(week: HeatmapWeek, lang: Locale): string {
  if (week.count === 0) {
    return lang === 'ko'
      ? `${formatWeekLabel(week.weekKey, 'ko')}: 활동 없음`
      : `${formatWeekLabel(week.weekKey, 'en')}: no activity`
  }
  return lang === 'ko'
    ? `${formatWeekLabel(week.weekKey, 'ko')}: 활동 ${week.count}건`
    : `${formatWeekLabel(week.weekKey, 'en')}: ${week.count} activities`
}

export default function ActivityHeatmap({
  weeks,
  lang,
}: {
  weeks: HeatmapWeek[]
  lang: Locale
}) {
  const [revealed, setRevealed] = useState(false)
  const [activeWeekKey, setActiveWeekKey] = useState<string | null>(null)

  const total = weeks.reduce((sum, week) => sum + week.count, 0)
  const activeWeek =
    weeks.find((week) => week.weekKey === activeWeekKey && week.count > 0) ??
    null

  return (
    <m.div
      onViewportEnter={() => setRevealed(true)}
      viewport={{ once: true, margin: '-10% 0px' }}
      className={'flex w-full flex-col gap-4'}
    >
      <div
        className={`grid grid-cols-[repeat(auto-fill,minmax(1.75rem,1fr))] gap-1.5 ${
          revealed ? 'heatmap-grid-revealed' : ''
        }`}
      >
        {weeks.map((week, index) => (
          <button
            key={week.weekKey}
            type={'button'}
            aria-label={cellAriaLabel(week, lang)}
            onMouseEnter={() => setActiveWeekKey(week.weekKey)}
            onMouseLeave={() => setActiveWeekKey(null)}
            onFocus={() => setActiveWeekKey(week.weekKey)}
            onBlur={() => setActiveWeekKey(null)}
            className={'heatmap-cell relative aspect-square w-full rounded-sm'}
            style={{ '--i': index } as CSSProperties}
          >
            <span
              aria-hidden
              className={`absolute inset-0 rounded-sm ${
                week.dominantCategory
                  ? CATEGORY_CELL_CLASS[week.dominantCategory]
                  : 'border-ink/10 bg-surface-raised border'
              }`}
              style={{
                opacity: week.dominantCategory
                  ? intensityOpacity(week.count)
                  : 1,
              }}
            />
          </button>
        ))}
      </div>

      <div className={'flex flex-wrap items-center gap-x-4 gap-y-1'}>
        {CATEGORY_PRIORITY.map((category) => (
          <span key={category} className={'flex items-center gap-1.5'}>
            <span
              aria-hidden
              className={`size-2 rounded-full ${CATEGORY_CELL_CLASS[category]}`}
            />
            <span className={'text-ink/60 font-mono text-xs'}>
              {CATEGORY_LABEL[category][lang]}
            </span>
          </span>
        ))}
        <span className={'text-ink/40 ml-auto font-mono text-xs'}>
          {HEATMAP_COPY.caption[lang]}
        </span>
      </div>

      <div aria-live={'polite'} className={'min-h-24'}>
        {total === 0 && (
          <p className={'text-ink/60'}>{HEATMAP_COPY.empty[lang]}</p>
        )}
        {activeWeek && (
          <div
            className={'bg-surface-raised rounded-xl p-4 shadow-sm'}
            style={{ contain: 'layout style paint' }}
          >
            <p className={'text-ink/50 font-mono text-xs'}>
              {formatWeekLabel(activeWeek.weekKey, lang)}
            </p>
            <ul className={'mt-1 flex flex-col gap-1'}>
              {activeWeek.sessions.map((session) => (
                <li key={session.id} className={'flex items-baseline gap-2'}>
                  <span
                    aria-hidden
                    className={`size-2 shrink-0 self-center rounded-full ${
                      CATEGORY_CELL_CLASS[session.category]
                    }`}
                  />
                  <span className={'text-ink font-medium'}>
                    {lang === 'ko' ? session.nameKo : session.name}
                  </span>
                  <span className={'text-ink/50 font-mono text-xs'}>
                    {session.startAt.slice(0, 10)} ·{' '}
                    {lang === 'ko'
                      ? `${session.participantCount}명 참여`
                      : `${session.participantCount} participants`}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </m.div>
  )
}
```

- [ ] **Step 4: 리빌 CSS 추가**

`app/globals.css`의 `@layer base { :focus-visible ... }` 블록 아래에 추가:

```css
/* Activity heatmap 셀 리빌 — 컴포지터 전용(opacity/transform), --i 기반 stagger */
.heatmap-cell {
  opacity: 0;
  transform: scale(0.6);
  contain: layout style paint;
}

.heatmap-grid-revealed .heatmap-cell {
  animation: heatmap-cell-in 0.35s ease-out both;
  animation-delay: calc(var(--i) * 12ms);
}

@keyframes heatmap-cell-in {
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@media (prefers-reduced-motion: reduce) {
  .heatmap-cell {
    opacity: 1;
    transform: none;
  }
  .heatmap-grid-revealed .heatmap-cell {
    animation: none;
  }
}
```

- [ ] **Step 5: 통과 확인**

Run: `pnpm vitest run tests/components/activity-heatmap.test.tsx && pnpm test:types`
Expected: PASS (2 tests)

- [ ] **Step 6: Commit**

```bash
git add app/components/home/activity-heatmap.tsx app/globals.css tests/components/activity-heatmap.test.tsx
git commit -m "feat: add activity heatmap island with CSS stagger reveal"
```

---

### Task 12: Parts Bento Grid + 콘텐츠 확장

**Files:**
- Modify: `lib/contents/parts-section.ts` (named export `bentoParts` 추가 — default export는 그대로)
- Create: `app/components/home/parts-bento-grid.tsx`
- Test: `tests/components/parts-bento-grid.test.tsx`

**Interfaces:**
- Produces: `bentoParts: BentoPart[]`(6칸: Organizer(wide)+FE/BE/ML·AI/UI·UX/DevRel — 스펙 §7·일탈 ⑦), `<PartsBentoGrid lang={Locale}>`. Task 15의 parts-deepdive도 `bentoParts`의 Organizer 항목을 재사용.

- [ ] **Step 1: 실패하는 테스트 작성**

Create `tests/components/parts-bento-grid.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import PartsBentoGrid from '@/app/components/home/parts-bento-grid'

describe('PartsBentoGrid', () => {
  it('renders all six fixed parts with Organizer spanning wide', () => {
    render(<PartsBentoGrid lang={'en'} />)

    for (const title of [
      'Organizer',
      'Front-End',
      'Back-End',
      'ML/AI',
      'UI/UX',
      'DevRel',
    ]) {
      expect(screen.getByRole('heading', { name: title })).toBeInTheDocument()
    }

    const organizerCard = screen
      .getByRole('heading', { name: 'Organizer' })
      .closest('article')
    expect(organizerCard?.className).toContain('md:col-span-2')
  })
})
```

- [ ] **Step 2: 실패 확인**

Run: `pnpm vitest run tests/components/parts-bento-grid.test.tsx`
Expected: FAIL — 모듈 없음.

- [ ] **Step 3: 콘텐츠 확장**

`lib/contents/parts-section.ts` 파일 끝(`export default partsSectionContent` **위**)에 추가:

```ts
export type BentoPart = {
  key: string
  title: string
  span: 'wide' | 'default'
  accentClass: string
  content: { en: string; ko: string }
}

function byTitle(title: string) {
  const part = partsSectionContent.find((entry) => entry.title === title)
  if (!part) {
    throw new Error(`Unknown part title: ${title}`)
  }
  return part
}

/** 홈 bento 6칸 (프롬프트 고정 구성 — Organizer 포함, DB parts와 무관한 정적 콘텐츠) */
export const bentoParts: BentoPart[] = [
  {
    key: 'organizer',
    title: 'Organizer',
    span: 'wide',
    accentClass: 'bg-yonsei-blue',
    content: {
      en: 'Leads GDGoC Yonsei end to end — designing programs like T19 and demo days, partnering with Google and other chapters, and keeping the community healthy.',
      ko: 'GDGoC Yonsei 운영 전반을 이끕니다 — T19·데모데이 같은 프로그램 설계, 구글·타 챕터와의 협력, 커뮤니티 운영까지 담당합니다.',
    },
  },
  {
    key: 'frontend',
    title: 'Front-End',
    span: 'default',
    accentClass: 'bg-gdg-blue-300',
    content: byTitle('Front-End').content,
  },
  {
    key: 'backend',
    title: 'Back-End',
    span: 'default',
    accentClass: 'bg-gdg-green-300',
    content: byTitle('Back-End').content,
  },
  {
    key: 'ml-ai',
    title: 'ML/AI',
    span: 'default',
    accentClass: 'bg-gdg-red-200',
    content: byTitle('ML/AI').content,
  },
  {
    key: 'ui-ux',
    title: 'UI/UX',
    span: 'default',
    accentClass: 'bg-gdg-red-300',
    content: byTitle('UI/UX').content,
  },
  {
    key: 'devrel',
    title: 'DevRel',
    span: 'default',
    accentClass: 'bg-gdg-yellow-300',
    content: byTitle('DevRel').content,
  },
]
```

- [ ] **Step 4: 컴포넌트 구현**

Create `app/components/home/parts-bento-grid.tsx`:

```tsx
'use client'

import { m, useReducedMotion } from 'motion/react'
import type { Locale } from '@/i18n-config'
import { bentoParts } from '@/lib/contents/parts-section'

const gridVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
}

const cardVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
} as const

export default function PartsBentoGrid({ lang }: { lang: Locale }) {
  const shouldReduce = useReducedMotion()

  return (
    <m.div
      variants={gridVariants}
      initial={shouldReduce ? 'visible' : 'hidden'}
      whileInView={'visible'}
      viewport={{ once: true, margin: '-10% 0px' }}
      className={'grid grid-cols-1 gap-4 md:grid-cols-3'}
    >
      {bentoParts.map((part) => (
        <m.article
          key={part.key}
          variants={cardVariants}
          className={`group bg-surface-raised relative rounded-2xl p-6 transition-transform duration-300 hover:-translate-y-1 hover:scale-[1.01] ${
            part.span === 'wide' ? 'md:col-span-2' : ''
          }`}
          style={{ contain: 'layout style paint' }}
        >
          {/* box-shadow 애니메이션 금지 — 사전 렌더된 그림자 레이어의 opacity만 전환 */}
          <span
            aria-hidden
            className={
              'pointer-events-none absolute inset-0 rounded-2xl opacity-0 shadow-[0_16px_40px_-16px_rgba(11,18,32,0.35)] transition-opacity duration-300 group-hover:opacity-100'
            }
          />
          <span
            aria-hidden
            className={`absolute top-6 left-0 h-8 w-1 rounded-r ${part.accentClass}`}
          />
          <h3 className={'text-ink text-xl font-semibold'}>{part.title}</h3>
          <p className={'text-ink/70 mt-2 text-sm leading-relaxed'}>
            {part.content[lang]}
          </p>
        </m.article>
      ))}
    </m.div>
  )
}
```

- [ ] **Step 5: 통과 확인 + Commit**

```bash
pnpm vitest run tests/components/parts-bento-grid.test.tsx && pnpm test:types
git add lib/contents/parts-section.ts app/components/home/parts-bento-grid.tsx tests/components/parts-bento-grid.test.tsx
git commit -m "feat: add parts bento grid with static six-part content"
```

---

### Task 13: Projects Showcase (태그 필터 + FLIP)

**Files:**
- Create: `app/components/home/projects-showcase.tsx`
- Test: `tests/components/projects-showcase.test.tsx`

**Interfaces:**
- Consumes: Task 7의 `FeaturedProject` 타입(**`import type`만** — server-only 모듈이므로 런타임 import 금지).
- Produces: `<ProjectsShowcase projects={FeaturedProject[]} lang={Locale}>`. layout FLIP은 `domMax`가 필요하므로 이 컴포넌트 내부에서만 중첩 `<LazyMotion features={domMax}>` 사용(스펙 §7 — 전역 domAnimation 유지).

- [ ] **Step 1: 실패하는 테스트 작성**

Create `tests/components/projects-showcase.test.tsx`:

```tsx
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import ProjectsShowcase from '@/app/components/home/projects-showcase'

const projects = [
  {
    id: 'p-1',
    name: 'Compass',
    nameKo: '나침반',
    description: 'Indoor navigation',
    descriptionKo: '실내 길찾기',
    mainImage: '/project-default.png',
    repoUrl: 'https://github.com/gdg-yonsei/compass',
    demoUrl: null,
    generationName: '25-26',
    tags: ['Next.js'],
  },
  {
    id: 'p-2',
    name: 'Lens',
    nameKo: '렌즈',
    description: 'Lecture summarization',
    descriptionKo: '강의 요약',
    mainImage: '/project-default.png',
    repoUrl: null,
    demoUrl: null,
    generationName: '25-26',
    tags: ['PyTorch'],
  },
]

describe('ProjectsShowcase', () => {
  it('links each card to its project detail page', () => {
    render(<ProjectsShowcase projects={projects} lang={'en'} />)
    expect(screen.getByRole('link', { name: /Compass/ })).toHaveAttribute(
      'href',
      '/en/project/25-26/p-1'
    )
  })

  it('filters cards by tag', () => {
    render(<ProjectsShowcase projects={projects} lang={'en'} />)
    fireEvent.click(screen.getByRole('button', { name: 'Next.js' }))
    expect(screen.getByText('Compass')).toBeInTheDocument()
    expect(screen.queryByText('Lens')).not.toBeInTheDocument()
  })

  it('renders the empty placeholder when there are no projects', () => {
    render(<ProjectsShowcase projects={[]} lang={'ko'} />)
    expect(
      screen.getByText('어드민(GYMS)에서 프로젝트를 등록하면 이곳에 표시됩니다.')
    ).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: 실패 확인**

Run: `pnpm vitest run tests/components/projects-showcase.test.tsx`
Expected: FAIL — 모듈 없음.

- [ ] **Step 3: 구현**

Create `app/components/home/projects-showcase.tsx`:

```tsx
'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { LazyMotion, domMax, m, useReducedMotion } from 'motion/react'
import type { Locale } from '@/i18n-config'
import type { FeaturedProject } from '@/lib/server/queries/public/home'

const SHOWCASE_COPY = {
  all: { en: 'All', ko: '전체' },
  empty: {
    en: 'Projects will appear here once they are published in GYMS.',
    ko: '어드민(GYMS)에서 프로젝트를 등록하면 이곳에 표시됩니다.',
  },
  repo: { en: 'Code', ko: '코드' },
  demo: { en: 'Demo', ko: '데모' },
} as const

function tagPillClass(active: boolean): string {
  return `rounded-full px-3 py-1 font-mono text-xs transition-colors ${
    active
      ? 'bg-ink text-white'
      : 'bg-surface-raised text-ink/70 border-ink/10 border'
  }`
}

export default function ProjectsShowcase({
  projects,
  lang,
}: {
  projects: FeaturedProject[]
  lang: Locale
}) {
  const shouldReduce = useReducedMotion()
  const [activeTag, setActiveTag] = useState<string | null>(null)

  if (projects.length === 0) {
    return (
      <div
        className={
          'border-ink/10 bg-surface-raised rounded-2xl border border-dashed p-10 text-center'
        }
      >
        <p className={'text-ink/60'}>{SHOWCASE_COPY.empty[lang]}</p>
      </div>
    )
  }

  const allTags = [...new Set(projects.flatMap((project) => project.tags))]
  const visibleProjects = activeTag
    ? projects.filter((project) => project.tags.includes(activeTag))
    : projects

  return (
    <LazyMotion features={domMax}>
      <div className={'flex flex-col gap-6'}>
        <div className={'flex flex-wrap gap-2'}>
          <button
            type={'button'}
            onClick={() => setActiveTag(null)}
            aria-pressed={activeTag === null}
            className={tagPillClass(activeTag === null)}
          >
            {SHOWCASE_COPY.all[lang]}
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              type={'button'}
              onClick={() => setActiveTag(activeTag === tag ? null : tag)}
              aria-pressed={activeTag === tag}
              className={tagPillClass(activeTag === tag)}
            >
              {tag}
            </button>
          ))}
        </div>

        <div
          className={'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'}
        >
          {visibleProjects.map((project) => (
            <m.article
              key={project.id}
              layout={!shouldReduce}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className={
                'bg-surface-raised relative overflow-hidden rounded-2xl'
              }
              style={{ contain: 'layout style paint' }}
            >
              <Link
                href={`/${lang}/project/${project.generationName}/${project.id}`}
                className={'block'}
              >
                <div className={'relative aspect-video w-full'}>
                  <Image
                    src={project.mainImage}
                    alt={
                      lang === 'ko'
                        ? (project.nameKo ?? project.name)
                        : project.name
                    }
                    fill
                    sizes={
                      '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw'
                    }
                    className={'object-cover'}
                  />
                </div>
                <div className={'flex flex-col gap-2 p-5'}>
                  <span className={'text-ink/40 font-mono text-xs'}>
                    {project.generationName}
                  </span>
                  <h3 className={'text-ink text-lg font-semibold'}>
                    {lang === 'ko'
                      ? (project.nameKo ?? project.name)
                      : project.name}
                  </h3>
                  <p className={'text-ink/60 line-clamp-2 text-sm'}>
                    {lang === 'ko'
                      ? (project.descriptionKo ?? project.description)
                      : project.description}
                  </p>
                  <div className={'flex flex-wrap gap-1.5'}>
                    {project.tags.map((tag) => (
                      <span
                        key={tag}
                        className={
                          'bg-surface text-ink/60 rounded-full px-2 py-0.5 font-mono text-[11px]'
                        }
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </Link>
              {(project.repoUrl || project.demoUrl) && (
                <div className={'flex gap-3 px-5 pb-4'}>
                  {project.repoUrl && (
                    <a
                      href={project.repoUrl}
                      target={'_blank'}
                      rel={'noreferrer noopener'}
                      className={'text-yonsei-blue font-mono text-xs underline'}
                    >
                      {SHOWCASE_COPY.repo[lang]} ↗
                    </a>
                  )}
                  {project.demoUrl && (
                    <a
                      href={project.demoUrl}
                      target={'_blank'}
                      rel={'noreferrer noopener'}
                      className={'text-yonsei-blue font-mono text-xs underline'}
                    >
                      {SHOWCASE_COPY.demo[lang]} ↗
                    </a>
                  )}
                </div>
              )}
            </m.article>
          ))}
        </div>
      </div>
    </LazyMotion>
  )
}
```

- [ ] **Step 4: 통과 확인 + Commit**

```bash
pnpm vitest run tests/components/projects-showcase.test.tsx && pnpm test:types
git add app/components/home/projects-showcase.tsx tests/components/projects-showcase.test.tsx
git commit -m "feat: add projects showcase with tag filter and FLIP layout"
```

---

### Task 14: 홈 페이지 재조립 (+ About Teaser)

**Files:**
- Create: `app/components/home/about-teaser.tsx`
- Rewrite: `app/(home)/[lang]/page.tsx`

**Interfaces:**
- Consumes: Task 6·7·10·11·12·13 산출물, `getSessionVisibilityBucket`(기존), `connection`(next/server).
- Produces: 새 홈 — HERO → ABOUT TEASER → ACTIVITY HEATMAP(Suspense+connection) → PARTS BENTO → PROJECTS SHOWCASE. 구 섹션 import 전부 제거(파일 삭제는 Task 16).

- [ ] **Step 1: About Teaser 작성**

Create `app/components/home/about-teaser.tsx`:

```tsx
import Link from 'next/link'
import Reveal from '@/app/components/motion/reveal'
import type { Locale } from '@/i18n-config'
import aboutSectionContents from '@/lib/contents/about-section'

const TEASER_COPY = {
  title: {
    en: 'Connect · Learn · Grow at Yonsei',
    ko: '연세에서 Connect · Learn · Grow',
  },
  cta: { en: 'Learn more →', ko: '자세히 보기 →' },
} as const

export default function AboutTeaser({ lang }: { lang: Locale }) {
  return (
    <section className={'w-full px-6 py-24'}>
      <Reveal className={'mx-auto flex max-w-4xl flex-col gap-5'}>
        <p className={'text-yonsei-blue font-mono text-xs tracking-widest'}>
          ABOUT
        </p>
        <h2 className={'text-ink text-3xl font-bold md:text-4xl'}>
          {TEASER_COPY.title[lang]}
        </h2>
        <p className={'text-ink/70 max-w-2xl leading-relaxed'}>
          {aboutSectionContents.gdgCommunity[lang]}
        </p>
        <Link
          href={`/${lang}/about`}
          className={'text-yonsei-blue font-semibold hover:underline'}
        >
          {TEASER_COPY.cta[lang]}
        </Link>
      </Reveal>
    </section>
  )
}
```

- [ ] **Step 2: 홈 페이지 재작성**

`app/(home)/[lang]/page.tsx` 전체를 아래로 교체:

```tsx
import { Suspense } from 'react'
import { connection } from 'next/server'
import type { Locale } from '@/i18n-config'
import languageParamChecker from '@/lib/language-param-checker'
import { buildHeatmapWeeks, type ActivityCategory } from '@/lib/heatmap'
import { getSessionVisibilityBucket } from '@/lib/server/cache/policy'
import {
  getFeaturedProjects,
  getHeatmapSessions,
} from '@/lib/server/queries/public/home'
import AboutTeaser from '@/app/components/home/about-teaser'
import ActivityHeatmap from '@/app/components/home/activity-heatmap'
import Hero from '@/app/components/home/hero'
import PartsBentoGrid from '@/app/components/home/parts-bento-grid'
import ProjectsShowcase from '@/app/components/home/projects-showcase'

// SSG 파라미터 (기존과 동일)
export function generateStaticParams() {
  return [{ lang: 'en' }, { lang: 'ko' }]
}

const SECTION_TITLES = {
  activity: { en: 'Activity', ko: '활동' },
  parts: { en: 'Parts', ko: '파트' },
  projects: { en: 'Projects', ko: '프로젝트' },
} as const

function SectionHeading({
  label,
  lang,
}: {
  label: keyof typeof SECTION_TITLES
  lang: Locale
}) {
  return (
    <div className={'mb-8 flex items-baseline gap-3'}>
      <span
        className={
          'text-yonsei-blue font-mono text-xs tracking-widest uppercase'
        }
      >
        {label}
      </span>
      <h2 className={'text-ink text-3xl font-bold md:text-4xl'}>
        {SECTION_TITLES[label][lang]}
      </h2>
    </div>
  )
}

function HeatmapSkeleton() {
  return (
    <div
      className={
        'grid grid-cols-[repeat(auto-fill,minmax(1.75rem,1fr))] gap-1.5'
      }
    >
      {Array.from({ length: 52 }, (_, index) => (
        <div
          key={index}
          className={
            'bg-surface-raised border-ink/5 aspect-square w-full animate-pulse rounded-sm border'
          }
        />
      ))}
    </div>
  )
}

async function HeatmapSection({ lang }: { lang: Locale }) {
  // 현재 시각(visibility bucket) 사용 — 기존 세션 페이지와 동일하게 connection()으로 동적 처리
  await connection()
  const visibilityBucket = getSessionVisibilityBucket()
  const rows = await getHeatmapSessions(lang, visibilityBucket)

  const weeks = buildHeatmapWeeks(
    rows
      .filter((row) => row.startAt !== null)
      .map((row) => ({
        id: row.id,
        name: row.name,
        nameKo: row.nameKo,
        startAt: row.startAt!.toISOString(),
        category: row.category as ActivityCategory,
        participantCount: row.internalCount + row.externalCount,
      })),
    new Date(visibilityBucket)
  )

  return <ActivityHeatmap weeks={weeks} lang={lang} />
}

async function ProjectsSection({ lang }: { lang: Locale }) {
  const projects = await getFeaturedProjects(lang)
  return <ProjectsShowcase projects={projects} lang={lang} />
}

/**
 * GDGoC Yonsei 웹사이트 첫 페이지 — 리디자인 (스펙 §7)
 */
export default async function HomePage({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const lang = languageParamChecker((await params).lang)

  return (
    <main className={'flex w-full flex-col overflow-x-hidden pt-[4.5rem]'}>
      <Hero lang={lang} />
      <AboutTeaser lang={lang} />
      <section className={'cv-auto w-full px-6 py-24'}>
        <div className={'mx-auto max-w-4xl'}>
          <SectionHeading label={'activity'} lang={lang} />
          <Suspense fallback={<HeatmapSkeleton />}>
            <HeatmapSection lang={lang} />
          </Suspense>
        </div>
      </section>
      <section className={'cv-auto w-full px-6 py-24'}>
        <div className={'mx-auto max-w-5xl'}>
          <SectionHeading label={'parts'} lang={lang} />
          <PartsBentoGrid lang={lang} />
        </div>
      </section>
      <section className={'cv-auto w-full px-6 py-24'}>
        <div className={'mx-auto max-w-5xl'}>
          <SectionHeading label={'projects'} lang={lang} />
          <Suspense fallback={null}>
            <ProjectsSection lang={lang} />
          </Suspense>
        </div>
      </section>
    </main>
  )
}
```

- [ ] **Step 3: 검증 (테스트 + 프로덕션 빌드)**

```bash
pnpm test && pnpm test:types
pnpm build
```

Expected: vitest·tsc 통과. `pnpm build`가 두 로케일 홈 셸을 prerender하고 에러 없이 완료(DB 필요). Heatmap 섹션은 `connection()` 때문에 요청 시 스트리밍(Suspense fallback이 셸에 포함) — 빌드 로그에서 `/[lang]` 관련 prerender 에러가 없어야 함.

- [ ] **Step 4: 수동 확인(선택) 후 Commit**

`pnpm dev` 후 `http://localhost:3000/ko` — 히어로 stagger, 히트맵 채움(시드 데이터), bento hover, 태그 필터가 동작하는지 확인.

```bash
git add app/components/home/about-teaser.tsx "app/(home)/[lang]/page.tsx"
git commit -m "feat: rebuild home page with hero, heatmap, bento, and showcase sections"
```

---

### Task 15: `/[lang]/about` 페이지 신설 (+ sitemap, e2e 라우트)

**Files:**
- Create: `lib/contents/about-page.ts`
- Create: `app/components/about/about-hero.tsx`, `app/components/about/story-section.tsx`, `app/components/about/programs-section.tsx`, `app/components/about/timeline-section.tsx`, `app/components/about/stats-section.tsx`, `app/components/about/parts-deepdive-section.tsx`
- Create: `app/(home)/[lang]/about/page.tsx`
- Modify: `lib/server/queries/public/sitemap.ts`, `tests/e2e/public-route-matrix.spec.ts`
- Test: `tests/components/about-sections.test.tsx`

**Interfaces:**
- Consumes: Task 7 `getCommunityStats`/`getGenerationTimeline`/`CommunityStats`/`GenerationTimelineEntry`, Task 9 `Reveal`, Task 12 `bentoParts`, 기존 `activitySectionContents`·`show-more-content`·SVG(Friends/BookSvg/FriendsTree/Trophy).
- Produces: `/en/about`, `/ko/about` 정적 파라미터 페이지. `<StatsSection stats lang>`, `<TimelineSection entries lang>`.

- [ ] **Step 1: 실패하는 테스트 작성**

Create `tests/components/about-sections.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import AboutHero from '@/app/components/about/about-hero'
import StatsSection from '@/app/components/about/stats-section'

describe('AboutHero', () => {
  it('renders kinetic headline lines', () => {
    render(<AboutHero lang={'en'} />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'We connect students,'
    )
  })
})

describe('StatsSection', () => {
  // vitest mock의 useReducedMotion은 항상 true → 즉시 최종값이 보여야 함 (스펙 §9)
  it('shows final values immediately under reduced motion', () => {
    render(
      <StatsSection
        stats={{
          sessionCount: 60,
          participantTotal: 450,
          partCount: 7,
          projectCount: 8,
        }}
        lang={'en'}
      />
    )
    expect(screen.getByText('60')).toBeInTheDocument()
    expect(screen.getByText('450')).toBeInTheDocument()
    expect(screen.getByText('7')).toBeInTheDocument()
    expect(screen.getByText('8')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: 실패 확인**

Run: `pnpm vitest run tests/components/about-sections.test.tsx`
Expected: FAIL — 모듈 없음.

- [ ] **Step 3: 카피 파일 작성**

Create `lib/contents/about-page.ts`:

```ts
const aboutPageContents = {
  hero: {
    lines: {
      en: ['We connect students,', 'learn out loud,', 'and grow into builders.'],
      ko: ['학생들을 연결하고,', '함께 배우며,', '만드는 사람으로 성장합니다.'],
    },
    sub: {
      en: 'GDG on Campus Yonsei — a Google-backed developer community at Yonsei University.',
      ko: 'GDG on Campus Yonsei — 연세대학교의 구글 기반 개발자 커뮤니티입니다.',
    },
  },
  story: [
    {
      key: 'connect',
      order: '01',
      title: 'Connect',
      body: {
        en: 'We bring together students across majors who care about technology — through weekly gatherings, part communities, and events with other chapters.',
        ko: '전공을 넘어 기술을 좋아하는 학생들을 모읍니다 — 매주 열리는 모임, 파트 커뮤니티, 타 챕터와의 교류 행사로 연결됩니다.',
      },
    },
    {
      key: 'learn',
      order: '02',
      title: 'Learn',
      body: {
        en: 'Every member is both a learner and a teacher. T19 talks, part sessions, and study groups turn individual knowledge into shared knowledge.',
        ko: '모든 멤버는 배우는 사람이자 가르치는 사람입니다. T19 발표, 파트 세션, 스터디로 개인의 지식을 모두의 지식으로 만듭니다.',
      },
    },
    {
      key: 'grow',
      order: '03',
      title: 'Grow',
      body: {
        en: 'From hackathons to demo days, we ship real products for campus and society — and grow into developers who build solutions.',
        ko: '해커톤부터 데모데이까지, 캠퍼스와 사회를 위한 실제 결과물을 만들며 솔루션을 만드는 개발자로 성장합니다.',
      },
    },
  ],
  joinCta: {
    title: { en: 'Build with us', ko: '함께 만들어요' },
    body: {
      en: 'Recruiting opens at the start of each semester. Come build with us.',
      ko: '리크루팅은 매 학기 초에 열립니다. 함께 만들어갈 멤버를 기다립니다.',
    },
    button: { en: 'Go to Recruit', ko: '리크루팅 안내' },
  },
} as const

export default aboutPageContents
```

- [ ] **Step 4: 섹션 컴포넌트 구현 (6개)**

Create `app/components/about/about-hero.tsx`:

```tsx
'use client'

import { m, useReducedMotion } from 'motion/react'
import type { Locale } from '@/i18n-config'
import aboutPageContents from '@/lib/contents/about-page'

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15 } },
}

const lineVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: 'easeOut' },
  },
} as const

export default function AboutHero({ lang }: { lang: Locale }) {
  const shouldReduce = useReducedMotion()

  return (
    <section className={'w-full px-6 pt-32 pb-20'}>
      <m.div
        variants={containerVariants}
        initial={shouldReduce ? 'visible' : 'hidden'}
        animate={'visible'}
        className={'mx-auto flex max-w-4xl flex-col gap-6'}
      >
        <m.p
          variants={lineVariants}
          className={'text-yonsei-blue font-mono text-xs tracking-widest'}
        >
          ABOUT US
        </m.p>
        <h1
          className={
            'text-ink text-4xl leading-tight font-bold text-balance md:text-6xl'
          }
        >
          {aboutPageContents.hero.lines[lang].map((line) => (
            <m.span key={line} variants={lineVariants} className={'block'}>
              {line}
            </m.span>
          ))}
        </h1>
        <m.p variants={lineVariants} className={'text-ink/70 max-w-2xl text-lg'}>
          {aboutPageContents.hero.sub[lang]}
        </m.p>
      </m.div>
    </section>
  )
}
```

Create `app/components/about/story-section.tsx` (Story에 한해 01/02/03 번호 허용 — 스펙 §9):

```tsx
import type { ComponentType } from 'react'
import Reveal from '@/app/components/motion/reveal'
import BookSvg from '@/app/components/svg/book-svg'
import Friends from '@/app/components/svg/friends'
import FriendsTree from '@/app/components/svg/friends-tree'
import type { Locale } from '@/i18n-config'
import aboutPageContents from '@/lib/contents/about-page'

const STORY_ART: Record<string, ComponentType<{ className?: string }>> = {
  connect: Friends,
  learn: BookSvg,
  grow: FriendsTree,
}

export default function StorySection({ lang }: { lang: Locale }) {
  return (
    <section className={'w-full px-6 py-20'}>
      <div className={'mx-auto flex max-w-4xl flex-col gap-16'}>
        {aboutPageContents.story.map((chapter, index) => {
          const Art = STORY_ART[chapter.key]!
          return (
            <Reveal key={chapter.key}>
              <div
                className={`flex flex-col items-center gap-8 md:gap-14 ${
                  index % 2 === 1 ? 'md:flex-row-reverse' : 'md:flex-row'
                }`}
              >
                <div className={'flex-1'}>
                  <p className={'text-yonsei-blue font-mono text-sm'}>
                    {chapter.order}
                  </p>
                  <h3 className={'text-ink mt-1 text-3xl font-bold'}>
                    {chapter.title}
                  </h3>
                  <p className={'text-ink/70 mt-3 leading-relaxed'}>
                    {chapter.body[lang]}
                  </p>
                </div>
                <div
                  className={
                    'flex w-40 shrink-0 items-center justify-center md:w-56'
                  }
                >
                  <Art className={'w-full'} />
                </div>
              </div>
            </Reveal>
          )
        })}
      </div>
    </section>
  )
}
```

주의: 구현 전에 `grep -n "export default\|className" app/components/svg/friends.tsx app/components/svg/friends-tree.tsx app/components/svg/book-svg.tsx`로 default export와 className prop 수용 여부 확인. className을 안 받으면 `<div className={'w-full'}><Art /></div>`로 감싼다.

Create `app/components/about/programs-section.tsx` (이관된 6종 — 기존 카피 그대로, `show-more-content` 재활용, Solution Challenge에 `Trophy`):

```tsx
import ShowMoreContent from '@/app/components/show-more-content'
import Trophy from '@/app/components/svg/trophy'
import Reveal from '@/app/components/motion/reveal'
import type { Locale } from '@/i18n-config'
import activitySectionContents from '@/lib/contents/activity-section'

const PROGRAM_META: Record<string, string> = {
  T19: 'TUE 19:00 · WEEKLY',
  'Part Session': 'BIWEEKLY · PARTS',
  'Solution Challenge': 'GLOBAL · ANNUAL',
  oTP: 'OPEN TEAM PROJECT',
  'Yonsei X Korea Demo Day': 'JOINT DEMO DAY',
  'The Bridge Hackathon': 'KR × JP HACKATHON',
}

const PROGRAM_ACCENT: Record<string, string> = {
  T19: 'bg-gdg-blue-300',
  'Part Session': 'bg-gdg-green-300',
  'Solution Challenge': 'bg-gdg-yellow-300',
  oTP: 'bg-gdg-blue-300',
  'Yonsei X Korea Demo Day': 'bg-yonsei-blue',
  'The Bridge Hackathon': 'bg-gdg-red-300',
}

export default function ProgramsSection({ lang }: { lang: Locale }) {
  return (
    <div className={'grid grid-cols-1 gap-4 md:grid-cols-2'}>
      {activitySectionContents.map((program) => (
        <Reveal key={program.key}>
          <article
            className={
              'bg-surface-raised relative h-full overflow-hidden rounded-2xl p-6 pl-7'
            }
            style={{ contain: 'layout style paint' }}
          >
            <span
              aria-hidden
              className={`absolute top-0 left-0 h-full w-1 ${
                PROGRAM_ACCENT[program.key] ?? 'bg-gdg-blue-300'
              }`}
            />
            <div className={'flex items-start justify-between gap-3'}>
              <div>
                <p
                  className={
                    'text-ink/40 font-mono text-[11px] tracking-widest'
                  }
                >
                  {PROGRAM_META[program.key] ?? ''}
                </p>
                <h3 className={'text-ink mt-1 text-xl font-semibold'}>
                  {program.title}
                </h3>
              </div>
              {program.key === 'Solution Challenge' && (
                <Trophy className={'w-10 shrink-0'} />
              )}
            </div>
            <ShowMoreContent>
              <p className={'text-ink/70 mt-3 text-sm leading-relaxed'}>
                {program.content[lang]}
              </p>
            </ShowMoreContent>
          </article>
        </Reveal>
      ))}
    </div>
  )
}
```

Create `app/components/about/timeline-section.tsx`:

```tsx
'use client'

import { useRef } from 'react'
import { m, useReducedMotion, useScroll } from 'motion/react'
import type { Locale } from '@/i18n-config'
import { CATEGORY_CELL_CLASS, CATEGORY_PRIORITY } from '@/lib/heatmap'
import type { GenerationTimelineEntry } from '@/lib/server/queries/public/home'

const TIMELINE_COPY = {
  empty: {
    en: 'History will appear as generations are added.',
    ko: '기수가 등록되면 연혁이 표시됩니다.',
  },
  present: { en: 'present', ko: '현재' },
} as const

function highlightSessions(entry: GenerationTimelineEntry) {
  return [...entry.sessions]
    .sort(
      (a, b) =>
        CATEGORY_PRIORITY.indexOf(a.category) -
        CATEGORY_PRIORITY.indexOf(b.category)
    )
    .slice(0, 4)
}

export default function TimelineSection({
  entries,
  lang,
}: {
  entries: GenerationTimelineEntry[]
  lang: Locale
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const shouldReduce = useReducedMotion()
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start 80%', 'end 60%'],
  })

  if (entries.length === 0) {
    return <p className={'text-ink/60'}>{TIMELINE_COPY.empty[lang]}</p>
  }

  return (
    <div ref={containerRef} className={'relative pl-6'}>
      <span
        aria-hidden
        className={'bg-ink/10 absolute top-0 left-1 h-full w-0.5 rounded'}
      />
      {/* 진행선: scaleY만 변형 (컴포지터 전용) */}
      <m.span
        aria-hidden
        className={
          'bg-yonsei-blue absolute top-0 left-1 h-full w-0.5 origin-top rounded'
        }
        style={{ scaleY: shouldReduce ? 1 : scrollYProgress }}
      />
      <ol className={'flex flex-col gap-10'}>
        {entries.map((entry) => (
          <li key={entry.id} className={'relative'}>
            <span
              aria-hidden
              className={
                'bg-yonsei-blue absolute top-1.5 -left-6 size-2.5 -translate-x-[3px] rounded-full'
              }
            />
            <p className={'text-ink/40 font-mono text-xs'}>
              {entry.startDate.slice(0, 7)} —{' '}
              {entry.endDate
                ? entry.endDate.slice(0, 7)
                : TIMELINE_COPY.present[lang]}
            </p>
            <h3 className={'text-ink mt-1 text-2xl font-bold'}>{entry.name}</h3>
            <ul className={'mt-3 flex flex-col gap-1.5'}>
              {highlightSessions(entry).map((session) => (
                <li key={session.id} className={'flex items-center gap-2'}>
                  <span
                    aria-hidden
                    className={`size-2 shrink-0 rounded-full ${
                      CATEGORY_CELL_CLASS[session.category]
                    }`}
                  />
                  <span className={'text-ink/80 text-sm'}>
                    {lang === 'ko' ? session.nameKo : session.name}
                  </span>
                </li>
              ))}
              {entry.sessions.length === 0 && (
                <li className={'text-ink/40 text-sm'}>—</li>
              )}
            </ul>
          </li>
        ))}
      </ol>
    </div>
  )
}
```

Create `app/components/about/stats-section.tsx` (하드코딩 금지 — props로 DB 집계, reduced-motion 시 즉시 최종값):

```tsx
'use client'

import { useEffect, useState } from 'react'
import { animate, m, useReducedMotion } from 'motion/react'
import type { Locale } from '@/i18n-config'
import type { CommunityStats } from '@/lib/server/queries/public/home'

const STAT_ITEMS: Array<{
  key: keyof CommunityStats
  label: { en: string; ko: string }
}> = [
  { key: 'sessionCount', label: { en: 'Activities', ko: '누적 활동' } },
  { key: 'participantTotal', label: { en: 'Participations', ko: '누적 참여' } },
  { key: 'partCount', label: { en: 'Parts', ko: '파트' } },
  { key: 'projectCount', label: { en: 'Projects', ko: '프로젝트' } },
]

function CountUp({ target, start }: { target: number; start: boolean }) {
  const shouldReduce = useReducedMotion()
  const [value, setValue] = useState(0)

  useEffect(() => {
    if (!start) {
      return
    }
    if (shouldReduce || target === 0) {
      setValue(target)
      return
    }
    const controls = animate(0, target, {
      duration: 1.2,
      ease: 'easeOut',
      onUpdate: (latest) => setValue(Math.round(latest)),
    })
    return () => controls.stop()
  }, [start, target, shouldReduce])

  return (
    <span className={'font-mono text-4xl font-bold md:text-5xl'}>{value}</span>
  )
}

export default function StatsSection({
  stats,
  lang,
}: {
  stats: CommunityStats
  lang: Locale
}) {
  const shouldReduce = useReducedMotion()
  const [started, setStarted] = useState(false)
  const active = Boolean(shouldReduce) || started

  return (
    <m.dl
      onViewportEnter={() => setStarted(true)}
      viewport={{ once: true, margin: '-10% 0px' }}
      className={'grid grid-cols-2 gap-4 md:grid-cols-4'}
    >
      {STAT_ITEMS.map((item) => (
        <div
          key={item.key}
          className={'bg-surface-raised flex flex-col gap-1 rounded-2xl p-6'}
          style={{ contain: 'layout style paint' }}
        >
          <dt
            className={
              'text-ink/50 font-mono text-xs tracking-widest uppercase'
            }
          >
            {item.label[lang]}
          </dt>
          <dd className={'text-yonsei-blue'}>
            <CountUp target={stats[item.key]} start={active} />
          </dd>
        </div>
      ))}
    </m.dl>
  )
}
```

Create `app/components/about/parts-deepdive-section.tsx` (전체 파트 7종 = Organizer + 기존 6종(Cloud 포함) + Join CTA):

```tsx
import Link from 'next/link'
import Reveal from '@/app/components/motion/reveal'
import type { Locale } from '@/i18n-config'
import aboutPageContents from '@/lib/contents/about-page'
import partsSectionContent, { bentoParts } from '@/lib/contents/parts-section'

export default function PartsDeepdiveSection({ lang }: { lang: Locale }) {
  const organizer = bentoParts.find((part) => part.key === 'organizer')!
  const allParts = [
    { title: organizer.title, content: organizer.content },
    ...partsSectionContent,
  ]

  return (
    <div className={'flex flex-col gap-8'}>
      <div className={'grid grid-cols-1 gap-4 md:grid-cols-2'}>
        {allParts.map((part) => (
          <Reveal key={part.title}>
            <article
              className={'bg-surface-raised h-full rounded-2xl p-6'}
              style={{ contain: 'layout style paint' }}
            >
              <h3 className={'text-ink text-lg font-semibold'}>
                {part.title}
              </h3>
              <p className={'text-ink/70 mt-2 text-sm leading-relaxed'}>
                {part.content[lang]}
              </p>
            </article>
          </Reveal>
        ))}
      </div>
      <Reveal
        className={
          'bg-yonsei-blue flex flex-col items-start gap-4 rounded-3xl p-8 text-white md:flex-row md:items-center md:justify-between'
        }
      >
        <div>
          <h3 className={'text-2xl font-bold'}>
            {aboutPageContents.joinCta.title[lang]}
          </h3>
          <p className={'mt-1 text-white/80'}>
            {aboutPageContents.joinCta.body[lang]}
          </p>
        </div>
        <Link
          href={`/${lang}/recruit`}
          className={
            'text-yonsei-blue rounded-full bg-white px-6 py-2.5 font-semibold'
          }
        >
          {aboutPageContents.joinCta.button[lang]}
        </Link>
      </Reveal>
    </div>
  )
}
```

- [ ] **Step 5: 페이지 조립**

Create `app/(home)/[lang]/about/page.tsx`:

```tsx
import type { Metadata } from 'next'
import { Suspense } from 'react'
import { connection } from 'next/server'
import type { Locale } from '@/i18n-config'
import languageParamChecker from '@/lib/language-param-checker'
import { getSessionVisibilityBucket } from '@/lib/server/cache/policy'
import {
  getCommunityStats,
  getGenerationTimeline,
} from '@/lib/server/queries/public/home'
import AboutHero from '@/app/components/about/about-hero'
import PartsDeepdiveSection from '@/app/components/about/parts-deepdive-section'
import ProgramsSection from '@/app/components/about/programs-section'
import StatsSection from '@/app/components/about/stats-section'
import StorySection from '@/app/components/about/story-section'
import TimelineSection from '@/app/components/about/timeline-section'

export function generateStaticParams() {
  return [{ lang: 'en' }, { lang: 'ko' }]
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>
}): Promise<Metadata> {
  const lang = languageParamChecker((await params).lang)

  if (lang === 'ko') {
    return {
      title: '소개',
      description: 'GDGoC Yonsei를 소개합니다 — Connect, Learn, Grow.',
    }
  }
  return {
    title: 'About',
    description: 'About GDGoC Yonsei — Connect, Learn, Grow.',
  }
}

const SECTION_TITLES = {
  programs: { en: 'Programs', ko: '프로그램' },
  history: { en: 'History', ko: '연혁' },
  parts: { en: 'Parts & Join', ko: '파트 & 함께하기' },
} as const

function SectionHeading({
  label,
  lang,
}: {
  label: keyof typeof SECTION_TITLES
  lang: Locale
}) {
  return (
    <div className={'mb-8 flex items-baseline gap-3'}>
      <span
        className={
          'text-yonsei-blue font-mono text-xs tracking-widest uppercase'
        }
      >
        {label}
      </span>
      <h2 className={'text-ink text-3xl font-bold md:text-4xl'}>
        {SECTION_TITLES[label][lang]}
      </h2>
    </div>
  )
}

async function TimelineData({ lang }: { lang: Locale }) {
  await connection()
  const visibilityBucket = getSessionVisibilityBucket()
  const entries = await getGenerationTimeline(lang, visibilityBucket)
  return <TimelineSection entries={entries} lang={lang} />
}

async function StatsData({ lang }: { lang: Locale }) {
  const stats = await getCommunityStats(lang)
  return <StatsSection stats={stats} lang={lang} />
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const lang = languageParamChecker((await params).lang)

  return (
    <main className={'flex w-full flex-col overflow-x-hidden'}>
      <AboutHero lang={lang} />
      <StorySection lang={lang} />
      <section className={'cv-auto w-full px-6 py-20'}>
        <div className={'mx-auto max-w-5xl'}>
          <SectionHeading label={'programs'} lang={lang} />
          <ProgramsSection lang={lang} />
        </div>
      </section>
      <section className={'cv-auto w-full px-6 py-20'}>
        <div className={'mx-auto max-w-4xl'}>
          <SectionHeading label={'history'} lang={lang} />
          <Suspense fallback={null}>
            <TimelineData lang={lang} />
          </Suspense>
        </div>
      </section>
      <section className={'w-full px-6 py-20'}>
        <div className={'mx-auto max-w-5xl'}>
          <Suspense fallback={null}>
            <StatsData lang={lang} />
          </Suspense>
        </div>
      </section>
      <section className={'cv-auto w-full px-6 py-20 pb-28'}>
        <div className={'mx-auto max-w-5xl'}>
          <SectionHeading label={'parts'} lang={lang} />
          <PartsDeepdiveSection lang={lang} />
        </div>
      </section>
    </main>
  )
}
```

- [ ] **Step 6: sitemap + e2e 라우트 추가**

`lib/server/queries/public/sitemap.ts`의 최종 return 배열에서 `/calendar` 항목 아래에 추가:

```ts
    {
      url: '/about',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
```

`tests/e2e/public-route-matrix.spec.ts`의 첫 테스트 `routes` 배열에서 `'/ko',` 아래에 추가:

```ts
      '/en/about',
      '/ko/about',
```

- [ ] **Step 7: 통과 확인 + Commit**

```bash
pnpm vitest run tests/components/about-sections.test.tsx && pnpm test && pnpm test:types
git add lib/contents/about-page.ts app/components/about "app/(home)/[lang]/about" lib/server/queries/public/sitemap.ts tests/e2e/public-route-matrix.spec.ts tests/components/about-sections.test.tsx
git commit -m "feat: add /about page with story, programs, timeline, and live stats"
```

---

### Task 16: 헤더·푸터 재스타일 + About 내비 + 구 홈 컴포넌트 정리

**Files:**
- Modify: `app/components/header/index.tsx`, `app/components/header/desktop-navigation-list.tsx`, `app/components/header/navigation-list.tsx`, `app/components/footer.tsx`, `app/globals.css`
- Delete: `app/(home)/[lang]/welcome-page.tsx`, `app/(home)/[lang]/about-page.tsx`, `app/(home)/[lang]/activities-page.tsx`, `app/(home)/[lang]/parts-page.tsx`, `app/(home)/[lang]/activities-list.tsx`, `app/(home)/[lang]/part-card.tsx`, `app/(home)/[lang]/home-page-background.tsx`
- **삭제 금지**: `app/(home)/[lang]/activity-card.tsx`, `app/components/show-more-content.tsx`, `app/components/svg/**`

**Interfaces:**
- Consumes: Task 2 토큰.
- Produces: 헤더(반투명 surface + backdrop-blur — blur는 헤더 한정), 데스크톱·모바일 내비에 About 링크, 새 푸터. 구 홈 파일 제거로 코드베이스에서 구 디자인 소멸.

- [ ] **Step 1: 헤더 스타일 + About 링크**

`app/components/header/index.tsx`의 최외곽 div className을 교체:

```tsx
    <div
      className={
        'border-ink/5 bg-surface/80 fixed top-0 left-0 z-10 w-full border-b backdrop-blur-md'
      }
    >
```

`app/components/header/desktop-navigation-list.tsx` — `<Suspense>` 블록 아래, 기존 Session `Link` **위**에 추가:

```tsx
      <Link href={`/${lang}/about`}>{lang === 'ko' ? '소개' : 'About'}</Link>
```

`app/components/header/navigation-list.tsx` — 첫 번째 `MotionLink`(세션) **위**에 추가:

```tsx
        <MotionLink state={isMenuOpen}>
          <Link
            href={`/${lang}/about`}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className={'w-full'}
          >
            {lang === 'ko' ? '소개' : 'About'}
          </Link>
        </MotionLink>
```

- [ ] **Step 2: 푸터 재스타일**

`app/components/footer.tsx` 전체를 아래로 교체:

```tsx
import Link from 'next/link'
import LinkedIn from '@/app/components/svg/linked-in'
import Instagram from '@/app/components/svg/instagram'
import GDGoCYonseiLogo from '@/app/components/svg/gdgoc-yonsei-logo'
import Mail from '@/app/components/svg/mail'

/** 전역 푸터 — surface-raised 배경 + ink 텍스트 톤 (스펙 §4) */
export default function Footer() {
  return (
    <footer className={'border-ink/10 bg-surface-raised w-full border-t'}>
      <div
        className={
          'mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-12 md:flex-row md:items-start md:justify-between'
        }
      >
        <div className={'flex flex-col gap-4'}>
          <GDGoCYonseiLogo className={'w-48'} />
          <p className={'text-ink/50 text-sm'}>
            Google Developer Group on Campus · Yonsei University
          </p>
        </div>
        <div className={'flex flex-col gap-3'}>
          <p
            className={
              'text-ink/40 font-mono text-xs tracking-widest uppercase'
            }
          >
            Contact
          </p>
          <Link
            href={'mailto:gdsc.yonsei.univ@gmail.com'}
            target={'_blank'}
            rel={'noreferrer noopener'}
            className={
              'text-ink/70 flex items-center gap-2 text-sm hover:underline'
            }
          >
            <Mail className={'size-5'} />
            <span className={'font-mono'}>gdsc.yonsei.univ@gmail.com</span>
          </Link>
          <Link
            href={'https://www.linkedin.com/company/gdsc-yonsei/'}
            target={'_blank'}
            rel={'noreferrer noopener'}
            className={
              'text-ink/70 flex items-center gap-2 text-sm hover:underline'
            }
          >
            <LinkedIn className={'size-5'} />
            <span>LinkedIn</span>
          </Link>
          <Link
            href={'https://www.instagram.com/gdg.yonseiuniv/'}
            target={'_blank'}
            rel={'noreferrer noopener'}
            className={
              'text-ink/70 flex items-center gap-2 text-sm hover:underline'
            }
          >
            <Instagram className={'size-5'} />
            <span>@gdg.yonseiuniv</span>
          </Link>
        </div>
      </div>
      <p
        className={
          'text-ink/40 border-ink/5 border-t px-6 py-4 text-center text-xs'
        }
      >
        Copyright ⓒ 2026. GDG on Campus Yonsei. All rights reserved.
      </p>
    </footer>
  )
}
```

주의: `Mail`/`LinkedIn`/`Instagram` SVG가 밝은 배경에서 안 보이면(흰색 아이콘) `instagram-white-bg` 같은 변형으로 교체하거나 아이콘을 `bg-ink/5 rounded-full p-1` 래퍼로 감싼다. `GDGoCYonseiLogo`도 밝은 배경 가독성 확인.

- [ ] **Step 3: 구 컴포넌트 삭제 + CSS 정리**

```bash
git rm "app/(home)/[lang]/welcome-page.tsx" "app/(home)/[lang]/about-page.tsx" "app/(home)/[lang]/activities-page.tsx" "app/(home)/[lang]/parts-page.tsx" "app/(home)/[lang]/activities-list.tsx" "app/(home)/[lang]/part-card.tsx" "app/(home)/[lang]/home-page-background.tsx"
```

`app/globals.css`에서 제거:
1. `@layer components` 안의 `.home-about-box { ... }` 블록
2. `.h-home-screen { ... }` 블록
3. `/* Home shooting star background (CSS-only to avoid client JS) */` 주석부터 `.shooting-star-br { ... }`까지 전부 (keyframes `shooting-tr/tl/bl/br` 포함)

- [ ] **Step 4: 잔여 참조 검사 + 전체 검증**

```bash
grep -rn "welcome-page\|activities-page\|parts-page\|activities-list\|part-card\|home-page-background\|h-home-screen\|home-about-box\|shooting-star" app lib tests --include='*.tsx' --include='*.ts' --include='*.css'
pnpm test && pnpm test:types && pnpm build
```

Expected: grep 결과 없음(있으면 해당 참조 제거). `tests/components/common-components.test.tsx`가 구 푸터 카피(`Contact Us` 등)를 단언하면 새 카피(`Contact`, `LinkedIn`)로 갱신. 이후 vitest·tsc·build 전부 통과.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: restyle header/footer with About nav and remove legacy home sections"
```

---

### Task 17: 최종 검증 — 성능·반응형·서브페이지·문서

**Files:**
- Modify: `README.md` (db:seed 문서)
- Modify(발견 시): 회귀 수정

**Interfaces:**
- Consumes: 전체 산출물. 스펙 §10 검증 기준: LCP < 2.5s, CLS < 0.1, INP < 200ms (로컬 프로덕션 빌드).

- [ ] **Step 1: 전체 테스트 + 빌드 + 시드**

```bash
pnpm test && pnpm test:types && pnpm build
pnpm db:seed
```

Expected: 전부 통과, 시드 요약 로그 출력.

- [ ] **Step 2: 프로덕션 서버 기동 + Lighthouse (chrome-devtools MCP)**

```bash
pnpm start &
sleep 5
```

chrome-devtools MCP로:
1. `http://localhost:3000/ko` 접속 → Lighthouse audit (desktop) 실행 → **LCP < 2.5s, CLS < 0.1** 확인. `http://localhost:3000/ko/about`도 동일.
2. 뷰포트 360×740으로 resize → 홈·어바웃 전 섹션 스크린샷으로 가로 스크롤/겹침/터치 타깃 확인 (스펙: 360px~ 무깨짐).
3. 서브페이지 토큰 회귀 육안 점검: `/en/session/25-26`, `/en/project/25-26`, `/en/member/25-26`, `/en/calendar`, `/en/recruit` — 폰트·배경 교체로 깨진 곳이 있으면 최소 보정(레이아웃 재설계 금지 — 스펙 §3 비범위).
4. (수동 안내) DevTools > Rendering > Paint flashing으로 히트맵 리빌·bento hover 시 리페인트가 해당 요소 범위에 국한되는지 확인.

기준 미달 항목은 원인(이미지 priority 누락, 폰트 로딩, 레이아웃 시프트 등)을 수정하고 재측정.

- [ ] **Step 3: (선택) e2e 실행 + 재시드**

```bash
pnpm test:e2e
pnpm db:seed
```

Expected: `/about` 포함 라우트 매트릭스 통과. e2e가 DB를 초기화하므로 종료 후 재시드. (Playwright 브라우저 미설치면 `pnpm test:e2e:install` 먼저.)

- [ ] **Step 4: README에 시드 문서 추가**

`README.md`의 개발 환경/스크립트 섹션에 추가:

```md
### 로컬 시드 데이터

로컬 Postgres에 현실적인 개발용 데이터(기수 1개, 파트 7개, 세션 ~60개, 프로젝트 8개)를 넣습니다.

    pnpm db:seed

- 재실행 가능: `dev-seed-` 마커가 붙은 이전 시드만 지우고 다시 넣습니다 (TRUNCATE 안 함).
- 로컬 가드: DB 호스트가 localhost 계열이 아니면 `--force` 없이는 실행되지 않습니다.
- Playwright e2e(`pnpm test:e2e`)는 DB를 초기화하므로 실행 후 다시 시드하세요.
```

- [ ] **Step 5: 서버 종료 + 최종 Commit**

```bash
kill %1 2>/dev/null || true
git add README.md
git commit -m "chore: final verification pass and seed documentation"
git log --oneline origin/dev..HEAD
```

Expected: Task 1~17 커밋이 순서대로 나열됨. 이후 사용자에게 PR(→ `dev`) 여부 확인.

---

## 스펙 대비 커버리지 맵

| 스펙 섹션 | 태스크 |
|---|---|
| §5.1 토큰 / §5.2 타이포 | 2 / 1 |
| §6.1 스키마·어드민 | 3, 4, 5 |
| §6.2 쿼리 4종 | 7 |
| §6.3 시드 | 8 |
| §6.4 빈 상태 | 11(히트맵), 13(쇼케이스), 15(타임라인·스탯) |
| §7 홈 컴포넌트 | 10, 11, 12, 13, 14 |
| §8 히트맵 상세 | 6, 11 |
| §9 /about | 15 |
| §10 애니메이션·성능·접근성 | 9(시스템), 각 컴포넌트 태스크(내재), 17(검증) |
| §4 크롬·sitemap·라우팅 | 14, 15, 16 |
| §12 테스트 전략 | 각 태스크 + 15(e2e), 17 |
