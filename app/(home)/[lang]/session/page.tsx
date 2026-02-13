import { redirect } from 'next/navigation'
import getLatestGeneration from '@/lib/server/fetcher/getLastGeneration'

export default async function SessionRedirect({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const [lastGeneration, paramsData] = await Promise.all([
    getLatestGeneration(),
    params,
  ])

  if (lastGeneration) {
    redirect(`/${paramsData.lang}/session/${lastGeneration.name}`)
  }
  return <></>
}
