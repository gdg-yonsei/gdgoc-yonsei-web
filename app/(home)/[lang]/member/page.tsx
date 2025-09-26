import { redirect } from 'next/navigation'
import getLastGeneration from '@/lib/server/fetcher/getLastGeneration'
import languageParamChecker from '@/lib/language-param-checker'

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
  const [lastGeneration, paramsData] = await Promise.all([
    getLastGeneration(),
    params,
  ])

  if (lastGeneration) {
    redirect(
      `/${languageParamChecker(paramsData.lang)}/member/${lastGeneration.name}`
    )
  }
  return <></>
}
