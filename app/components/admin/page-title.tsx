import { ReactNode } from 'react'

export default function PageTitle({ children }: { children: ReactNode }) {
  return <div className={'text-3xl font-bold'}>{children}</div>
}
