/** 공지 버튼이 보내는 MCP 소개·설치 안내. 역할별 작업 목록은 lib/mcp/tools의 권한 게이트와 맞춰야 한다. */
import Link from 'next/link'
import type { Metadata } from 'next'
import AdminDefaultLayout from '@/app/components/admin/admin-default-layout'
import AdminPageHeader from '@/app/components/admin/page-header'
import McpInstallGuide from '@/app/components/admin/mcp-install-guide'
import { getMcpResourceUrl } from '@/lib/mcp/config'
import {
  getAdminLocale,
  getAdminMessages,
  localizeAdminHref,
} from '@/lib/admin-i18n/server'

export const metadata: Metadata = {
  title: 'GYMS MCP',
}

export default async function McpGuidePage() {
  const locale = await getAdminLocale()
  const t = getAdminMessages(locale)

  const roleTasks = [
    { role: t.mcpGuideRoleEveryone, tasks: t.mcpGuideRoleEveryoneTasks },
    { role: t.mcpGuideRoleMember, tasks: t.mcpGuideRoleMemberTasks },
    { role: t.mcpGuideRoleCore, tasks: t.mcpGuideRoleCoreTasks },
    { role: t.mcpGuideRoleLead, tasks: t.mcpGuideRoleLeadTasks },
  ]
  const examples = [t.mcpGuideExample1, t.mcpGuideExample2, t.mcpGuideExample3]

  return (
    <AdminDefaultLayout className={'gap-6'}>
      <AdminPageHeader
        title={t.mcpGuideTitle}
        description={t.mcpGuideDescription}
      />

      <div className={'grid grid-cols-1 gap-4 lg:grid-cols-2'}>
        <section
          aria-labelledby={'mcp-guide-capabilities'}
          className={'admin-card flex flex-col gap-3'}
        >
          <div className={'flex flex-col gap-1'}>
            <h2 id={'mcp-guide-capabilities'} className={'type-title text-ink'}>
              {t.mcpGuideCapabilities}
            </h2>
            <p className={'type-caption text-ink-muted'}>
              {t.mcpGuideCapabilitiesHint}
            </p>
          </div>
          <dl className={'divide-hairline flex flex-col divide-y'}>
            {roleTasks.map(({ role, tasks }) => (
              <div
                key={role}
                className={'flex flex-col gap-1 py-3 first:pt-0 last:pb-0'}
              >
                <dt className={'type-body-sm text-ink font-semibold'}>
                  {role}
                </dt>
                <dd className={'type-body-sm text-ink-muted'}>{tasks}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section
          aria-labelledby={'mcp-guide-examples'}
          className={'admin-card flex flex-col gap-3'}
        >
          <h2 id={'mcp-guide-examples'} className={'type-title text-ink'}>
            {t.mcpGuideExamples}
          </h2>
          <ul className={'flex flex-col gap-2'}>
            {examples.map((example) => (
              <li
                key={example}
                className={
                  'bg-surface-sunken type-body-sm text-ink rounded-md px-3 py-2'
                }
              >
                {example}
              </li>
            ))}
          </ul>
        </section>
      </div>

      <McpInstallGuide mcpUrl={getMcpResourceUrl()} />

      <section
        aria-labelledby={'mcp-guide-manage'}
        className={'admin-card flex flex-col gap-3'}
      >
        <div className={'flex flex-col gap-1'}>
          <h2 id={'mcp-guide-manage'} className={'type-title text-ink'}>
            {t.mcpGuideManageTitle}
          </h2>
          <p className={'type-caption text-ink-muted'}>
            {t.mcpGuideManageHint}
          </p>
        </div>
        <Link
          href={localizeAdminHref('/admin/profile/mcp', locale)}
          className={'admin-btn-secondary w-fit'}
        >
          {t.mcpGuideManageLink}
        </Link>
      </section>
    </AdminDefaultLayout>
  )
}
