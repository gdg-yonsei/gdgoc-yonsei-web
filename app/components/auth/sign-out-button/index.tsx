'use client'

/**
 * 로그아웃 버튼(클라이언트 컴포넌트). 폼 제출로 `signOutAction`을 호출한다.
 */
import { signOutAction } from '@/app/components/auth/sign-out-button/actions'
import { useFormStatus } from 'react-dom'
import LoadingSpinner from '@/app/components/admin/loading-spinner'

/**
 * 제출 중이면 스피너를 보여 주는 로그아웃 제출 버튼.
 *
 * @param className 버튼 클래스
 * @param spinnerClassName 스피너 크기·색 클래스
 * @param label 버튼 문구
 */
function SubmitButton({
  className,
  spinnerClassName,
  label = 'Sign Out',
}: {
  className?: string
  spinnerClassName?: string
  label?: string
}) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className={className ? className : 'button-black'}
    >
      {pending ? (
        <LoadingSpinner
          className={
            spinnerClassName
              ? spinnerClassName
              : 'size-6 border-2 border-neutral-700 border-t-white'
          }
        />
      ) : (
        ''
      )}
      <p>{label}</p>
    </button>
  )
}

/** 로그아웃 폼과 버튼. props는 내부 `SubmitButton`에 그대로 넘긴다. */
export function SignOutButton({
  className,
  spinnerClassName,
  label,
}: {
  className?: string
  spinnerClassName?: string
  label?: string
}) {
  return (
    <form action={signOutAction}>
      <SubmitButton
        className={className}
        spinnerClassName={spinnerClassName}
        label={label}
      />
    </form>
  )
}
