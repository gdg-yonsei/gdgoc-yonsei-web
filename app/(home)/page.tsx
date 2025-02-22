import GDGLogo from '@/public/logo/gdg-lg.svg'
import { ChevronDownIcon } from '@heroicons/react/24/outline'

export default function HomePage() {
  return (
    <div className={'w-full flex flex-col'}>
      <div className={'w-full flex items-center justify-center h-home-screen'}>
        <div className={'flex flex-col items-center justify-center'}>
          <GDGLogo className={'h-52 w-72'} />
          <h1 className={'text-2xl font-semibold text-center'}>
            Google Developer Group
            <br /> on Campus Yonsei
          </h1>
          <ChevronDownIcon className={'size-12 mt-24'} />
        </div>
      </div>
    </div>
  )
}
