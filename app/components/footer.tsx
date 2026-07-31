import Link from 'next/link'
import LinkedIn from '@/app/components/svg/linked-in'
import Instagram from '@/app/components/svg/instagram'
import GDGoCYonseiLogo from '@/app/components/svg/gdgoc-yonsei-logo'
import Mail from '@/app/components/svg/mail'
import type { Locale } from '@/i18n-config'

const COPYRIGHT_YEAR = 2026

/**
 * `Footer` 컴포넌트는 전달받은 props와 현재 상태를 기반으로 화면(UI)을 구성하여 렌더링합니다.
 *
 * 구동 원리:
 * 1. 입력값(없음)을 읽고 필요한 계산/조건 분기 로직을 수행합니다.
 * 2. 이벤트 핸들러와 상태 변화를 반영하여 어떤 UI를 보여줄지 결정합니다.
 * 3. 최종 JSX를 반환해 호출 위치의 화면에 결과를 렌더링합니다.
 *
 * 작동 결과:
 * - 사용자에게 현재 데이터/상태에 맞는 인터페이스를 제공합니다.
 * - 상위 컴포넌트와 props를 통해 연결되어 페이지 상호작용 흐름을 완성합니다.
 */
export default function Footer({ lang }: { lang: Locale }) {
  const otherLocale = lang === 'ko' ? 'en' : 'ko'

  return (
    <footer className={'flex w-full bg-neutral-300 p-4'}>
      <div className={'mx-auto w-full max-w-4xl md:flex'}>
        <div className={'flex w-full flex-col gap-6'}>
          <div className={'text-lg font-semibold text-neutral-900 md:text-3xl'}>
            {lang === 'ko'
              ? '문의 및 공식 채널'
              : 'Contact and official channels'}
          </div>
          <GDGoCYonseiLogo className={'not-md:hidden'} />
        </div>
        <div className={'md:flex md:w-full md:flex-col md:items-start'}>
          <div
            className={
              'flex items-center justify-around py-4 md:flex-col md:items-start md:gap-2'
            }
          >
            <Link
              href={'mailto:gdsc.yonsei.univ@gmail.com'}
              target={'_blank'}
              rel={'noreferrer noopener'}
              className={'flex min-h-12 items-center gap-2'}
              aria-label={
                lang === 'ko' ? '이메일 보내기' : 'Email GDGoC Yonsei'
              }
            >
              <Mail className={'size-9'} />
              <p className={'not-md:hidden'}>gdsc.yonsei.univ@gmail.com</p>
            </Link>
            <Link
              href={'https://www.linkedin.com/company/gdsc-yonsei/'}
              target={'_blank'}
              rel={'noreferrer noopener'}
              className={'flex min-h-12 items-center gap-2'}
              aria-label="GDGoC Yonsei LinkedIn"
            >
              <LinkedIn className={'size-9'} />
              <p className={'not-md:hidden'}>go to LinkedIn</p>
            </Link>
            <Link
              href={'https://www.instagram.com/gdg.yonseiuniv/'}
              target={'_blank'}
              rel={'noreferrer noopener'}
              className={'flex min-h-12 items-center gap-2'}
              aria-label="GDGoC Yonsei Instagram"
            >
              <Instagram className={'size-9'} />
              <p className={'not-md:hidden'}>@gdg.yonseiuniv</p>
            </Link>
            <Link
              href={
                'https://gdg.community.dev/gdg-on-campus-yonsei-university-sinchon-campus-seoul-south-korea/'
              }
              target={'_blank'}
              rel={'noreferrer noopener'}
              className="inline-flex min-h-12 items-center underline underline-offset-4"
            >
              {lang === 'ko' ? '공식 GDG 챕터 페이지' : 'Official GDG chapter'}
            </Link>
          </div>
          <nav
            aria-label={
              lang === 'ko' ? '정책 및 리소스' : 'Policies and resources'
            }
            className="flex flex-wrap gap-x-4 gap-y-2 pb-4 text-sm text-neutral-800"
          >
            <Link
              className="inline-flex min-h-11 items-center underline underline-offset-4"
              href={`/${lang}/privacy-policy`}
            >
              {lang === 'ko' ? '개인정보처리방침' : 'Privacy Policy'}
            </Link>
            <Link
              className="inline-flex min-h-11 items-center underline underline-offset-4"
              href={`/${lang}/terms-of-service`}
            >
              {lang === 'ko' ? '이용약관' : 'Terms of Service'}
            </Link>
            <Link
              className="inline-flex min-h-11 items-center underline underline-offset-4"
              href={`/${lang}/recruit`}
            >
              {lang === 'ko' ? '코어 멤버 모집' : 'Core recruitment'}
            </Link>
            <Link
              className="inline-flex min-h-11 items-center underline underline-offset-4"
              href={`/${lang}/2026-freshman-ot`}
            >
              {lang === 'ko' ? '2026 신입생 OT' : '2026 Freshman Orientation'}
            </Link>
            <Link
              className="inline-flex min-h-11 items-center underline underline-offset-4"
              href={`/${otherLocale}`}
              hrefLang={otherLocale}
            >
              {lang === 'ko' ? 'English' : '한국어'}
            </Link>
          </nav>
          <p
            className={
              'mx-auto text-center text-xs text-neutral-700 md:w-full md:text-start'
            }
          >
            Copyright ⓒ {COPYRIGHT_YEAR}. GDG on Campus Yonsei <br />
            All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
