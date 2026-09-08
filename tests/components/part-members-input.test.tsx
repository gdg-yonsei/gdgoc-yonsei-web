import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import PartMembersInput from '@/app/components/admin/part-members-input'

const members = [
  {
    id: 'alice',
    name: 'alice',
    firstName: 'Alice',
    lastName: 'Kim',
    firstNameKo: '앨리스',
    lastNameKo: '김',
    isForeigner: false,
    usersToParts: [
      {
        part: {
          id: 1,
          name: 'Frontend',
          generationsId: 1,
          generation: { id: 1, name: '1st' },
        },
      },
      {
        part: {
          id: 2,
          name: 'Backend',
          generationsId: 2,
          generation: { id: 2, name: '2nd' },
        },
      },
    ],
  },
  {
    id: 'bob',
    name: 'bob',
    firstName: 'Bob',
    lastName: 'Park',
    firstNameKo: '밥',
    lastNameKo: '박',
    isForeigner: false,
    usersToParts: [],
  },
]

function setup(defaultValue: string[] = []) {
  return render(
    <PartMembersInput
      members={members}
      title="Members"
      name="membersList"
      defaultValue={defaultValue}
    />
  )
}

describe('part member filters', () => {
  it('hides candidates initially and retains selections when filters change', () => {
    const { container } = setup(['bob'])
    expect(
      screen.queryByRole('button', { name: /Alice/ })
    ).not.toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /Park Bob Remove/ })
    ).toBeVisible()
    fireEvent.change(screen.getByLabelText('Search name'), {
      target: { value: '김 앨리스' },
    })
    fireEvent.click(screen.getByRole('button', { name: /Kim Alice/ }))
    fireEvent.change(screen.getByLabelText('Search name'), {
      target: { value: 'missing' },
    })
    expect(
      screen.getByRole('button', { name: /Kim Alice Remove/ })
    ).toBeVisible()
    expect(screen.getByText('No matching members.')).toBeVisible()
    expect(container.querySelector('input[name="membersList"]')).toHaveValue(
      '["bob","alice"]'
    )
    fireEvent.click(screen.getByRole('button', { name: /Park Bob Remove/ }))
    expect(container.querySelector('input[name="membersList"]')).toHaveValue(
      '["alice"]'
    )
  })

  it('matches English names and any membership without duplicate candidates', () => {
    setup()
    fireEvent.change(screen.getByLabelText('Search name'), {
      target: { value: 'ALICE' },
    })
    expect(screen.getAllByRole('button', { name: /Kim Alice/ })).toHaveLength(1)
    fireEvent.change(screen.getByLabelText('Generation filter'), {
      target: { value: '1' },
    })
    fireEvent.change(screen.getByLabelText('Part filter'), {
      target: { value: '1' },
    })
    expect(screen.getByRole('button', { name: /Kim Alice/ })).toBeVisible()
    expect(
      screen.queryByRole('option', { name: 'Backend' })
    ).not.toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Generation filter'), {
      target: { value: '2' },
    })
    expect(screen.getByLabelText('Part filter')).toHaveValue('')
    fireEvent.change(screen.getByLabelText('Part filter'), {
      target: { value: '2' },
    })
    expect(screen.getByRole('button', { name: /Kim Alice/ })).toBeVisible()
  })

  it('finds unassigned members and hides candidates again when filters clear', () => {
    setup()
    fireEvent.change(screen.getByLabelText('Generation filter'), {
      target: { value: 'none' },
    })
    expect(screen.getByRole('button', { name: /Park Bob/ })).toBeVisible()
    expect(
      screen.queryByRole('button', { name: /Alice/ })
    ).not.toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Generation filter'), {
      target: { value: '' },
    })
    expect(
      screen.queryByRole('button', { name: /Bob/ })
    ).not.toBeInTheDocument()
  })
})
