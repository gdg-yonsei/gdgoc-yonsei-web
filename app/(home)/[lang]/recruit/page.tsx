import { Metadata } from 'next'
import GDGLogo from '@/app/components/svg/gdg-logo'

export const metadata: Metadata = {
  title: 'Recruit 2025-2026 GDGoC Yonsei Core Members',
  description:
    'We are recruiting passionate and enthusiastic individuals who have a strong interest in development at GDGoC Yonsei.',
}

export default function RecruitPage() {
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
            Recruit
            <br />
            2025-2026
            <br />
            <span className={'text-5xl font-bold'}>
              GDGoC Yonsei
              <br />
              Core Members
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
            Recruitment Fields
          </h2>
          <div
            className={
              'flex items-center justify-center rounded-xl border-2 border-white bg-white/50 p-8 px-12 backdrop-blur-sm'
            }
          >
            <h3 className={'text-2xl font-semibold'}>Front-End Core</h3>
          </div>
          <div
            className={
              'flex items-center justify-center rounded-xl border-2 border-white bg-white/50 p-8 px-12 backdrop-blur-sm'
            }
          >
            <h3 className={'text-2xl font-semibold'}>Back-End Core</h3>
          </div>
          <div
            className={
              'flex items-center justify-center rounded-xl border-2 border-white bg-white/50 p-8 px-12 backdrop-blur-sm'
            }
          >
            <h3 className={'text-2xl font-semibold'}>Mobile Core</h3>
          </div>
          <div
            className={
              'flex items-center justify-center rounded-xl border-2 border-white bg-white/50 p-8 px-12 backdrop-blur-sm'
            }
          >
            <h3 className={'text-2xl font-semibold'}>ML/AI Core</h3>
          </div>
          <div
            className={
              'flex items-center justify-center rounded-xl border-2 border-white bg-white/50 p-8 px-12 backdrop-blur-sm'
            }
          >
            <h3 className={'text-2xl font-semibold'}>DevRel Core</h3>
          </div>
          <div
            className={
              'flex items-center justify-center rounded-xl border-2 border-white bg-white/50 p-8 px-12 backdrop-blur-sm'
            }
          >
            <h3 className={'text-2xl font-semibold'}>Design Core</h3>
          </div>
        </div>
      </div>
    </div>
  )
}
