import { getSiteUrl } from '@/lib/seo/metadata'
import partsSectionContent from '@/lib/contents/parts-section'
import { CHANNELS } from '@/lib/site/channels'
import { SESSION_CATEGORIES } from '@/lib/site/labels'

export function GET() {
  const url = (path: string) => getSiteUrl(path)
  const lines = [
    '# GDGoC Yonsei',
    '',
    '> Official bilingual website of GDG on Campus Yonsei (GDGoC Yonsei), the student developer community at Yonsei University in Sinchon, Seoul.',
    '',
    'Every page exists in English under /en and in Korean under /ko.',
    '',
    '## Community',
    '- T19 ("Tech at 19:00"): an internal tech-sharing session every Tuesday at 19:00 KST.',
    `- Six parts: ${partsSectionContent.map((part) => part.title).join(', ')}.`,
    '- Programs: part sessions, oTP (Open Tech Project) ending in a demo day, the Google Solution Challenge, Yonsei × Korea Demo Day and The Bridge Hackathon.',
    '',
    '## Sessions',
    `- Session Log, every public session newest first: ${url('/en/session')} · ${url('/ko/session')}`,
    '- One generation: /en/session/{generation} (for example /en/session/25-26). One session: /en/session/{generation}/{sessionId}.',
    `- Hub filters are query parameters, comma-separated: q (text), category (${SESSION_CATEGORIES.join(', ')}), part, generation.`,
    '',
    '## Projects',
    `- Projects showcase: ${url('/en/project')} · ${url('/ko/project')}`,
    '- One generation: /en/project/{generation}. One project: /en/project/{generation}/{projectId}.',
    '- Hub filters: q, generation, tag (tech stack), links (demo, source; every selected link must exist).',
    '',
    '## Members and events',
    `- Members by generation: ${url('/en/member')} · ${url('/ko/member')}`,
    `- Calendar: ${url('/en/calendar')} · ${url('/ko/calendar')}`,
    '',
    '## Machine-readable resources and policies',
    `- Sitemap: ${url('/sitemap.xml')}`,
    `- Robots policy: ${url('/robots.txt')}`,
    '- Session and project pages carry schema.org JSON-LD: Event or LearningResource, CreativeWork or SoftwareSourceCode, and BreadcrumbList.',
    `- Privacy policy: ${url('/en/privacy-policy')} · ${url('/ko/privacy-policy')}`,
    `- Terms of service: ${url('/en/terms-of-service')} · ${url('/ko/terms-of-service')}`,
    '',
    '## Official identity',
    `- GDG chapter: ${CHANNELS.chapter}`,
    `- LinkedIn: ${CHANNELS.linkedin}`,
    `- Instagram (recruiting news is posted here first): ${CHANNELS.instagram}`,
    `- Source code: ${CHANNELS.source}`,
    `- Contact: mailto:${CHANNELS.email}`,
    '',
  ]

  return new Response(lines.join('\n'), {
    headers: {
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
      'Content-Type': 'text/plain; charset=utf-8',
    },
  })
}
