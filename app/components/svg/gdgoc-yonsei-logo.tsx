import GDGLogo from '@/app/components/svg/gdg-logo'
import { cn } from '@/lib/cn'

export default function GDGoCYonseiLogo({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <GDGLogo className={'w-16 md:w-20'} svgKey={'GDGoCYonseiLogo'} />
      <div className={'flex flex-col'}>
        <p className={'text-xl'}>Google Developer Group</p>
        <p className={'text-primary'}>Yonsei University</p>
      </div>
    </div>
  )
}
