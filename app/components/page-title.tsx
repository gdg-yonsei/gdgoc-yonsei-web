import { ReactNode } from 'react'

export default function PageTitle({ children }: { children: ReactNode }) {
  return (
    <div
      className={
        'flex border-b-2 border-neutral-400 pt-8 pb-2 text-4xl font-bold'
      }
    >
      <h1 className={'mx-auto w-full max-w-4xl px-4'}>{children}</h1>
    </div>
  )
}
