import { getSiteUrl } from '@/lib/seo/metadata'

export function GET() {
  const lines = [
    '# GDGoC Yonsei',
    '',
    '> Official bilingual website of GDGoC Yonsei, the student developer community at Yonsei University.',
    '',
    '## Primary pages',
    `- English home: ${getSiteUrl('/en')}`,
    `- Korean home: ${getSiteUrl('/ko')}`,
    `- English sessions: ${getSiteUrl('/en/session')}`,
    `- Korean sessions: ${getSiteUrl('/ko/session')}`,
    `- English projects: ${getSiteUrl('/en/project')}`,
    `- Korean projects: ${getSiteUrl('/ko/project')}`,
    `- English members: ${getSiteUrl('/en/member')}`,
    `- Korean members: ${getSiteUrl('/ko/member')}`,
    `- English calendar: ${getSiteUrl('/en/calendar')}`,
    `- Korean calendar: ${getSiteUrl('/ko/calendar')}`,
    '',
    '## Policies and resources',
    `- Sitemap: ${getSiteUrl('/sitemap.xml')}`,
    `- Robots policy: ${getSiteUrl('/robots.txt')}`,
    `- English privacy policy: ${getSiteUrl('/en/privacy-policy')}`,
    `- Korean privacy policy: ${getSiteUrl('/ko/privacy-policy')}`,
    `- English terms: ${getSiteUrl('/en/terms-of-service')}`,
    `- Korean terms: ${getSiteUrl('/ko/terms-of-service')}`,
    '',
    '## Official identity',
    '- GDG chapter: https://gdg.community.dev/gdg-on-campus-yonsei-university-sinchon-campus-seoul-south-korea/',
    '- LinkedIn: https://www.linkedin.com/company/gdsc-yonsei/',
    '- Instagram: https://www.instagram.com/gdg.yonseiuniv/',
    '- Contact: mailto:gdsc.yonsei.univ@gmail.com',
    '',
  ]

  return new Response(lines.join('\n'), {
    headers: {
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
      'Content-Type': 'text/plain; charset=utf-8',
    },
  })
}
