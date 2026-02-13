import { ComponentType } from 'react'
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import ActivityCardCloseSvg from '@/app/components/svg/activity-card-close-svg'
import ActivityCardLeftSvg from '@/app/components/svg/activity-card-left-svg'
import ActivityCardRightSvg from '@/app/components/svg/activity-card-right-svg'
import BookSVG from '@/app/components/svg/book-svg'
import FriendsTree from '@/app/components/svg/friends-tree'
import Friends from '@/app/components/svg/friends'
import GDGLogo from '@/app/components/svg/gdg-logo'
import GDGoCYonseiLogo from '@/app/components/svg/gdgoc-yonsei-logo'
import Github from '@/app/components/svg/github'
import Google from '@/app/components/svg/google'
import InstagramWhiteBg from '@/app/components/svg/instagram-white-bg'
import Instagram from '@/app/components/svg/instagram'
import LinkedIn from '@/app/components/svg/linked-in'
import Mail from '@/app/components/svg/mail'
import Trophy from '@/app/components/svg/trophy'

type SvgComponent = ComponentType<any>

const svgComponents: Array<[string, SvgComponent]> = [
  ['ActivityCardCloseSvg', ActivityCardCloseSvg],
  ['ActivityCardLeftSvg', ActivityCardLeftSvg],
  ['ActivityCardRightSvg', ActivityCardRightSvg],
  ['BookSVG', BookSVG],
  ['FriendsTree', FriendsTree],
  ['Friends', Friends],
  ['Github', Github],
  ['Google', Google],
  ['InstagramWhiteBg', InstagramWhiteBg],
  ['Instagram', Instagram],
  ['LinkedIn', LinkedIn],
  ['Mail', Mail],
  ['Trophy', Trophy],
]

describe('svg components', () => {
  it.each(svgComponents)('renders %s without crashing', (_name, Component) => {
    const { container } = render(<Component className="icon" />)

    expect(container.querySelector('svg')).toBeInTheDocument()
  })

  it('renders GDGLogo with generated ids from svgKey', () => {
    const { container } = render(<GDGLogo svgKey="logo" />)

    expect(container.querySelector('#logo__a')).toBeInTheDocument()
    expect(container.querySelector('#logo__b')).toBeInTheDocument()
    expect(container.querySelector('#logo__c')).toBeInTheDocument()
    expect(container.querySelector('#logo__d')).toBeInTheDocument()
  })

  it('renders GDGoCYonseiLogo text with logo', () => {
    const { container } = render(<GDGoCYonseiLogo className="w-full" />)

    expect(container.querySelector('svg')).toBeInTheDocument()
    expect(screen.getByText('Google Developer Group')).toBeInTheDocument()
    expect(screen.getByText('Yonsei University')).toBeInTheDocument()
  })
})
