import { ReactNode } from 'react'

export default function PageTitle({ children }: { children: ReactNode }) {
  return (
    <div
      className={
        'text-4xl font-bold border-b-2 pb-2 pt-8 flex border-neutral-400'
      }
    >
      <h1 className={'w-full max-w-4xl mx-auto px-4'}>{children}</h1>
    </div>
  )
}
