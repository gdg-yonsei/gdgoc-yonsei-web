import { ReactNode } from 'react'

export default function PageTitle({ children }: { children: ReactNode }) {
  return (
    <div className={'text-4xl font-bold px-4 border-b-2 p-2 pt-8 flex'}>
      <h1 className={'w-full max-w-4xl mx-auto'}>{children}</h1>
    </div>
  )
}
