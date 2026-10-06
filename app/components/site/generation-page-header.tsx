import Breadcrumbs from '@/app/components/site/breadcrumbs'
import GenerationPager from '@/app/components/site/generation-pager'
import PageHeader from '@/app/components/site/page-header'
import { archiveCommonCopy } from '@/lib/contents/archive-copy'
import { fillTemplate } from '@/lib/format/text'
import type { Locale } from '@/lib/i18n'
import { generationNeighbors, type GenerationRef } from '@/lib/site/generations'
import { localeHref, type ArchiveSection } from '@/lib/site/routes'

const SECTION_LABEL = {
  session: 'sessions',
  project: 'projects',
  member: 'members',
} as const satisfies Record<ArchiveSection, string>

export default function GenerationPageHeader({
  lang,
  section,
  current,
  generations,
  tag,
  titleTemplate,
  descriptionTemplate,
}: {
  lang: Locale
  section: ArchiveSection

  current: GenerationRef & { startDate: string; endDate: string | null }

  generations: readonly GenerationRef[]
  tag: string
  /** 제목·설명 문구에는 `{generation}` 자리표시자가 들어간다. */
  titleTemplate: string
  descriptionTemplate: string
}) {
  const common = archiveCommonCopy[lang]
  const generation = current.name
  const { older, newer } = generationNeighbors(generations, generation)

  return (
    <>
      <Breadcrumbs
        label={common.breadcrumb}
        items={[
          { label: common.home, href: localeHref(lang) },
          {
            label: common[SECTION_LABEL[section]],
            href: localeHref(lang, `/${section}`),
          },
          { label: generation },
        ]}
      />
      <PageHeader
        tag={tag}
        title={fillTemplate(titleTemplate, { generation })}
        description={fillTemplate(descriptionTemplate, { generation })}
        meta={
          <>
            <span>
              {current.startDate}
              {current.endDate ? ` – ${current.endDate}` : ''}
            </span>
            <GenerationPager
              basePath={section}
              lang={lang}
              older={older}
              newer={newer}
              label={common.generations}
              olderLabel={common.olderGeneration}
              newerLabel={common.newerGeneration}
            />
          </>
        }
      />
    </>
  )
}
