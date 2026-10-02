/**
 * 공개 사이트 푸터(서버 컴포넌트): 사이트 링크, 공식 채널, 서울 시계, 언어 전환.
 *
 * 채널 주소는 `lib/site/channels.ts`, 문구는 `chromeCopy`에서 읽는다. 현재 경로를 읽는
 * 언어 전환은 Suspense로 감싸 정적 셸을 막지 않게 한다.
 */
import { Suspense, type ReactNode } from 'react'
import Link from 'next/link'
import ArrowUpRightIcon from '@heroicons/react/24/outline/ArrowUpRightIcon'
import type { Locale } from '@/lib/i18n'
import GDGLogo from '@/app/components/svg/gdg-logo'
import FooterLocaleSwitch from '@/app/components/site/footer-locale-switch'
import LocaleSwitch from '@/app/components/site/locale-switch'
import SeoulClock from '@/app/components/site/seoul-clock'
import { chromeCopy } from '@/lib/contents/site-copy'
import { CHANNELS } from '@/lib/site/channels'
import { localeHref } from '@/lib/site/routes'

/** 저작권 표기 연도. 렌더링 시점의 연도를 쓰면 정적 셸 캐시와 어긋나므로 상수로 둔다. */
const COPYRIGHT_YEAR = 2026

/** 제목이 붙은 푸터 링크 열. */
function FooterColumn({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <div>
      <h2 className="font-code text-on-stage-muted text-xs tracking-[0.16em] uppercase">
        {title}
      </h2>
      <ul className="mt-5 flex flex-col gap-3">{children}</ul>
    </div>
  )
}

/** 외부 링크 표시 화살표 아이콘. */
const External = () => (
  <ArrowUpRightIcon
    aria-hidden="true"
    className="text-on-stage-muted size-3.5"
  />
)

/**
 * 사이트 푸터.
 *
 * 푸터 링크는 화면 아래쪽이라 거의 누르지 않으므로 `prefetch={false}`로 둔다.
 * @param lang 현재 언어
 */
export default function Footer({ lang }: { lang: Locale }) {
  const copy = chromeCopy[lang]

  return (
    <footer className="site-footer">
      <div className="mx-auto max-w-6xl px-5 pt-20 pb-10 sm:px-8">
        <div className="grid grid-cols-2 gap-x-6 gap-y-12 md:grid-cols-[minmax(0,1.5fr)_repeat(3,minmax(0,1fr))]">
          <div className="col-span-2 flex flex-col gap-5 md:col-span-1">
            <GDGLogo
              svgKey="footer"
              aria-hidden="true"
              className="h-9 w-auto self-start"
            />
            <p className="text-on-stage-muted max-w-xs text-sm leading-6">
              {copy.footerBlurb}
            </p>
          </div>
          <FooterColumn title={copy.footerExplore}>
            <li>
              <Link
                href={localeHref(lang, '/session')}
                prefetch={false}
                className="site-footer-link"
              >
                {copy.sessions}
              </Link>
            </li>
            <li>
              <Link
                href={localeHref(lang, '/project')}
                prefetch={false}
                className="site-footer-link"
              >
                {copy.projects}
              </Link>
            </li>
            <li>
              <Link
                href={localeHref(lang, '/calendar')}
                prefetch={false}
                className="site-footer-link"
              >
                {copy.calendar}
              </Link>
            </li>
            <li>
              <Link
                href={localeHref(lang, '/member')}
                prefetch={false}
                className="site-footer-link"
              >
                {copy.members}
              </Link>
            </li>
          </FooterColumn>
          <FooterColumn title={copy.footerConnect}>
            <li>
              <a
                href={CHANNELS.instagram}
                target="_blank"
                rel="noreferrer noopener"
                aria-label="GDGoC Yonsei Instagram"
                className="site-footer-link"
              >
                Instagram <External />
              </a>
            </li>
            <li>
              <a
                href={CHANNELS.linkedin}
                target="_blank"
                rel="noreferrer noopener"
                aria-label="GDGoC Yonsei LinkedIn"
                className="site-footer-link"
              >
                LinkedIn <External />
              </a>
            </li>
            <li>
              <a
                href={`mailto:${CHANNELS.email}`}
                rel="noreferrer noopener"
                aria-label="Email GDGoC Yonsei"
                className="site-footer-link"
              >
                Email
              </a>
            </li>
            <li>
              <a
                href={CHANNELS.chapter}
                target="_blank"
                rel="noreferrer noopener"
                className="site-footer-link"
              >
                {copy.chapterPage} <External />
              </a>
            </li>
          </FooterColumn>
          <FooterColumn title={copy.footerSite}>
            <li>
              <Link
                href={localeHref(lang, '/privacy-policy')}
                prefetch={false}
                className="site-footer-link"
              >
                {copy.privacy}
              </Link>
            </li>
            <li>
              <Link
                href={localeHref(lang, '/terms-of-service')}
                prefetch={false}
                className="site-footer-link"
              >
                {copy.terms}
              </Link>
            </li>
            <li>
              <a
                href={CHANNELS.source}
                target="_blank"
                rel="noreferrer noopener"
                className="site-footer-link"
              >
                {copy.source} <External />
              </a>
            </li>
            <li>
              <Link
                href={localeHref(lang, '/admin')}
                prefetch={false}
                className="site-footer-link"
              >
                {copy.gyms}
              </Link>
            </li>
          </FooterColumn>
        </div>
        <p aria-hidden="true" className="site-footer-wordmark">
          GDGoC Yonsei
        </p>
        <div className="font-code text-on-stage-muted flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-t border-white/10 pt-6 text-xs">
          <p>© {COPYRIGHT_YEAR} GDG on Campus Yonsei. All rights reserved.</p>
          <SeoulClock label={copy.clockLabel} />
          <Suspense
            fallback={
              <LocaleSwitch lang={lang} pathname={null} label={copy.language} />
            }
          >
            <FooterLocaleSwitch lang={lang} label={copy.language} />
          </Suspense>
        </div>
      </div>
    </footer>
  )
}
