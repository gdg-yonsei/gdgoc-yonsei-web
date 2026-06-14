import { redirect } from 'next/navigation'
import languageParamChecker from '@/lib/language-param-checker'
import { getLatestGenerationForRedirect } from '@/lib/server/queries/public/generations'
import { connection } from 'next/server'

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
  await connection()
  const paramsData = await params
  const lang = languageParamChecker(paramsData.lang)
  const lastGeneration = await getLatestGenerationForRedirect()

  if (lastGeneration) {
    redirect(`/${lang}/member/${lastGeneration.name}`)
  }
  return <></>
}
