import Link from 'next/link'
import { EnvelopeIcon } from '@heroicons/react/24/outline'
import LinkedIn from '@/app/components/linked-in'
import Instagram from '@/app/components/instagram'

export default function Footer() {
  return (
    <div className={'w-full p-4 bg-neutral-400'}>
      <div className={'text-white text-lg font-semibold'}>Contact Us</div>
      <div className={'flex justify-around py-4 items-center'}>
        <Link href={'mailto:gdsc.yonsei.univ@gmail.com'} target={'_blank'}>
          <EnvelopeIcon className={'size-10 text-neutral-700'} />
        </Link>
        <Link
          href={'https://www.linkedin.com/company/gdsc-yonsei/'}
          target={'_blank'}
        >
          <LinkedIn className={'size-9'} />
        </Link>
        <Link href={'mailto:gdsc.yonsei.univ@gmail.com'} target={'_blank'}>
          <Instagram className={'size-10'} />
        </Link>
      </div>
      <p className={'text-sm text-neutral-700 mx-auto text-center'}>
        Copyright ⓒ 2024. GDG on Campus Yonsei <br />
        All rights reserved.
      </p>
    </div>
  )
}
