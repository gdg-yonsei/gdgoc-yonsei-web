import { getSession } from '@/lib/server/fetcher/get-session'
import SessionPageContent from '@/app/(home)/[lang]/session/[generation]/[sessionId]/session-page-content'
import { getSessions } from '@/lib/server/fetcher/get-sessions'
import { notFound } from 'next/navigation'

export async function generateStaticParams() {
  const sessionsData = await getSessions()
  return sessionsData.map((session) => ({ sessionId: session.id }))
}

export default async function SessionPage({
  params,
}: {
  params: Promise<{ sessionId: string; lang: string; generation: string }>
}) {
  const { sessionId, lang, generation } = await params
  const sessionData = await getSession(sessionId)

  if (!sessionData) {
    notFound()
  }

  return (
    <div className={'min-h-screen w-full pt-20'}>
      <SessionPageContent
        lang={lang}
        sessionData={sessionData}
        generation={generation}
      />
    </div>
  )
}
