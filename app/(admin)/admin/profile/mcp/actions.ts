'use server'

import { redirect } from 'next/navigation'
import { getLocalizedAdminPath } from '@/lib/admin-i18n/server'
import { revokeMcpConnection } from '@/lib/server/services/admin/mcp-connections'
import { getWebActor } from '@/lib/server/services/admin/web-actor'

/** 이미 끊긴 연결은 그대로 돌아가고, 실패하면 폼에 재시도 안내를 표시한다. */
export async function disconnectMcpClientAction(
  _previousState: { failed: boolean },
  formData: FormData
): Promise<{ failed: boolean }> {
  const actor = await getWebActor()
  const clientId = formData.get('clientId')

  if (!actor || typeof clientId !== 'string') return { failed: true }
  const result = await revokeMcpConnection(actor, clientId)
  if (!result.ok && result.code !== 'NOT_FOUND') return { failed: true }

  redirect(await getLocalizedAdminPath('/admin/profile/mcp'))
}
