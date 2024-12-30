'use client'

/**
 * Loading Spinner
 *
 * 추가 클래스 설정시 기존 클래스에 덮어씌워집니다.
 * Default CSS: size-10 border-4 border-t-sky-500 border-neutral-300/50
 * @param className
 * @constructor
 */
export default function LoadingSpinner({
  className = 'size-10 border-4 border-t-sky-500 border-neutral-300/50',
}: {
  className?: string
}) {
  return (
    <div className={`${className} border-solid rounded-full animate-spin`} />
  )
}
