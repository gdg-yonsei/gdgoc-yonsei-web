/**
 * MCP OAuth 동의 화면(`/auth/mcp-consent`).
 *
 * 인가 서버가 동의가 필요할 때 이 화면으로 보낸다. 로그인하지 않았으면 로그인 후 같은 요청으로
 * 돌아오게 하고, MCP를 쓸 수 없는 역할이면 오류를 보여 준다. 구조는 `docs/architecture/mcp.md` 참고.
 */
import { eq } from 'drizzle-orm'
import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { ReactNode } from 'react'
import GDGoCYonseiLogo from '@/app/components/svg/gdgoc-yonsei-logo'
import ConsentForm from '@/app/(admin)/auth/mcp-consent/consent-form'
import { getAuthSession } from '@/auth'
import { db } from '@/db'
import { oauthClient } from '@/db/schema/oauth'
import { getUserRole } from '@/lib/server/fetcher/admin/get-user-role'
import {
  canConnectMcp,
  consentRedirectHost,
  oauthQueryString,
  selectableScopesFor,
} from '@/lib/mcp/consent'

/** 브라우저 탭 제목. */
export const metadata: Metadata = {
  title: 'Connect MCP client',
}

/** URL의 호스트. URL이 아니면 빈 문자열(클라이언트 id가 CIMD URL일 때 이름 대신 쓴다). */
function hostOf(value: string | null | undefined): string {
  if (!value) return ''
  try {
    return new URL(value).host
  } catch {
    return ''
  }
}

/** 동의 화면 공통 카드. */
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

/** 연결할 수 없을 때의 안내 카드. */
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
 * MCP 동의 화면. 인가 서버(`@better-auth/mcp`)가 client_id·scope와 서명을 붙여 보낸다.
 * 서명은 동의 제출(`/oauth2/consent`) 때 서버가 확인하므로 여기서는 표시만 한다.
 */
export default async function McpConsentPage({
  searchParams,
}: PageProps<'/auth/mcp-consent'>) {
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
