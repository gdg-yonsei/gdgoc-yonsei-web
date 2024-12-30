import GDGLogo from '@/public/logo/gdg.svg'

/**
 * GDGoC Yonsei Logo 컴포넌트
 * @param className
 * @constructor
 */
export default function GDGoCYonseiLogo({ className }: { className: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <GDGLogo className={'w-16 md:w-24'} />
      <p className={'text-xs md:text-base'}>
        Google Developer Groups <br />
        on Campus Yonsei
      </p>
    </div>
  )
}
