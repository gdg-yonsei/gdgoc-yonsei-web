import Link from 'next/link'
import LinkedIn from '@/app/components/svg/linked-in'
import Instagram from '@/app/components/svg/instagram'
import GDGoCYonseiLogo from '@/app/components/svg/gdgoc-yonsei-logo'
import Mail from '@/app/components/svg/mail'

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
export default function Footer() {
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
              'mx-auto text-center text-xs text-neutral-700 md:w-full md:text-start'
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
