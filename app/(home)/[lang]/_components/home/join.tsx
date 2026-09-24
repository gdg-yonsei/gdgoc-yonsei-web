import type { Locale } from '@/i18n-config'
import BracketPoster from '@/app/components/site/bracket-poster'
import ButtonLink, { buttonClasses } from '@/app/components/site/button-link'
import ExternalLink from '@/app/components/site/external-link'
import SectionTag from '@/app/components/site/section-tag'
import { landingCopy } from '@/lib/contents/site-copy'
import { CHANNELS } from '@/lib/site/channels'

/**
 * `<join>`: the bookend to the hero. The brackets close around the call to
 * action as the section scrolls in (site-home.css); with reduced motion they
 * simply sit closed.
 */
export default function Join({ lang }: { lang: Locale }) {
  const copy = landingCopy[lang].join

  return (
    <section aria-labelledby="join-title" className="join">
      <div className="join-inner">
        <span aria-hidden="true" className="join-bracket" data-side="left">
          <BracketPoster side="left" />
        </span>
        <div className="join-body">
          <SectionTag>{copy.tag}</SectionTag>
          <h2 id="join-title" className="join-title">
            {copy.title}
          </h2>
          <p className="join-lead">{copy.lead}</p>
          <ul className="join-actions">
            <li>
              <ExternalLink
                href={CHANNELS.instagram}
                className={buttonClasses('stageSolid')}
              >
                {copy.instagram}
              </ExternalLink>
            </li>
            <li>
              <ExternalLink
                href={CHANNELS.linkedin}
                className={buttonClasses('stageOutline')}
              >
                {copy.linkedin}
              </ExternalLink>
            </li>
            <li>
              <ButtonLink href={`/${lang}/calendar`} tone="stageOutline">
                {copy.calendar}
              </ButtonLink>
            </li>
          </ul>
        </div>
        <span aria-hidden="true" className="join-bracket" data-side="right">
          <BracketPoster side="right" />
        </span>
      </div>
    </section>
  )
}
