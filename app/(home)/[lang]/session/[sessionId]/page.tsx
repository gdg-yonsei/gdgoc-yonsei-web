import { getSession } from '@/lib/server/fetcher/get-session'
import SessionPageContent from '@/app/(home)/[lang]/session/[sessionId]/session-page-content'
import { getSessions } from '@/lib/server/fetcher/get-sessions'

export async function generateStaticParams() {
  const sessionsData = await getSessions()
  return sessionsData.map((session) => ({ sessionId: session.id }))
}

export default async function SessionPage({
  params,
}: {
  params: Promise<{ sessionId: string; lang: string }>
}) {
  const { sessionId, lang } = await params
  const sessionData = await getSession(sessionId)

  return (
    <div className={'min-h-screen w-full pt-20'}>
      <SessionPageContent lang={lang} sessionData={sessionData} />
    </div>
  )
}
