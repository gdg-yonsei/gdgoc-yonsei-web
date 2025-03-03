import { SessionPageContent } from '@/app/(home)/sessions/[sessionId]/page'
import { getSession } from '@/lib/fetcher/get-session'

export default async function SessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>
}) {
  const { sessionId } = await params
  const sessionData = await getSession(sessionId)

  return (
    <div
      className={
        'w-full h-screen p-8 bg-neutral-500/50 fixed top-0 left-0 flex items-center justify-center'
      }
    >
      <SessionPageContent sessionData={sessionData} />
    </div>
  )
}
