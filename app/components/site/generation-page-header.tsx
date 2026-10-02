/**
 * 기수 아카이브 페이지(`/session/{기수}`, `/project/{기수}`, `/member/{기수}`) 상단.
 *
 * 브레드크럼, 제목·설명, 활동 기간, 이전·다음 기수 이동 버튼을 그린다. 세 페이지가
 * 같은 마크업을 쓰도록 한곳에 모았다.
 */
import Breadcrumbs from '@/app/components/site/breadcrumbs'
import GenerationPager from '@/app/components/site/generation-pager'
import PageHeader from '@/app/components/site/page-header'
import { archiveCommonCopy } from '@/lib/contents/archive-copy'
import { fillTemplate } from '@/lib/format/text'
import type { Locale } from '@/lib/i18n'
import { generationNeighbors, type GenerationRef } from '@/lib/site/generations'
import { localeHref, type ArchiveSection } from '@/lib/site/routes'

/** 섹션별 브레드크럼 라벨 키(`archiveCommonCopy`). */
const SECTION_LABEL = {
  session: 'sessions',
  project: 'projects',
  member: 'members',
} as const satisfies Record<ArchiveSection, string>

/**
 * 기수 페이지 상단: 경로 표시, 제목·설명, 활동 기간, 이전·다음 기수 링크.
 *
 * @param section 어느 기록의 기수 페이지인지
 */
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
  /** 현재 기수(이름과 활동 기간). */
  current: GenerationRef & { startDate: string; endDate: string | null }
  /** 전체 기수 목록. 이전·다음 기수를 계산하는 데 쓴다. */
  generations: readonly GenerationRef[]
  tag: string
  /** `{generation}` 자리표시자가 들어간 제목·설명 문구. */
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
