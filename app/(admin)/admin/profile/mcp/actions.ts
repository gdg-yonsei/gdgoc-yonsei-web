'use server'

/**
 * MCP 연결 끊기 Server Action(`/admin/profile/mcp`).
 */
import { redirect } from 'next/navigation'
import { getLocalizedAdminPath } from '@/lib/admin-i18n/server'
import { revokeMcpConnection } from '@/lib/server/services/admin/mcp-connections'
import { getWebActor } from '@/lib/server/services/admin/web-actor'

/**
 * 폼의 `clientId` 연결을 끊고 연결 관리 화면으로 돌아간다. 이미 끊긴 연결이면 그대로 돌아간다(목록에서
 * 사라진 것으로 충분하다). 로그인하지 않았으면 아무것도 바꾸지 않는다.
 */
export async function disconnectMcpClientAction(formData: FormData) {
  const actor = await getWebActor()
  const clientId = formData.get('clientId')

  if (actor && typeof clientId === 'string') {
    await revokeMcpConnection(actor, clientId)
  }

  redirect(await getLocalizedAdminPath('/admin/profile/mcp'))
}
