'use client'

import { signOutAction } from '@/app/components/auth/sign-out-button/actions'
import { useFormStatus } from 'react-dom'
import LoadingSpinner from '@/app/components/admin/loading-spinner'

function SubmitButton({
  className,
  spinnerClassName,
  label = 'Sign Out',
}: {
  className?: string | undefined
  spinnerClassName?: string | undefined
  label?: string | undefined
}) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
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

export function SignOutButton({
  className,
  spinnerClassName,
  label,
}: {
  className?: string | undefined
  spinnerClassName?: string | undefined
  label?: string | undefined
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
