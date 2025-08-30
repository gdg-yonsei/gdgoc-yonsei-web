import { redirect } from 'next/navigation'
import getLastGeneration from '@/lib/server/fetcher/getLastGeneration'

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
    redirect(`/${paramsData.lang}/member/${lastGeneration.name}`)
  }
  return <></>
}
