import { ReactNode } from 'react'

export default async function LanguageLayout({
  children,
  params,
}: {
  children: ReactNode
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
  console.log(lang)

  return <>{children}</>
}
