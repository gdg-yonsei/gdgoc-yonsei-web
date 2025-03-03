import { getSession } from '@/lib/fetcher/get-session'
import { notFound } from 'next/navigation'

export function SessionPageContent({
  sessionData,
}: {
  sessionData: Awaited<ReturnType<typeof getSession>>
}) {
  if (!sessionData) {
    return notFound()
  }

  return (
    <div>
      <div>{sessionData.name}</div>
    </div>
  )
}

export default async function SessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>
}) {
  const { sessionId } = await params
  const sessionData = await getSession(sessionId)

  return (
    <div className={'pt-20 w-full'}>
      <SessionPageContent sessionData={sessionData} />
    </div>
  )
}
