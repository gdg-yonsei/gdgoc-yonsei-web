import HomePageBackground from '@/app/(home)/[lang]/home-page-background'
import GDGLogo from '@/app/components/svg/gdg-logo'

/**
 * `WelcomePage` 컴포넌트는 전달받은 props와 현재 상태를 기반으로 화면(UI)을 구성하여 렌더링합니다.
 *
 * 구동 원리:
 * 1. 입력값(`구조 분해된 입력값`)을 읽고 필요한 계산/조건 분기 로직을 수행합니다.
 * 2. 이벤트 핸들러와 상태 변화를 반영하여 어떤 UI를 보여줄지 결정합니다.
 * 3. 최종 JSX를 반환해 호출 위치의 화면에 결과를 렌더링합니다.
 *
 * 작동 결과:
 * - 사용자에게 현재 데이터/상태에 맞는 인터페이스를 제공합니다.
 * - 상위 컴포넌트와 props를 통해 연결되어 페이지 상호작용 흐름을 완성합니다.
 */
export default function WelcomePage() {
  return (
    <section
      className={
        'relative flex h-screen w-screen flex-col items-center justify-center gap-8 overflow-hidden p-8 pt-16'
      }
    >
      <HomePageBackground />
      <div className={'flex items-center gap-4 p-4'}>
        <GDGLogo svgKey={'main'} className={'w-40 md:w-64'} />
        <h1 className={'flex flex-col gap-4'}>
          <span className={'text-2xl md:text-4xl'}>Welcome to</span>
          <span
            className={
              'flex flex-col gap-3 text-4xl font-semibold md:text-6xl lg:flex-row'
            }
          >
            <span>Google</span>
            <span>Developer</span>
            <span>Group</span>
          </span>
          <span className={'text-logo-blue text-2xl md:text-4xl'}>
            Yonsei University
          </span>
        </h1>
      </div>

      {/* 2026 Freshman OT Banner */}
      {/*{lang && (*/}
      {/*  <div className="relative z-10 flex flex-col items-center gap-3">*/}
      {/*    <p className="text-center text-base font-medium text-neutral-600 md:text-lg">*/}
      {/*      {lang === 'ko'*/}
      {/*        ? '26학번 신입생 여러분 모두 환영합니다!'*/}
      {/*        : 'Welcome, Class of 2026 freshmen!'}*/}
      {/*    </p>*/}
      {/*    <Link*/}
      {/*      href={`/${lang}/2026-freshman-ot`}*/}
      {/*      className="bg-logo-blue rounded-full px-6 py-2.5 text-sm font-semibold text-white shadow-lg transition-all hover:brightness-110 md:px-8 md:py-3 md:text-base"*/}
      {/*    >*/}
      {/*      {lang === 'ko'*/}
      {/*        ? '2026 신입생 OT 보러가기 →'*/}
      {/*        : '2026 Freshman Orientation →'}*/}
      {/*    </Link>*/}
      {/*  </div>*/}
      {/*)}*/}
    </section>
  )
}
