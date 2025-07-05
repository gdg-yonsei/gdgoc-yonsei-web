'use client'

import signOutAction from '@/app/components/auth/sign-out-button/actions'
import { useFormStatus } from 'react-dom'
import LoadingSpinner from '@/app/components/loading-spinner'

/**
 * 로그아웃 form submit 버튼
 * @param className
 * @param spinnerClassName
 * @constructor
 */
function SubmitButton({
  className,
  spinnerClassName,
}: {
  className?: string
  spinnerClassName?: string
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
      <p>Sign Out</p>
    </button>
  )
}

/**
 * 로그가웃 버튼
 * @param className
 * @param spinnerClassName
 * @constructor
 */
export function SignOutButton({
  className,
  spinnerClassName,
}: {
  className?: string
  spinnerClassName?: string
}) {
  return (
    <form action={signOutAction}>
      <SubmitButton className={className} spinnerClassName={spinnerClassName} />
    </form>
  )
}
