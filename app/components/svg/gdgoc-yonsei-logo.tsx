import GDGLogo from '@/app/components/svg/gdg-logo'

/**
 * GDGoC Yonsei Logo 컴포넌트
 * @param className
 * @constructor
 */
export default function GDGoCYonseiLogo({ className }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <GDGLogo className={'w-16 md:w-24'} svgKey={'GDGoCYonseiLogo'} />
      <div className={'flex flex-col'}>
        <p className={'text-lg'}>Google Developer Group</p>
        <p className={'text-blue-400'}>Yonsei University</p>
      </div>
    </div>
  )
}
