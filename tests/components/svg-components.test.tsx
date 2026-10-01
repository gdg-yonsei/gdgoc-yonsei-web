import { ComponentType, SVGProps } from 'react'
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import GDGLogo from '@/app/components/svg/gdg-logo'
import GDGoCYonseiLogo from '@/app/components/svg/gdgoc-yonsei-logo'
import Github from '@/app/components/svg/github'
import Google from '@/app/components/svg/google'

type SvgComponent = ComponentType<SVGProps<SVGSVGElement>>

const svgComponents: Array<[string, SvgComponent]> = [
  ['Github', Github],
  ['Google', Google],
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
