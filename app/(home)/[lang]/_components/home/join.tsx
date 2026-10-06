import { Fragment } from 'react'
import type { Locale } from '@/lib/i18n'
import BracketPoster from '@/app/components/site/bracket-poster'
import ButtonLink, { buttonClasses } from '@/app/components/site/button-link'
import ExternalLink from '@/app/components/site/external-link'
import SectionTag from '@/app/components/site/section-tag'
import { landingCopy } from '@/lib/contents/site-copy'
import { CHANNELS } from '@/lib/site/channels'
import { localeHref } from '@/lib/site/routes'

/** 움직임 줄이기에서는 괄호가 처음부터 닫히며, 제목 단어 래퍼는 join 장면의 마지막 연출에 쓰인다. */
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
              <ButtonLink
                href={localeHref(lang, '/calendar')}
                tone="stageOutline"
              >
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
