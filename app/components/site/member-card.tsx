import EnvelopeIcon from '@heroicons/react/24/outline/EnvelopeIcon'
import type { Locale } from '@/i18n-config'
import {
  GithubIcon,
  InstagramIcon,
  LinkedInIcon,
} from '@/app/components/site/social-icons'
import StaticImage from '@/app/components/site/static-image'
import type { MemberArchiveCopy } from '@/lib/contents/archive-copy'
import { initials } from '@/lib/site/format'
import {
  memberLinks,
  memberName,
  type MemberLinkKind,
  type MemberProfile,
} from '@/lib/site/members'

function LinkIcon({ kind }: { kind: MemberLinkKind }) {
  switch (kind) {
    case 'email':
      return <EnvelopeIcon aria-hidden="true" className="size-4" />
    case 'linkedin':
      return <LinkedInIcon className="size-4" />
    case 'instagram':
      return <InstagramIcon className="size-4" />
    case 'github':
      return <GithubIcon className="size-4" />
  }
}

/** One member. The photo is decorative: the name sits right next to it. */
export default function MemberCard({
  user,
  lang,
  copy,
  preload = false,
}: {
  user: MemberProfile
  lang: Locale
  copy: MemberArchiveCopy
  preload?: boolean
}) {
  const name = memberName(user, lang)
  const links = memberLinks(user)

  return (
    <li className="member-card">
      <span className="member-avatar">
        {user.image ? (
          <StaticImage
            src={user.image}
            alt=""
            width={112}
            height={112}
            sizes="56px"
            preload={preload}
          />
        ) : (
          <span aria-hidden="true">{initials(name)}</span>
        )}
      </span>
      <div className="member-main">
        <p className="member-name">{name}</p>
        {links.length > 0 && (
          <ul className="member-links">
            {links.map(({ kind, href }) => (
              <li key={kind}>
                <a
                  href={href}
                  aria-label={`${copy[kind]} · ${name}`}
                  className="member-link"
                  {...(kind === 'email'
                    ? {}
                    : { target: '_blank', rel: 'noreferrer noopener' })}
                >
                  <LinkIcon kind={kind} />
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </li>
  )
}
