import ShowMoreContent from '@/app/components/show-more-content'
import Trophy from '@/app/components/svg/trophy'
import Reveal from '@/app/components/motion/reveal'
import type { Locale } from '@/i18n-config'
import activitySectionContents from '@/lib/contents/activity-section'

const PROGRAM_META: Record<string, string> = {
  T19: 'TUE 19:00 · WEEKLY',
  'Part Session': 'BIWEEKLY · PARTS',
  'Solution Challenge': 'GLOBAL · ANNUAL',
  oTP: 'OPEN TEAM PROJECT',
  'Yonsei X Korea Demo Day': 'JOINT DEMO DAY',
  'The Bridge Hackathon': 'KR × JP HACKATHON',
}

const PROGRAM_ACCENT: Record<string, string> = {
  T19: 'bg-gdg-blue-300',
  'Part Session': 'bg-gdg-green-300',
  'Solution Challenge': 'bg-gdg-yellow-300',
  oTP: 'bg-gdg-blue-300',
  'Yonsei X Korea Demo Day': 'bg-yonsei-blue',
  'The Bridge Hackathon': 'bg-gdg-red-300',
}

export default function ProgramsSection({ lang }: { lang: Locale }) {
  return (
    <div className={'grid grid-cols-1 gap-4 md:grid-cols-2'}>
      {activitySectionContents.map((program) => (
        <Reveal key={program.key}>
          <article
            className={
              'bg-surface-raised relative h-full overflow-hidden rounded-2xl p-6 pl-7'
            }
            style={{ contain: 'layout style paint' }}
          >
            <span
              aria-hidden
              className={`absolute top-0 left-0 h-full w-1 ${
                PROGRAM_ACCENT[program.key] ?? 'bg-gdg-blue-300'
              }`}
            />
            <div className={'flex items-start justify-between gap-3'}>
              <div>
                <p
                  className={
                    'text-ink/40 font-mono text-[11px] tracking-widest'
                  }
                >
                  {PROGRAM_META[program.key] ?? ''}
                </p>
                <h3 className={'text-ink mt-1 text-xl font-semibold'}>
                  {program.title}
                </h3>
              </div>
              {program.key === 'Solution Challenge' && (
                <Trophy className={'w-10 shrink-0'} />
              )}
            </div>
            <ShowMoreContent>
              <p className={'text-ink/70 mt-3 text-sm leading-relaxed'}>
                {program.content[lang]}
              </p>
            </ShowMoreContent>
          </article>
        </Reveal>
      ))}
    </div>
  )
}
