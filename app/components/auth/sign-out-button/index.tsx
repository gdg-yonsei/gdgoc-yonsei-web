'use client'

import signOutAction from '@/app/components/auth/sign-out-button/actions'
import { useFormStatus } from 'react-dom'
import LoadingSpinner from '@/app/components/loading-spinner'

/**
 * 로그아웃 form submit 버튼
 * @param className
 * @param spinnerClassName
 * @param label
 * @constructor
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

/**
 * 로그가웃 버튼
 * @param className
 * @param spinnerClassName
 * @param label
 * @constructor
 */
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
