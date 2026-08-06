# GDGoC Yonsei 웹사이트 전면 리디자인 — 설계 스펙

- 날짜: 2026-07-11
- 상태: 사용자 승인 완료 (브레인스토밍 Q&A 5건 + 설계안 전체 승인)
- 작업 브랜치: `worktree-visual-redesign` → PR 대상 `dev` (저장소 컨벤션)

## 1. 목표

1. 홈·전역 크롬(헤더/푸터/토큰/폰트) 전면 비주얼 리디자인 — "syntax highlighting" 컨셉: 무채색·블루 톤 바탕 + Google 4색은 의미 있는 지점에만, 연세 로열 블루(`#1B3A75`)를 브랜드 앵커로.
2. 활동(sessions)·프로젝트(projects) 데이터를 시각 자산으로 전환 — 시그니처 **Activity Heatmap**.
3. `/[lang]/about` 소개 전용 페이지 신설.
4. `motion` 기반 애니메이션 시스템 도입 (LazyMotion + `m.*`).
5. GPU 렌더링 최적화(transform/opacity 한정, contain, content-visibility 등)를 각 단계에 내재화.

원 프롬프트(사용자 제공 리디자인 지시서)의 디자인 방향은 **필수 지침**이며, 코드베이스 현실과 충돌하는 지점만 §11의 승인된 일탈 목록에 따라 조정한다.

## 2. 확정 결정 (사용자 Q&A)

| # | 질문 | 결정 |
|---|---|---|
| 1 | 데이터 소스 | **기존 테이블 확장** — `sessions`(활동)·`projects` 재사용, `activities` 신설 안 함 |
| 2 | 히트맵 카테고리 | **`sessions.category` pgEnum 컬럼 추가** + 어드민 폼 필드 + type 기준 backfill |
| 3 | 로컬 데이터 | **현실적 시드 스크립트** (`pnpm db:seed`, 재실행 가능, TRUNCATE 금지) |
| 4 | 시그니처 프로그램 6종 | **/about으로 이관** (홈 Activities 섹션은 히트맵으로 대체) |
| 5 | 리디자인 범위 | **홈 + /about + 전역 크롬** — 서브페이지는 토큰만 상속, 레이아웃 불변 |
| 6 | 히트맵 해상도 | **주 단위 52셀** (셀 1개=1주, 최근 52주, 데스크톱 13열×4행) |

## 3. 범위 / 비범위

**범위**: 홈 재구성, `/about` 신설, 전역 토큰·폰트·헤더·푸터, `sessions.category`·`projects.repoUrl/demoUrl` 스키마 확장 + 어드민 폼 반영, 신규 public 쿼리 4종, 시드 스크립트, 애니메이션 시스템, 성능·접근성 검증, 테스트(단위/컴포넌트/e2e 라우트), sitemap 갱신.

**비범위**: 다크모드 구현(값 스왑 가능한 **구조만** 마련), 서브페이지(/session, /project, /member, /calendar, /recruit 등) 레이아웃 재설계(깨짐 점검·보정만), exit 라우트 애니메이션, 어드민 UI 리디자인, `/2026-freshman-ot`, 이메일 템플릿.

## 4. IA · 라우팅

```
/[lang]                  HERO → ABOUT TEASER → ACTIVITY HEATMAP → PARTS BENTO → PROJECTS SHOWCASE → FOOTER
/[lang]/about (신설)     HERO(kinetic) → STORY(01 Connect·02 Learn·03 Grow) → PROGRAMS(6종 카드)
                         → 연혁 타임라인(DB) → STATS(DB 집계 카운트업) → PARTS 심화 + JOIN CTA(→/recruit)
```

- 헤더 내비게이션에 `About` 링크 추가(데스크톱 + 모바일 메뉴). 스크롤 시 헤더에만 `backdrop-filter: blur` (좁은 영역 한정).
- 푸터 재스타일(새 토큰·타이포).
- `app/sitemap.ts`에 `/about` (en/ko) 추가. `generateStaticParams`는 기존 페이지와 동일하게 `en`/`ko`.
- 기존 홈 섹션 컴포넌트(`welcome-page` `about-page` `activities-page` `parts-page` `activities-list` `home-page-background`)는 홈에서 제거. `activity-card`·`show-more-content`·SVG 세트(`Friends` `FriendsTree` `BookSVG` `Trophy` `GDGLogo`)는 **삭제하지 않고 재활용**(프롬프트 지시). `home-page-background`와 `globals.css`의 `.shooting-star*` CSS는 canvas 대체 후 제거.

## 5. 디자인 시스템 (Phase 1)

### 5.1 컬러 토큰 — Tailwind v4 `@theme` (globals.css가 정본, tailwind.config 아님)

```css
:root {
  --surface: #f6f7fb;        /* 기본 배경 */
  --surface-raised: #ffffff; /* 카드·패널 */
  --ink: #0b1220;            /* 본문 텍스트 */
  --yonsei-blue: #1b3a75;    /* 브랜드 앵커 */
}
@theme inline {
  --color-surface: var(--surface);
  --color-surface-raised: var(--surface-raised);
  --color-ink: var(--ink);
  --color-yonsei-blue: var(--yonsei-blue);
}
```

- `:root` 시맨틱 변수 → `@theme inline` 매핑 구조로 **다크모드는 `:root` 값 스왑만으로 확장 가능**.
- 기존 `--color-gdg-*` 토큰 전부 유지. 용도 재정의: 배경 채움 금지, **좌측 4px 보더·8px 인디케이터 점·히트맵 셀·범례** 등 시맨틱 액센트 전용.
- 카테고리↔색 매핑(단일 소스 `lib/heatmap.ts`, 범례에 5종 모두 표기):

  | category | 색 토큰 | 근거 |
  |---|---|---|
  | `tech_talk` | `gdg-blue-300` | 프롬프트: blue=기술세션 |
  | `part_session` | `gdg-green-300` | 프롬프트: green=파트 세션 |
  | `hackathon` | `gdg-red-300` | 프롬프트: red=해커톤 |
  | `devrel` | `gdg-yellow-300` | 프롬프트: yellow=DevRel/소셜 |
  | `demo_day` | `yonsei-blue` | 프롬프트의 yonsei-blue 용도 "히트맵의 '우리 조직' 신호" — 데모데이=조직 대표 이벤트. #1b3a75(네이비)로 gdg-blue(#4285f4)와 명확히 구분 |
- `<html>` 클래스: `bg-neutral-50` → `bg-surface`, `text-gdg-black` → `text-ink`.

### 5.2 타이포그래피

- **Pretendard Variable** (`--font-sans`): `pretendard` npm 패키지의 `PretendardVariable.woff2`를 `app/fonts/`로 복사해 커밋, `next/font/local` self-host, `display: swap`, `variable: '--font-pretendard'`.
- **JetBrains Mono Variable** (`--font-mono`): `@fontsource-variable/jetbrains-mono`의 latin variable woff2를 `app/fonts/`로 복사해 커밋, `next/font/local` self-host (빌드타임 네트워크 의존 제거 — 승인된 일탈 ⑤). 용도: 데이터·라벨·타임스탬프·태그 pill 전용("T19", "19:00", 날짜, 카운터 숫자).
- `@theme inline`에 `--font-sans: var(--font-pretendard), …시스템 폴백` / `--font-mono: var(--font-jetbrains-mono), …모노 폴백` 등록.
- Google Sans: 코드 참조 제거, `app/fonts/google-sans.woff2` 파일은 보존. 이 두 역할 외 서체 추가 금지.

## 6. 데이터 아키텍처 (Phase 4)

### 6.1 스키마 확장 (신설 아님)

```ts
// db/schema/sessions.ts
export const activityCategoryEnum = pgEnum('activityCategory', [
  'tech_talk', 'part_session', 'hackathon', 'demo_day', 'devrel',
])
// sessions 테이블에 추가:
category: activityCategoryEnum('category').notNull().default('tech_talk')

// db/schema/projects.ts 에 추가:
repoUrl: text('repoUrl'),   // nullable
demoUrl: text('demoUrl'),   // nullable
```

- 마이그레이션: drizzle-kit 생성 SQL에 backfill `UPDATE sessions SET category='part_session' WHERE type='Part Session';` 추가(General Session은 default로 tech_talk).
- 어드민 반영: 세션 create/edit 폼·액션·`lib/validations/session.ts`에 category 셀렉트, 프로젝트 create/edit에 repoUrl/demoUrl 입력(`z.string().url().optional().or(z.literal(''))`) + `lib/server/form-data/*` 갱신 + 기존 테스트 갱신.

### 6.2 신규 public 쿼리 — `lib/server/queries/public/`

모두 기존 패턴 준수: `'use cache: remote'` + `cacheQuery(publicCachePolicy.*, [기존 태그 재사용])` → 어드민 무효화 자동 연동. `visibilityBucket`은 기존 세션 페이지가 쓰는 계산 유틸을 그대로 사용.

| 함수 | 반환 | 태그 |
|---|---|---|
| `getHeatmapSessions(locale, visibilityBucket)` | 최근 52주 `displayOnWebsite` 세션: id, name, nameKo, startAt, category, participantCount(=`userToSession`+`external_participants` 카운트) | `sessionListTag(locale)` |
| `getFeaturedProjects(locale)` | 최신 기수 프로젝트 ≤9: id, name, nameKo, description(Ko), mainImage, repoUrl, demoUrl, generation.name, tags[] | `projectListTag(locale)` |
| `getCommunityStats(locale)` | { sessionCount, participantTotal, partCount(최신 기수), projectCount } | `sessionListTag`+`projectListTag`+`memberListTag` |
| `getGenerationTimeline(locale, visibilityBucket)` | 기수별(오름차순) { generation, sessions: 압축 컬럼 } | `sessionListTag(locale)` |

- Server Component에서 조회 → 직렬화 props → `'use client'` 애니메이션 컴포넌트(**Client Island 유지**). Suspense 경계는 기존 세션/프로젝트 페이지 패턴 준수(cacheComponents 모드).
- 타입: `drizzle-zod` 미도입 — 기존 컨벤션(쿼리 반환 추론 타입, `lib/server/queries/public/types.ts`) 사용 (승인된 일탈 ④).

### 6.3 시드 — `scripts/seed-dev.ts` + `pnpm db:seed` (devDep `tsx`)

- **안전장치**: DB 호스트가 localhost/127.x가 아니면 `--force` 없이는 중단. TRUNCATE 절대 금지.
- **재실행 가능(결정적)**: 고정 마커(시드 전용 author user id `dev-seed-user`, 기수명 마커)로 기존 시드 행만 FK 역순 delete 후 insert.
- **내용** (모두 name/nameKo 이중 언어):
  - 기수 1개(2025-09 ~ 2026-08), 파트 7종(Organizer, Front-End, Back-End, ML/AI, Cloud, UI/UX, DevRel), 시드 멤버 ~16명(파트 배정).
  - 세션 ~60건/52주: 매주 화 19:00 T19(`tech_talk`), 격주 파트 세션(`part_session`), The Bridge Hackathon·Namu-thon(`hackathon`), oTP Demo Day·Yonsei X Korea Demo Day(`demo_day`), Google I/O Extended Recap·네트워킹 나이트 등(`devrel`) — 방학 공백 반영해 히트맵 밀도가 현실적으로 보이게.
  - 세션별 참여 5~15명(`userToSession`), 프로젝트 8건 + 태그(기술스택) + repo/demo URL.
- e2e 테스트는 DB를 TRUNCATE하므로 이후 `pnpm db:seed` 재실행 필요 — README/스크립트 로그에 안내.

### 6.4 빈 상태 UI (필수)

- 히트맵: 52셀 전부 `surface-raised` + "아직 기록된 활동이 없어요" 캡션 (그리드 자체는 항상 렌더).
- 프로젝트 쇼케이스: 플레이스홀더 카드 + 어드민 등록 안내 문구.
- 타임라인: 기수 없음 문구. Stats: 0 표시(카운트업 생략).

## 7. 홈 재구성 (Phase 2) — `app/components/home/`

`app/(home)/[lang]/page.tsx`는 서버 컴포넌트로 데이터 조회·직렬화만 담당하고 아래 섹션을 조립한다.

| 컴포넌트 | 핵심 설계 |
|---|---|
| `hero.tsx` (client) | "Connect. Learn. Grow." `staggerChildren` 순차 reveal — opacity 0→1 + y ≤8px. 타이틀은 레이아웃 공간 선점(opacity만) → CLS 0. 배경에 starfield. LCP 대상 = 타이틀 텍스트 |
| `starfield-canvas.tsx` (client) | 단일 `<canvas>` + `requestAnimationFrame`(별+궤적), `next/dynamic(ssr:false)`, devicePixelRatio 대응, 부모·자신 **이중 `overflow:hidden`**(가로 스크롤 원천 차단), 탭 비가시 시 rAF 중단, `prefers-reduced-motion` → 정적 별 1회 드로우 |
| `about-teaser.tsx` | 미션 2줄 + "자세히 보기 →" `/about` 링크 |
| `activity-heatmap.tsx` (client island) | §8 상세 |
| `parts-bento-grid.tsx` | 비대칭 bento 6칸 — **Organizer 2칸**, FE/BE/ML·AI/UI·UX/DevRel 각 1칸. 콘텐츠는 `lib/contents/parts-section` 확장(정적, en/ko — DB parts는 기수별 가변이라 bento 위계에 부적합, 승인된 일탈 ⑥). hover `translateY(-4px) scale(1.01)` + **사전 렌더 그림자 레이어 opacity 전환**(box-shadow 애니메이션 금지). 부모 `whileInView` + variants stagger |
| `projects-showcase.tsx` (client island) | `getFeaturedProjects` 데이터. CSS grid(이미지 비율 고정 → CLS 방지), 태그 pill(mono)·기수 뱃지·repo/demo 링크, 카드 → 기존 `/project/[gen]/[id]` 링크. **태그 필터** + `motion` `layout` prop FLIP 재배치 |

## 8. Activity Heatmap — 시그니처 상세

- **그리드**: 최근 52주(이번 주 포함, 주 시작 = 월요일), 셀 1개=1주. 데스크톱 13열×4행, 모바일 wrap(최소 터치 타깃 유지). 셀 데이터는 서버에서 주 버킷팅해 직렬화(주차 키 `YYYY-Www`).
- **셀 색**: 해당 주 최다 카테고리의 시맨틱 컬러(§5.1 매핑), 동률이면 카테고리 우선순위(hackathon > demo_day > tech_talk > part_session > devrel), 활동 없으면 `surface-raised` + 미세 보더. 활동 수에 따른 농도는 **opacity 스텝**(1건 0.45 / 2건 0.7 / 3건 이상 1.0)으로 표현 — 색상 정체성 유지, 팔레트 계단 불필요.
- **채움 연출**: 셀 인덱스를 `--i` CSS 커스텀 프로퍼티로 전달, `animation-delay: calc(var(--i) * 12ms)` **순수 CSS 애니메이션**(scale+opacity, 컴포지터 전용). 스크롤 진입 트리거는 컨테이너 1회 `whileInView`→클래스 토글. reduced-motion 시 즉시 표시.
- **툴팁**: hover/tap 시 그 주의 활동 제목·날짜·참여 인원 목록 — `position: absolute` + `transform: scale`/`opacity`(레이아웃 밀림 없음). 키보드 접근: 셀은 `button`, focus 시 툴팁 표시, `aria-label` 제공.
- **성능**: 컨테이너 `content-visibility: auto` + `contain-intrinsic-size`, 셀 `contain: layout style paint`.
- **범례**: 카테고리 5종 색 점 + JetBrains Mono 라벨, 하단 캡션 "최근 52주".

## 9. /about 페이지 (Phase 3) — `app/(home)/[lang]/about/` + `app/components/about/`

| 섹션 | 설계 |
|---|---|
| Hero | 기존 미션 카피(`lib/contents/about-section`) 기반 대형 타이포 kinetic reveal — 줄 단위 stagger |
| Story | 01 Connect(`Friends`) · 02 Learn(`BookSVG`) · 03 Grow(`FriendsTree`) — 실제 순차 구조이므로 이 섹션에 한해 번호 표기 허용(프롬프트). 좌/우 교차 레이아웃, `whileInView` |
| Programs | 이관된 6종(T19·Part Session·Solution Challenge·oTP·Yonsei X Korea Demo Day·The Bridge Hackathon) — 기존 `lib/contents/activity-section` 카피(en/ko) 그대로, 새 카드 디자인(좌측 4px 시맨틱 보더 + mono 메타라벨 예: `TUE 19:00`). `show-more-content` 재활용해 긴 본문 접기. Solution Challenge 카드에 `Trophy` SVG |
| 연혁 타임라인 | `getGenerationTimeline` — 기수별 챕터 + 소속 세션. `useScroll`+`useTransform`으로 세로 진행선 `scaleY`만 변형 |
| Stats | `getCommunityStats` 4종(활동 수·누적 참여 인원·파트 수·프로젝트 수) — **하드코딩 금지**, `whileInView` 1회 카운트업(mono 숫자), reduced-motion 시 즉시 최종값 |
| Parts 심화 + Join CTA | 전체 파트(콘텐츠 파일 기준, Cloud 포함 7종) 소개 + `/recruit` CTA |

폴드 아래 섹션(타임라인·Parts 심화)에 `content-visibility: auto` + `contain-intrinsic-size`.

## 10. 애니메이션 · 성능 · 접근성 (Phase 5·6 — 각 Phase에 내재화)

**애니메이션 시스템**
- `app/components/motion/lazy-motion-provider.tsx`: `LazyMotion` + `domAnimation`, `(home)/[lang]/layout.tsx`에서 래핑. 신규 클라이언트 컴포넌트는 전부 `m.*` (드래그/제스처 불필요).
- 스크롤 리빌 통일: `whileInView` + `viewport={{ once: true, margin: '-10% 0px' }}`. 커스텀 scroll 리스너 신규 작성 금지(예외: `useScroll`은 motion 내장이므로 타임라인에 허용).
- 리스트/그리드: 부모 `variants` `staggerChildren`만, 자식 수동 `delay` 금지.
- 라우트 전환: `app/(home)/[lang]/template.tsx`에 enter 페이드만(exit 미구현 — 우선순위 낮음, 프롬프트 지시).
- 모든 지점 `useReducedMotion()` 체크 → 페이드 수준으로 축소.

**GPU 체크리스트(구현 중 즉시 적용)**
- 애니메이션 프로퍼티 `transform`/`opacity` 한정. width/height/top/left/margin/box-shadow 애니메이션 금지.
- `will-change`: 애니메이션 직전 부여·종료 후 제거(정적 다수 부여 금지).
- `backdrop-filter: blur`는 헤더 한정.
- 카드류(히트맵 셀·bento·프로젝트 카드·프로그램 카드) `contain: layout style paint`.
- 폴드 아래 긴 섹션 `content-visibility: auto` + `contain-intrinsic-size`.
- 이미지 `next/image` 통일(R2 remotePatterns 기설정) — 히어로 LCP만 `priority`, 나머지 lazy.
- 무거운 클라이언트 요소(canvas)는 `next/dynamic(ssr:false)`.

**접근성**: 모든 인터랙티브 요소에 가시적 키보드 포커스 스타일(`focus-visible` ring — yonsei-blue), 히트맵 셀 버튼화 + aria-label, 반응형 360px~데스크톱 전 구간 무깨짐.

**검증**: 각 Phase 후 `pnpm build`(drizzle migrate 포함). 최종: Chrome DevTools Performance/Rendering(Paint flashing·Layer borders)으로 리페인트 범위 확인 + Lighthouse CWV — LCP < 2.5s, CLS < 0.1, INP < 200ms (로컬 프로덕션 빌드 기준, chrome-devtools MCP 사용).

## 11. 프롬프트 대비 승인된 일탈

1. 토큰 정의 위치: `tailwind.config` → **Tailwind v4 `@theme`** (globals.css).
2. `activities` 테이블 신설 → **기존 `sessions` 확장** (프롬프트 자체의 "있다면 확장" 조항 이행).
3. 히트맵: GitHub식 일 단위 → **주 단위 52셀** (프롬프트 문구 "주 단위 셀 그리드"·"셀 50개 이상" 채택).
4. `drizzle-zod` 미도입 → 기존 타입 추론 컨벤션 ("기존 타입 안전성 컨벤션 유지" 조항 우선).
5. JetBrains Mono `next/font/google` → **woff2 self-host** (빌드 네트워크 의존 제거).
6. 프로젝트 카드 "파트 뱃지" → `projects.partId` 부재로 **기수 뱃지 + 태그 pill**, `repoUrl`/`demoUrl` 컬럼 신규 추가. 파트별 필터 → **태그 필터**.
7. 홈 bento는 프롬프트 명시 6파트(Organizer 포함) **정적 콘텐츠** 기반 — DB parts(기수별 가변, Cloud 포함)는 /about 심화·시드에 반영.

## 12. 테스트 전략

- **단위(vitest)**: `lib/heatmap.ts`(주 버킷팅 — 연도 경계·52주 윈도·동률 우선순위, 카테고리→색 매핑), 시드의 순수 헬퍼, 갱신된 validations(session category, project url).
- **컴포넌트(vitest + RTL, 기존 `tests/components` 패턴)**: hero(reveal 구조), activity-heatmap(셀 렌더·빈 상태·툴팁), parts-bento-grid, projects-showcase(태그 필터), stats 카운터(reduced-motion 즉시값).
- **fetcher(기존 `public-fetchers.test.ts` 패턴)**: 신규 쿼리 4종.
- **e2e(playwright)**: `public-route-matrix`에 `/about`(en/ko) 추가, 홈 스모크가 구 섹션 텍스트를 참조하면 갱신.
- 각 Phase 완료 시 `pnpm test && pnpm test:types && pnpm build`.

## 13. 실행 순서 (프롬프트 지시 준수)

**Phase 1 (토큰·폰트) → Phase 4 (스키마·쿼리·시드) → Phase 2 (홈) → Phase 3 (/about) → Phase 5 (전역 애니메이션 마감: provider/template) → Phase 6 (성능 검증·Lighthouse)** — 성능 항목은 각 Phase에서 즉시 적용, 커밋은 Phase 단위.

## 14. 리스크

- Next 16 `cacheComponents` 모드에서 홈에 DB 쿼리 추가 시 prerender 오류 가능 → 기존 세션/프로젝트 페이지의 `visibilityBucket`·Suspense 패턴을 그대로 따라 완화.
- drizzle enum 컬럼 추가 마이그레이션에 수동 backfill SQL 필요(생성된 마이그레이션 파일에 추가).
- e2e 실행이 로컬 시드를 지움 → `db:seed` 재실행으로 복구(문서화).
- 폰트 교체는 전 페이지에 영향 → 서브페이지 육안 점검 항목에 포함.
