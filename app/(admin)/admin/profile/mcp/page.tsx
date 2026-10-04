/**
 * MCP 연결 관리 화면(`/admin/profile/mcp`): 연결된 AI 도구 목록·연결 끊기, MCP 활동(감사 로그).
 * 권한은 프로필 레이아웃이 확인한다. LEAD는 `?audit=all`로 모든 멤버의 감사 로그를 본다.
 */
import Link from 'next/link'
import { forbidden } from 'next/navigation'
import { connection } from 'next/server'
import type { Metadata } from 'next'
import { ChevronLeftIcon } from '@heroicons/react/24/outline'
import AdminDefaultLayout from '@/app/components/admin/admin-default-layout'
import AdminEmptyState from '@/app/components/admin/empty-state'
import AdminNavigationButton from '@/app/components/admin/admin-navigation-button'
import DisconnectButton from '@/app/(admin)/admin/profile/mcp/disconnect-button'
import { disconnectMcpClientAction } from '@/app/(admin)/admin/profile/mcp/actions'
import {
  getAdminLocale,
  getAdminMessages,
  localizeAdminHref,
} from '@/lib/admin-i18n/server'
import type { AdminMessages } from '@/lib/admin-i18n'
import type { Locale } from '@/lib/i18n'
import { cn } from '@/lib/cn'
import { formatInstantDateTime } from '@/lib/format/datetime'
import {
  listMcpAuditLog,
  listMcpConnections,
  type McpAuditEntry,
  type McpConnection,
} from '@/lib/server/services/admin/mcp-connections'
import { getWebActor } from '@/lib/server/services/admin/web-actor'

/** 브라우저 탭 제목. */
export const metadata: Metadata = {
  title: 'Connected AI tools',
}

/** 연결 목록과 감사 로그. */
export default async function McpConnectionsPage({
  searchParams,
}: PageProps<'/admin/profile/mcp'>) {
  await connection()
  const [locale, actor, query] = await Promise.all([
    getAdminLocale(),
    getWebActor(),
    searchParams,
  ])
  const t = getAdminMessages(locale)
  if (!actor) forbidden()

  const showAll = query.audit === 'all' && actor.role === 'LEAD'
  const [connections, audit] = await Promise.all([
    listMcpConnections(actor),
    listMcpAuditLog(actor, { allUsers: showAll }),
  ])
  // 조회 실패는 관리자 오류 화면(`error.tsx`)이 보여 준다.
  if (!connections.ok) throw new Error(connections.message)
  if (!audit.ok) throw new Error(audit.message)

  return (
    <AdminDefaultLayout>
      <AdminNavigationButton href={'/admin/profile'}>
        <ChevronLeftIcon className={'size-8'} />
        <p className={'text-lg'}>{t.profile}</p>
      </AdminNavigationButton>
      <div className={'admin-title'}>{t.mcpConnections}</div>
      <p className={'type-body-sm text-ink-muted max-w-prose'}>
        {t.mcpConnectionsDescription}
      </p>
      <ConnectionList connections={connections.data} locale={locale} t={t} />

      <section
        aria-labelledby={'mcp-audit-title'}
        className={'flex flex-col gap-3 pt-6'}
      >
        <div className={'flex flex-wrap items-center justify-between gap-2'}>
          <h2 id={'mcp-audit-title'} className={'type-heading-3 text-ink'}>
            {t.mcpAuditLog}
          </h2>
          {actor.role === 'LEAD' && (
            <nav className={'flex gap-1'} aria-label={t.mcpAuditLog}>
              {[
                { all: false, label: t.mcpAuditLogMine },
                { all: true, label: t.mcpAuditLogAll },
              ].map(({ all, label }) => (
                <Link
                  key={label}
                  href={localizeAdminHref(
                    all ? '/admin/profile/mcp?audit=all' : '/admin/profile/mcp',
                    locale
                  )}
                  aria-current={showAll === all ? 'page' : undefined}
                  className={cn(
                    'admin-btn',
                    showAll === all
                      ? 'bg-primary-soft text-primary'
                      : 'text-ink-secondary hover:bg-canvas'
                  )}
                >
                  {label}
                </Link>
              ))}
            </nav>
          )}
        </div>
        <p className={'type-body-sm text-ink-muted'}>
          {t.mcpAuditLogDescription}
        </p>
        <AuditTable
          entries={audit.data}
          showUser={showAll}
          locale={locale}
          t={t}
        />
      </section>
    </AdminDefaultLayout>
  )
}

/** 연결된 클라이언트 카드 목록. */
function ConnectionList({
  connections,
  locale,
  t,
}: {
  connections: McpConnection[]
  locale: Locale
  t: AdminMessages
}) {
  if (connections.length === 0) {
    return (
      <AdminEmptyState
        title={t.mcpNoConnections}
        description={t.mcpNoConnectionsHint}
      />
    )
  }

  return (
    <ul className={'flex flex-col gap-3'} aria-label={t.mcpConnections}>
      {connections.map((connection) => {
        const name = connection.name || t.mcpUnnamedClient
        return (
          <li
            key={connection.clientId}
            className={
              'admin-card flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'
            }
          >
            <div className={'flex min-w-0 flex-col gap-1'}>
              <div className={'type-title text-ink break-words'}>{name}</div>
              {connection.uri && (
                <div className={'type-caption text-ink-muted break-all'}>
                  {connection.uri}
                </div>
              )}
              <div className={'flex flex-wrap items-center gap-1'}>
                <span className={'admin-field-label'}>{t.mcpScopes}</span>
                {connection.scopes.map((scope) => (
                  <span key={scope} className={'admin-badge-neutral'}>
                    {scope}
                  </span>
                ))}
              </div>
              <dl
                className={
                  'type-caption text-ink-muted grid grid-cols-[auto_1fr] gap-x-2'
                }
              >
                <dt>{t.mcpConnectedAt}</dt>
                <dd>
                  <time dateTime={connection.connectedAt.toISOString()}>
                    {formatInstantDateTime(connection.connectedAt, locale)}
                  </time>
                </dd>
                <dt>{t.mcpLastUsedAt}</dt>
                <dd>
                  {connection.lastUsedAt ? (
                    <time dateTime={connection.lastUsedAt.toISOString()}>
                      {formatInstantDateTime(connection.lastUsedAt, locale)}
                    </time>
                  ) : (
                    t.mcpNeverUsed
                  )}
                </dd>
              </dl>
            </div>
            <DisconnectButton
              action={disconnectMcpClientAction}
              clientId={connection.clientId}
              clientName={name}
            />
          </li>
        )
      })}
    </ul>
  )
}

/** 감사 로그 표. 행은 링크가 아니므로 `AdminDataTable` 대신 같은 표 스타일만 쓴다. */
function AuditTable({
  entries,
  showUser,
  locale,
  t,
}: {
  entries: McpAuditEntry[]
  showUser: boolean
  locale: Locale
  t: AdminMessages
}) {
  if (entries.length === 0) {
    return <AdminEmptyState title={t.mcpAuditEmpty} />
  }

  const columns = [
    { key: 'time', header: t.mcpAuditTime, width: '11rem' },
    ...(showUser
      ? [{ key: 'user', header: t.mcpAuditUser, width: 'minmax(0,1fr)' }]
      : []),
    { key: 'tool', header: t.mcpAuditTool, width: 'minmax(0,1.2fr)' },
    { key: 'result', header: t.mcpAuditResult, width: '10rem' },
    { key: 'client', header: t.mcpAuditClient, width: 'minmax(0,1fr)' },
    { key: 'target', header: t.mcpAuditTarget, width: 'minmax(0,1.4fr)' },
  ]

  return (
    <div
      className={'admin-table'}
      style={
        {
          '--admin-table-cols': columns.map((column) => column.width).join(' '),
        } as React.CSSProperties
      }
    >
      <div className={'admin-table-head'}>
        {columns.map((column) => (
          <div key={column.key}>{column.header}</div>
        ))}
      </div>
      <ul className={'admin-table-body'} aria-label={t.mcpAuditLog}>
        {entries.map((entry) => (
          <li key={entry.id} className={'admin-table-row'}>
            <span className={'admin-table-cell admin-table-cell-primary'}>
              <time dateTime={entry.createdAt.toISOString()}>
                {formatInstantDateTime(entry.createdAt, locale)}
              </time>
            </span>
            {showUser && (
              <span className={'admin-table-cell'} data-label={t.mcpAuditUser}>
                {entry.userName ?? '—'}
              </span>
            )}
            <span className={'admin-table-cell'} data-label={t.mcpAuditTool}>
              <code>{entry.tool}</code>
            </span>
            <span className={'admin-table-cell'} data-label={t.mcpAuditResult}>
              {entry.outcome === 'ok' ? (
                <span className={'admin-badge-success'}>{t.mcpAuditOk}</span>
              ) : (
                <span
                  className={'admin-badge-danger'}
                  title={entry.errorCode ?? ''}
                >
                  {t.mcpAuditError}
                  {entry.errorCode ? ` · ${entry.errorCode}` : ''}
                </span>
              )}
            </span>
            <span className={'admin-table-cell'} data-label={t.mcpAuditClient}>
              {entry.clientName ?? entry.clientId ?? '—'}
            </span>
            <span className={'admin-table-cell'} data-label={t.mcpAuditTarget}>
              {entry.targetId ?? '—'}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
