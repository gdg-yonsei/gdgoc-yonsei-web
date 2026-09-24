import Link from 'next/link'
import BracketPoster from '@/app/components/site/bracket-poster'

const links = [
  { href: '/', en: 'Home', ko: '홈' },
  { href: '/session', en: 'Sessions', ko: '세션' },
  { href: '/project', en: 'Projects', ko: '프로젝트' },
]

/** Root 404 content. No locale is known here, so the copy is bilingual and
    the links let the proxy pick the language. */
export default function NotFoundView() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-10 px-6 text-center">
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
    </main>
  )
}
