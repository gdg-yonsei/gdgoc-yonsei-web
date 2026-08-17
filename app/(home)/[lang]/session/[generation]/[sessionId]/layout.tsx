import type { ReactNode } from 'react'
import languageParamChecker from '@/lib/language-param-checker'
import { getSessionStaticParams } from '@/lib/server/queries/public/static-params'

type StaticParamsContext = {
  params: { lang: string }
}

export async function generateStaticParams({ params }: StaticParamsContext) {
  return getSessionStaticParams(languageParamChecker(params.lang))
}

export default function SessionDetailLayout({
  children,
}: {
  children: ReactNode
}) {
  return children
}
