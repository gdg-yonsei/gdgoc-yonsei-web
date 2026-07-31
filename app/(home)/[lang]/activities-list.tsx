import type { Locale } from '@/i18n-config'
import activitySectionContents from '@/lib/contents/activity-section'

/**
 * Renders activity descriptions in the initial HTML so search engines,
 * assistive technology, and users without JavaScript receive the same content.
 */
export default function ActivitiesList({ lang }: { lang: Locale }) {
  return (
    <div className="flex w-full flex-col items-center gap-6">
      <div className="no-scrollbar flex w-full snap-x gap-6 overflow-x-auto px-[max(1rem,calc(50vw-32rem))] py-8">
        {activitySectionContents.map((activity) => (
          <article
            key={activity.key}
            className={`flex min-h-80 w-72 flex-none snap-center flex-col rounded-2xl p-6 text-white shadow-sm ${activity.className}`}
          >
            <h3 className="text-2xl font-semibold break-words">
              {activity.title}
            </h3>
            <p className="mt-4 text-sm leading-6 text-white/95">
              {activity.content[lang]}
            </p>
          </article>
        ))}
      </div>
      <p className="px-4 text-center text-sm text-neutral-700">
        {lang === 'ko'
          ? '가로로 스크롤하여 GDGoC Yonsei의 주요 활동을 살펴보세요.'
          : 'Scroll horizontally to explore GDGoC Yonsei activities.'}
      </p>
    </div>
  )
}
