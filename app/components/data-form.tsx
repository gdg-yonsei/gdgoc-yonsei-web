'use client'

import { FormEvent, ReactNode, startTransition, useActionState } from 'react'

const initialState = {
  error: '',
}

/**
 * Data Form
 * @param action - form action
 * @param children - React Children
 * @param className - classname of form
 * @constructor
 */
export default function DataForm({
  action,
  children,
  className,
}: {
  children: ReactNode
  action: (
    state: {
      error: string
    },
    formData: FormData
  ) => { error: string } | Promise<{ error: string }>
  className?: string
}) {
  const [state, formAction] = useActionState(action, initialState)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    startTransition(() => formAction(formData))
  }

  return (
    <form onSubmit={handleSubmit} className={className}>
      {children}
      {state.error ? (
        <p className={'m-auto text-red-500'}>{state.error}</p>
      ) : (
        ''
      )}
    </form>
  )
}
