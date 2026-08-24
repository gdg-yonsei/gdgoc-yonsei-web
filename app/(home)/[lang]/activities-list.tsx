import type { Locale } from '@/i18n-config'
import activitySectionContents from '@/lib/contents/activity-section'
import ActivitiesCarousel from '@/app/(home)/[lang]/activities-carousel'

/**
 * Renders activity descriptions in the initial HTML so search engines,
 * assistive technology, and users without JavaScript receive the same content.
 */
export default function ActivitiesList({ lang }: { lang: Locale }) {
  return (
    <ActivitiesCarousel lang={lang}>
      {activitySectionContents.map((activity) => (
        <article
          key={activity.key}
          data-activity-card
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
    </ActivitiesCarousel>
  )
}
