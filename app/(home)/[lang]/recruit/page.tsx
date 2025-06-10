import { Metadata } from 'next'
import GDGLogo from '@/app/components/svg/gdg-logo'

export const metadata: Metadata = {
  title: 'Recruit 2025-2026 GDGoC Yonsei Core Members',
  description:
    'We are recruiting passionate and enthusiastic individuals who have a strong interest in development at GDGoC Yonsei.',
}

export default function RecruitPage() {
  return (
    <div className={'w-full min-h-screen'}>
      <div
        className={
          'w-full h-screen flex flex-col gap-8 items-center justify-center'
        }
      >
        <div className={'flex items-center justify-center gap-8'}>
          <GDGLogo className={'w-80'} />
          <h1 className={'text-4xl font-semibold'}>
            Recruit
            <br />
            2025-2026
            <br />
            <span className={'font-bold text-5xl'}>
              GDGoC Yonsei
              <br />
              Core Members
            </span>
          </h1>
        </div>
      </div>
      <div
        className={
          'w-full h-screen flex items-center justify-center bg-gradient-to-b from-sky-300/50  via-sky-100/50  to-blue-700/30 '
        }
      >
        <div className={'grid grid-cols-3 gap-4'}>
          <h2 className={'text-4xl font-semibold text-center col-span-3 p-8'}>
            Recruitment Fields
          </h2>
          <div
            className={
              'p-8 px-12 rounded-xl bg-white/50 backdrop-blur-sm border-2 border-white flex items-center justify-center'
            }
          >
            <h3 className={'text-2xl font-semibold'}>Front-End Core</h3>
          </div>
          <div
            className={
              'p-8 px-12 rounded-xl bg-white/50 backdrop-blur-sm border-2 border-white flex items-center justify-center'
            }
          >
            <h3 className={'text-2xl font-semibold'}>Back-End Core</h3>
          </div>
          <div
            className={
              'p-8 px-12 rounded-xl bg-white/50 backdrop-blur-sm border-2 border-white flex items-center justify-center'
            }
          >
            <h3 className={'text-2xl font-semibold'}>Mobile Core</h3>
          </div>
          <div
            className={
              'p-8 px-12 rounded-xl bg-white/50 backdrop-blur-sm border-2 border-white flex items-center justify-center'
            }
          >
            <h3 className={'text-2xl font-semibold'}>ML/AI Core</h3>
          </div>
          <div
            className={
              'p-8 px-12 rounded-xl bg-white/50 backdrop-blur-sm border-2 border-white flex items-center justify-center'
            }
          >
            <h3 className={'text-2xl font-semibold'}>DevRel Core</h3>
          </div>
          <div
            className={
              'p-8 px-12 rounded-xl bg-white/50 backdrop-blur-sm border-2 border-white flex items-center justify-center'
            }
          >
            <h3 className={'text-2xl font-semibold'}>Design Core</h3>
          </div>
        </div>
      </div>
    </div>
  )
}
