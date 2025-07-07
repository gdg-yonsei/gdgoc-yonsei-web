import { getSession } from '@/lib/fetcher/get-session'
import SessionPageContent from '@/app/(home)/[lang]/sessions/[sessionId]/session-page-content'
import Modal from '@/app/(home)/[lang]/@modal/(.)sessions/[sessionId]/modal'

export default async function SessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>
}) {
  const { sessionId } = await params
  const sessionData = await getSession(sessionId)

  return (
    <Modal>
      <SessionPageContent isModal={true} sessionData={sessionData} />
    </Modal>
  )
}
