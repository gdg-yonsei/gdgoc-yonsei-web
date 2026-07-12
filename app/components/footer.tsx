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
