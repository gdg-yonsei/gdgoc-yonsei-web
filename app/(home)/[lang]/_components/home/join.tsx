import { Fragment } from 'react'
import type { Locale } from '@/i18n-config'
import BracketPoster from '@/app/components/site/bracket-poster'
import ButtonLink, { buttonClasses } from '@/app/components/site/button-link'
import ExternalLink from '@/app/components/site/external-link'
import SectionTag from '@/app/components/site/section-tag'
import { landingCopy } from '@/lib/contents/site-copy'
import { CHANNELS } from '@/lib/site/channels'

/**
 * `<join>`: the bookend to the hero. The brackets close around the call to
 * action as the section scrolls in (site-home.css, or the join scene); with
 * reduced motion they simply sit closed. Title words are set apart for the
 * scene's closing pop.
 */
export default function Join({ lang }: { lang: Locale }) {
  const copy = landingCopy[lang].join

  return (
    <section aria-labelledby="join-title" data-scene="join" className="join">
      <div className="join-inner">
        <span aria-hidden="true" className="join-bracket" data-side="left">
          <BracketPoster side="left" />
        </span>
        <div className="join-body">
          <SectionTag>{copy.tag}</SectionTag>
          <h2 id="join-title" className="join-title">
            {copy.title.split(' ').map((word, index) => (
              <Fragment key={index}>
                {index > 0 && ' '}
                <span className="join-word">{word}</span>
              </Fragment>
            ))}
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
