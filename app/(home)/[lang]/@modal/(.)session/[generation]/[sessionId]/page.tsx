import { getSession } from '@/lib/server/fetcher/get-session'
import SessionPageContent from '@/app/(home)/[lang]/session/[generation]/[sessionId]/session-page-content'
import Modal from '@/app/(home)/[lang]/@modal/(.)session/[generation]/[sessionId]/modal'
import { notFound } from 'next/navigation'

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
    <Modal>
      <SessionPageContent
        generation={generation}
        lang={lang}
        isModal={true}
        sessionData={sessionData}
      />
    </Modal>
  )
}
