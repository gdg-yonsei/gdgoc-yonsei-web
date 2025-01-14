'use client'

import Form from 'next/form'
import { ReactNode, useActionState } from 'react'

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
  const [state, formAction, pending] = useActionState(action, initialState)

  return (
    <Form action={formAction} className={className} disabled={pending}>
      {children}
      {state.error ? (
        <p className={'text-red-500 m-auto'}>{state.error}</p>
      ) : (
        ''
      )}
    </Form>
  )
}
