import type { ComponentType, SVGProps } from 'react'
import Reveal from '@/app/components/motion/reveal'
import BookSvg from '@/app/components/svg/book-svg'
import Friends from '@/app/components/svg/friends'
import FriendsTree from '@/app/components/svg/friends-tree'
import type { Locale } from '@/i18n-config'
import aboutPageContents from '@/lib/contents/about-page'

const STORY_ART: Record<string, ComponentType<SVGProps<SVGSVGElement>>> = {
  connect: Friends,
  learn: BookSvg,
  grow: FriendsTree,
}

export default function StorySection({ lang }: { lang: Locale }) {
  return (
    <section className={'w-full px-6 py-20'}>
      <div className={'mx-auto flex max-w-4xl flex-col gap-16'}>
        {aboutPageContents.story.map((chapter, index) => {
          const Art = STORY_ART[chapter.key]!
          return (
            <Reveal key={chapter.key}>
              <div
                className={`flex flex-col items-center gap-8 md:gap-14 ${
                  index % 2 === 1 ? 'md:flex-row-reverse' : 'md:flex-row'
                }`}
              >
                <div className={'flex-1'}>
                  <p className={'text-yonsei-blue font-mono text-sm'}>
                    {chapter.order}
                  </p>
                  <h3 className={'text-ink mt-1 text-3xl font-bold'}>
                    {chapter.title}
                  </h3>
                  <p className={'text-ink/70 mt-3 leading-relaxed'}>
                    {chapter.body[lang]}
                  </p>
                </div>
                <div
                  className={
                    'flex w-40 shrink-0 items-center justify-center md:w-56'
                  }
                >
                  <Art className={'w-full'} />
                </div>
              </div>
            </Reveal>
          )
        })}
      </div>
    </section>
  )
}
