import { ReactNode } from 'react'

export default function PageTitle({ children }: { children: ReactNode }) {
  return (
    <h1 className={'text-4xl font-bold px-4 border-b-2 p-2 pt-8'}>
      {children}
    </h1>
  )
}
