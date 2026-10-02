/**
 * GDG 로고와 "Google Developer Group / On Campus Yonsei University" 글자를 묶은 가로형 로고. 로그인·권한 화면에서 쓴다.
 */
import GDGLogo from '@/app/components/svg/gdg-logo'
import { cn } from '@/lib/cn'

/**
 * 가로형 GDGoC Yonsei 로고.
 * @param className 바깥 래퍼에 더할 클래스
 */
export default function GDGoCYonseiLogo({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <GDGLogo className={'w-16 md:w-20'} svgKey={'GDGoCYonseiLogo'} />
      <div className={'flex flex-col'}>
        <p className={'text-xl'}>Google Developer Group</p>
        <p className={'text-blue-400'}>Yonsei University</p>
      </div>
    </div>
  )
}
