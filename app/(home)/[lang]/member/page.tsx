import { redirect } from 'next/navigation'
import languageParamChecker from '@/lib/language-param-checker'
import { getLatestGeneration } from '@/lib/server/queries/public/generations'

/**
 * 만약 사용자가 Member 페이지에 generation path 없이 들어올 경우 가장 최근 generation으로 redirect 하는 페이지
 * @param params
 * @constructor
 */
export default async function MemberRedirect({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const paramsData = await params
  const lang = languageParamChecker(paramsData.lang)
  const lastGeneration = await getLatestGeneration(lang)

  if (lastGeneration) {
    redirect(`/${lang}/member/${lastGeneration.name}`)
  }
  return <></>
}
