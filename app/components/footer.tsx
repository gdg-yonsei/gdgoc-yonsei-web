import Link from 'next/link'
import LinkedIn from '@/app/components/svg/linked-in'
import Instagram from '@/app/components/svg/instagram'
import GDGoCYonseiLogo from '@/app/components/svg/gdgoc-yonsei-logo'
import Mail from '@/app/components/svg/mail'
import { Locale } from '@/i18n-config'

export default function Footer({ lang }: { lang: Locale }) {
  return (
    <div className={'flex w-full bg-neutral-300 p-4'}>
      <div className={'mx-auto w-full max-w-4xl md:flex'}>
        <div className={'flex w-full flex-col gap-6'}>
          <div className={'text-lg font-semibold text-white md:text-3xl'}>
            Contact Us
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
              className={'gap-2 md:flex md:items-center'}
            >
              <Mail className={'size-9'} />
              <p className={'not-md:hidden'}>gdsc.yonsei.univ@gmail.com</p>
            </Link>
            <Link
              href={'https://www.linkedin.com/company/gdsc-yonsei/'}
              target={'_blank'}
              className={'gap-2 md:flex md:items-center'}
            >
              <LinkedIn className={'size-9'} />
              <p className={'not-md:hidden'}>go to LinkedIn</p>
            </Link>
            <Link
              href={'https://www.instagram.com/gdg.yonseiuniv/'}
              target={'_blank'}
              className={'gap-2 md:flex md:items-center'}
            >
              <Instagram className={'size-9'} />
              <p className={'not-md:hidden'}>@gdg.yonseiuniv</p>
            </Link>
          </div>
          <p
            className={
              'mx-auto text-center text-sm text-neutral-700 md:w-full md:text-start'
            }
          >
            Copyright ⓒ 2025. GDG on Campus Yonsei <br />
            All rights reserved.
          </p>
          <div className={'flex flex-col gap-1 pt-4 text-sm'}>
            <Link
              href={`/${lang}/terms-of-service`}
              className={'hover:underline'}
            >
              이용 약관
            </Link>
            <Link
              href={`/${lang}/privacy-policy`}
              className={'hover:underline'}
            >
              개인정보처리방침
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
