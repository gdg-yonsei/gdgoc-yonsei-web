import { getSession } from '@/lib/server/fetcher/get-session'
import SessionPageContent from '@/app/(home)/[lang]/session/[generation]/[sessionId]/session-page-content'
import Modal from '@/app/(home)/[lang]/@modal/(.)session/[generation]/[sessionId]/modal'

export default async function SessionPage({
  params,
}: {
  params: Promise<{ sessionId: string; lang: string }>
}) {
  const { sessionId, lang } = await params
  const sessionData = await getSession(sessionId)

  return (
    <Modal>
      <SessionPageContent
        lang={lang}
        isModal={true}
        sessionData={sessionData}
      />
    </Modal>
  )
}
