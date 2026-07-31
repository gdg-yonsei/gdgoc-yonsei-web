import { Metadata } from 'next'
import GDGLogo from '@/app/components/svg/gdg-logo'
import languageParamChecker from '@/lib/language-param-checker'
import { createLocalizedMetadata } from '@/lib/seo/metadata'

type Props = {
  params: Promise<{ lang: string }>
}

const fields = {
  en: [
    'Front-End Core',
    'Back-End Core',
    'Mobile Core',
    'ML/AI Core',
    'DevRel Core',
    'Design Core',
  ],
  ko: [
    '프론트엔드 코어',
    '백엔드 코어',
    '모바일 코어',
    'ML/AI 코어',
    'DevRel 코어',
    '디자인 코어',
  ],
} as const

export function generateStaticParams() {
  return [{ lang: 'en' }, { lang: 'ko' }]
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = languageParamChecker((await params).lang)

  return createLocalizedMetadata({
    locale,
    path: '/recruit',
    title:
      locale === 'ko'
        ? '2025-2026 코어 멤버 모집'
        : '2025-2026 Core Member Recruitment',
    description:
      locale === 'ko'
        ? 'GDGoC Yonsei 2025-2026 코어 멤버 모집 분야와 학생 개발자 커뮤니티의 프론트엔드, 백엔드, 모바일, AI, DevRel, 디자인 팀을 소개합니다.'
        : 'Explore the 2025-2026 GDGoC Yonsei core member recruitment fields across front-end, back-end, mobile, AI, DevRel, and design teams.',
  })
}

/**
 * `RecruitPage` 컴포넌트는 전달받은 props와 현재 상태를 기반으로 화면(UI)을 구성하여 렌더링합니다.
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
export default async function RecruitPage({ params }: Props) {
  const lang = languageParamChecker((await params).lang)

  return (
    <div className={'min-h-screen w-full'}>
      <div
        className={
          'flex h-screen w-full flex-col items-center justify-center gap-8'
        }
      >
        <div className={'flex items-center justify-center gap-8'}>
          <GDGLogo className={'w-80'} />
          <h1 className={'text-4xl font-semibold'}>
            {lang === 'ko' ? '모집' : 'Recruit'}
            <br />
            2025-2026
            <br />
            <span className={'text-5xl font-bold'}>
              GDGoC Yonsei
              <br />
              {lang === 'ko' ? '코어 멤버' : 'Core Members'}
            </span>
          </h1>
        </div>
      </div>
      <div
        className={
          'flex h-screen w-full items-center justify-center bg-gradient-to-b from-sky-300/50 via-sky-100/50 to-blue-700/30'
        }
      >
        <div className={'grid grid-cols-3 gap-4'}>
          <h2 className={'col-span-3 p-8 text-center text-4xl font-semibold'}>
            {lang === 'ko' ? '모집 분야' : 'Recruitment Fields'}
          </h2>
          {fields[lang].map((field) => (
            <div
              key={field}
              className={
                'flex items-center justify-center rounded-xl border-2 border-white bg-white/50 p-8 px-12 backdrop-blur-sm'
              }
            >
              <h3 className={'text-2xl font-semibold'}>{field}</h3>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
