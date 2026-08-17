import type { ReactNode } from 'react'
import languageParamChecker from '@/lib/language-param-checker'
import { getProjectStaticParams } from '@/lib/server/queries/public/static-params'

type StaticParamsContext = {
  params: { lang: string }
}

export async function generateStaticParams({ params }: StaticParamsContext) {
  return getProjectStaticParams(languageParamChecker(params.lang))
}

export default function ProjectDetailLayout({
  children,
}: {
  children: ReactNode
}) {
  return children
}
