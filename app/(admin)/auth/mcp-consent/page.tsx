import { eq } from 'drizzle-orm'
import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { ReactNode } from 'react'
import GDGoCYonseiLogo from '@/app/components/svg/gdgoc-yonsei-logo'
import ConsentForm from '@/app/(admin)/auth/mcp-consent/consent-form'
import { getAuthSession } from '@/auth'
import db from '@/db'
import { oauthClient } from '@/db/schema/oauth'
import getUserRole from '@/lib/server/fetcher/admin/get-user-role'
import {
  canConnectMcp,
  consentRedirectHost,
  oauthQueryString,
  selectableScopesFor,
} from '@/lib/mcp/consent'

export const metadata: Metadata = {
  title: 'Connect MCP client',
}

function hostOf(value: string | null | undefined): string {
  if (!value) return ''
  try {
    return new URL(value).host
  } catch {
    return ''
  }
}

function ConsentCard({ children }: { children: ReactNode }) {
  return (
    <div
      className={
        'bg-canvas flex min-h-dvh w-full items-center justify-center p-4'
      }
    >
      <div
        className={
          'border-hairline bg-surface shadow-soft flex w-full max-w-xl flex-col gap-6 rounded-xl border p-6 sm:p-8'
        }
      >
        <GDGoCYonseiLogo className={'h-8 w-auto self-start'} />
        {children}
      </div>
    </div>
  )
}

function ConsentError({ message }: { message: string }) {
  return (
    <ConsentCard>
      <div className={'flex flex-col gap-2'}>
        <h1 className={'type-heading-2 text-ink'}>Cannot connect</h1>
        <p role={'alert'} className={'type-body-sm text-danger'}>
          {message}
        </p>
      </div>
    </ConsentCard>
  )
}

/**
 * MCP 동의 화면. 인가 서버(`@better-auth/mcp`)가 client_id·scope 와 서명을 붙여 보낸다.
 * 서명은 동의 제출(`/oauth2/consent`) 때 서버가 확인하므로 여기서는 표시만 한다.
 */
export default async function McpConsentPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const query = oauthQueryString(params)
  const clientId = typeof params.client_id === 'string' ? params.client_id : ''
  if (!clientId) {
    return <ConsentError message={'This authorization request is invalid.'} />
  }

  const session = await getAuthSession()
  if (!session?.user?.id) {
    return redirect(`/auth/sign-in?${query}`)
  }

  const role = await getUserRole(session.user.id)
  if (!canConnectMcp(role)) {
    return (
      <ConsentError
        message={
          'Only members with admin page access can connect MCP clients. Ask an organizer to approve your account first.'
        }
      />
    )
  }

  const client = await db.query.oauthClient.findFirst({
    where: eq(oauthClient.clientId, clientId),
    columns: { name: true, redirectUris: true },
  })
  const requestedScopes =
    typeof params.scope === 'string'
      ? params.scope.split(' ').filter(Boolean)
      : []

  return (
    <ConsentCard>
      <ConsentForm
        clientName={client?.name || hostOf(clientId) || clientId}
        redirectHost={
          consentRedirectHost({
            requestRedirectUri:
              typeof params.redirect_uri === 'string'
                ? params.redirect_uri
                : undefined,
            registeredRedirectUris: client?.redirectUris ?? [],
            clientId,
          }) || clientId
        }
        requestedScopes={requestedScopes}
        selectableScopes={selectableScopesFor(role)}
      />
    </ConsentCard>
  )
}
