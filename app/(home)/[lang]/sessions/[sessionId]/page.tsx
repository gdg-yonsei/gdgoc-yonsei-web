import { getSession } from '@/lib/fetcher/get-session'
import SessionPageContent from '@/app/(home)/[lang]/sessions/[sessionId]/session-page-content'

export default async function SessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>
}) {
  const { sessionId } = await params
  const sessionData = await getSession(sessionId)

  return (
    <div className={'min-h-screen w-full pt-20'}>
      <SessionPageContent sessionData={sessionData} />
    </div>
  )
}
