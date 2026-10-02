/**
 * 멤버 허브의 멤버 카드(서버 컴포넌트): 사진, 이름, 연락 링크.
 */
import EnvelopeIcon from '@heroicons/react/24/outline/EnvelopeIcon'
import type { Locale } from '@/lib/i18n'
import {
  GithubIcon,
  InstagramIcon,
  LinkedInIcon,
} from '@/app/components/site/social-icons'
import StaticImage from '@/app/components/site/static-image'
import type { MemberArchiveCopy } from '@/lib/contents/archive-copy'
import { initials } from '@/lib/format/text'
import {
  memberLinks,
  memberName,
  type MemberLinkKind,
  type MemberProfile,
} from '@/lib/site/members'

/** 연락 링크 종류별 아이콘. */
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

/**
 * 멤버 한 명. 이름이 바로 옆에 있으므로 사진은 장식으로 보고 대체 텍스트를 비운다.
 * 사진이 없으면 이름 머리글자를 보여 준다.
 * @param preload 첫 화면에 보이는 카드면 true(이미지 우선 로드)
 */
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
