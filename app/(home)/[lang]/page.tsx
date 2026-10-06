import { Suspense } from 'react'
import '@/app/styles/site-home.css'
import Hero, { HeroMetaList } from '@/app/(home)/[lang]/_components/home/hero'
import HomeMotion from '@/app/(home)/[lang]/_components/home/home-motion'
import HeroMeta from '@/app/(home)/[lang]/_components/home/hero-meta'
import FeaturedReleases from '@/app/(home)/[lang]/_components/home/featured-releases'
import Join from '@/app/(home)/[lang]/_components/home/join'
import LatestLog from '@/app/(home)/[lang]/_components/home/latest-log'
import Manifesto from '@/app/(home)/[lang]/_components/home/manifesto'
import Parts from '@/app/(home)/[lang]/_components/home/parts'
import Programs from '@/app/(home)/[lang]/_components/home/programs'
import type { Metadata } from 'next'
import JsonLd from '@/app/components/json-ld'
import {
  createLocalizedMetadata,
  getLocalizedUrl,
  getSiteUrl,
} from '@/lib/seo/metadata'
import { localeStaticParams } from '@/lib/i18n'
import { getLocale } from '@/lib/i18n/server'
import { siteMetadataCopy } from '@/lib/contents/site-copy'
import { homeStructuredData } from '@/lib/site/json-ld'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  const copy = siteMetadataCopy[locale]

  return createLocalizedMetadata({
    locale,
    title: copy.defaultTitle,
    description: copy.homeDescription,
    absoluteTitle: true,
  })
}

export function generateStaticParams() {
  return localeStaticParams()
}

/** HomeMotion은 스크롤 연출을 클라이언트 유휴 시간에 따로 불러온다. */
export default async function HomePage() {
  const lang = await getLocale()
  const copy = siteMetadataCopy[lang]
  const structuredData = homeStructuredData({
    siteRoot: getSiteUrl(),
    englishHomeUrl: getLocalizedUrl('en'),
    logoUrl: getSiteUrl('/gdgoc-yonsei-logo.svg'),
    canonical: getLocalizedUrl(lang),
    locale: lang,
    title: copy.defaultTitle,
    description: copy.homeDescription,
  })

  return (
    <>
      <JsonLd id="homepage-structured-data" data={structuredData} />
      <Hero
        lang={lang}
        meta={
          <Suspense fallback={<HeroMetaList lang={lang} />}>
            <HeroMeta lang={lang} />
          </Suspense>
        }
      />
      <div className="home-sheet">
        <Manifesto lang={lang} />
        <Programs lang={lang} />
        <Parts lang={lang} />
        <LatestLog lang={lang} />
        <FeaturedReleases lang={lang} />
      </div>
      <Join lang={lang} />
      <HomeMotion />
    </>
  )
}
