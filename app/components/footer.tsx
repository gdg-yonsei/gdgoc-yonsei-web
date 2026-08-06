import Link from 'next/link'
import LinkedIn from '@/app/components/svg/linked-in'
import Instagram from '@/app/components/svg/instagram'
import GDGoCYonseiLogo from '@/app/components/svg/gdgoc-yonsei-logo'
import Mail from '@/app/components/svg/mail'
import type { Locale } from '@/i18n-config'

const COPYRIGHT_YEAR = 2026

/** 전역 푸터 — surface 배경 + ink 텍스트 톤 (스펙 §4) */
export default function Footer({ lang }: { lang: Locale }) {
  const otherLocale = lang === 'ko' ? 'en' : 'ko'

  return (
    <footer className={'border-ink/10 bg-surface w-full border-t'}>
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
          <nav
            aria-label={
              lang === 'ko' ? '정책 및 리소스' : 'Policies and resources'
            }
            className={'text-ink/60 flex flex-wrap gap-x-4 gap-y-1 text-sm'}
          >
            <Link
              className={
                'inline-flex min-h-11 items-center underline underline-offset-4'
              }
              href={`/${lang}/privacy-policy`}
            >
              {lang === 'ko' ? '개인정보처리방침' : 'Privacy Policy'}
            </Link>
            <Link
              className={
                'inline-flex min-h-11 items-center underline underline-offset-4'
              }
              href={`/${lang}/terms-of-service`}
            >
              {lang === 'ko' ? '이용약관' : 'Terms of Service'}
            </Link>
            <Link
              className={
                'inline-flex min-h-11 items-center underline underline-offset-4'
              }
              href={`/${lang}/2026-freshman-ot`}
            >
              {lang === 'ko' ? '2026 신입생 OT' : '2026 Freshman Orientation'}
            </Link>
            <Link
              className={
                'inline-flex min-h-11 items-center underline underline-offset-4'
              }
              href={`/${otherLocale}`}
              hrefLang={otherLocale}
            >
              {lang === 'ko' ? 'English' : '한국어'}
            </Link>
          </nav>
        </div>
        <div className={'flex flex-col gap-3'}>
          <p
            className={
              'text-ink/40 font-mono text-xs tracking-widest uppercase'
            }
          >
            {lang === 'ko' ? '문의 및 공식 채널' : 'Contact'}
          </p>
          <Link
            href={'mailto:gdsc.yonsei.univ@gmail.com'}
            target={'_blank'}
            rel={'noreferrer noopener'}
            aria-label={lang === 'ko' ? '이메일 보내기' : 'Email GDGoC Yonsei'}
            className={
              'text-ink/70 flex min-h-11 items-center gap-2 text-sm hover:underline'
            }
          >
            <Mail className={'size-5'} />
            <span className={'font-mono'}>gdsc.yonsei.univ@gmail.com</span>
          </Link>
          <Link
            href={'https://www.linkedin.com/company/gdsc-yonsei/'}
            target={'_blank'}
            rel={'noreferrer noopener'}
            aria-label={'GDGoC Yonsei LinkedIn'}
            className={
              'text-ink/70 flex min-h-11 items-center gap-2 text-sm hover:underline'
            }
          >
            <LinkedIn className={'size-5'} />
            <span>LinkedIn</span>
          </Link>
          <Link
            href={'https://www.instagram.com/gdg.yonseiuniv/'}
            target={'_blank'}
            rel={'noreferrer noopener'}
            aria-label={'GDGoC Yonsei Instagram'}
            className={
              'text-ink/70 flex min-h-11 items-center gap-2 text-sm hover:underline'
            }
          >
            <Instagram className={'size-5'} />
            <span>@gdg.yonseiuniv</span>
          </Link>
          <Link
            href={
              'https://gdg.community.dev/gdg-on-campus-yonsei-university-sinchon-campus-seoul-south-korea/'
            }
            target={'_blank'}
            rel={'noreferrer noopener'}
            className={
              'text-ink/70 inline-flex min-h-11 items-center text-sm underline underline-offset-4'
            }
          >
            {lang === 'ko' ? '공식 GDG 챕터 페이지' : 'Official GDG chapter'}
          </Link>
        </div>
      </div>
      <p
        className={
          'text-ink/40 border-ink/5 border-t px-6 py-4 text-center text-xs'
        }
      >
        Copyright ⓒ {COPYRIGHT_YEAR}. GDG on Campus Yonsei. All rights reserved.
      </p>
    </footer>
  )
}
