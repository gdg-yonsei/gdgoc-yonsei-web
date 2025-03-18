import Link from 'next/link'
import LinkedIn from '@/app/components/svg/linked-in'
import Instagram from '@/app/components/svg/instagram'
import GDGoCYonseiLogo from '@/app/components/svg/gdgoc-yonsei-logo'
import Mail from '@/app/components/svg/mail'

export default function Footer() {
  return (
    <div className={'w-full p-4 bg-neutral-400 flex'}>
      <div className={'w-full max-w-4xl mx-auto md:flex'}>
        <div className={'flex flex-col gap-6 w-full'}>
          <div className={'text-white text-lg font-semibold md:text-3xl'}>
            Contact Us
          </div>
          <GDGoCYonseiLogo className={'not-md:hidden'} />
        </div>
        <div className={'md:flex md:flex-col md:items-start md:w-full'}>
          <div
            className={
              'flex justify-around py-4 items-center md:flex-col md:gap-2 md:items-start'
            }
          >
            <Link
              href={'mailto:gdsc.yonsei.univ@gmail.com'}
              target={'_blank'}
              className={'md:flex md:items-center gap-2'}
            >
              <Mail className={'size-9'} />
              <p className={'not-md:hidden'}>gdsc.yonsei.univ@gamil.com</p>
            </Link>
            <Link
              href={'https://www.linkedin.com/company/gdsc-yonsei/'}
              target={'_blank'}
              className={'md:flex md:items-center gap-2'}
            >
              <LinkedIn className={'size-9'} />
              <p className={'not-md:hidden'}>go to LinkedIn</p>
            </Link>
            <Link
              href={'https://www.instagram.com/gdg.yonseiuniv/'}
              target={'_blank'}
              className={'md:flex md:items-center gap-2'}
            >
              <Instagram className={'size-9'} />
              <p className={'not-md:hidden'}>@gdg.yonseiuniv</p>
            </Link>
          </div>
          <p
            className={
              'text-sm text-neutral-700 mx-auto text-center md:text-start md:w-full'
            }
          >
            Copyright ⓒ 2025. GDG on Campus Yonsei <br />
            All rights reserved.
          </p>
        </div>
      </div>
    </div>
  )
}
