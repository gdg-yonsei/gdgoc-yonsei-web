import { getSession } from '@/lib/fetcher/get-session'
import SessionPageContent from '@/app/(home)/sessions/[sessionId]/session-page-content'

export default async function SessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>
}) {
  const { sessionId } = await params
  const sessionData = await getSession(sessionId)

  return (
    <div className={'pt-20 w-full min-h-screen'}>
      <SessionPageContent sessionData={sessionData} />
    </div>
  )
}
