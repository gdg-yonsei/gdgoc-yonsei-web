/**
 * 404 화면 본문(서버 컴포넌트). 전역 404(`app/global-not-found.tsx`)와 공개 사이트 안의 404
 * (`app/(home)/[lang]/not-found.tsx`)가 함께 쓴다. `<main>`은 감싸는 쪽이 정한다.
 */
import Link from 'next/link'
import BracketPoster from '@/app/components/site/bracket-poster'

/** 404 화면의 도움 링크. 언어 접두사 없이 두어 proxy가 언어를 고르게 한다. */
const links = [
  { href: '/', en: 'Home', ko: '홈' },
  { href: '/session', en: 'Sessions', ko: '세션' },
  { href: '/project', en: 'Projects', ko: '프로젝트' },
]

/**
 * 루트 404 본문. 여기서는 언어를 알 수 없으므로 문구를 두 언어로 함께 쓰고,
 * 링크의 언어는 proxy가 정하게 한다.
 */
export default function NotFoundView() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-10 px-6 text-center">
      <div className="flex items-center gap-[0.12em] text-[clamp(4.5rem,18vw,12rem)]">
        <span className="bracket-slot" aria-hidden="true">
          <BracketPoster side="left" />
        </span>
        <h1 className="font-display leading-none font-bold tracking-[-0.05em] [font-variation-settings:'ROND'_100]">
          404
        </h1>
        <span className="bracket-slot" aria-hidden="true">
          <BracketPoster side="right" />
        </span>
      </div>
      <p className="text-on-stage-muted max-w-md">
        This page slipped out of the brackets.
        <br />
        <span lang="ko">페이지를 찾을 수 없어요.</span>
      </p>
      <nav
        aria-label="Helpful links"
        className="flex flex-wrap justify-center gap-3"
      >
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="pressable inline-flex min-h-12 items-center rounded-full border border-white/20 px-5 font-semibold"
          >
            {link.en} · <span lang="ko">{link.ko}</span>
          </Link>
        ))}
      </nav>
    </div>
  )
}
