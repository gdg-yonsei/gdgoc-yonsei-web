import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import MembersSelectInput from '@/app/components/admin/member-select-input'
import SessionPartParticipantsInput from '@/app/components/admin/session-part-participants-input'

const memberOptionsFixture = [
  {
    id: 'member-1',
    name: 'alice',
    firstName: 'Alice',
    lastName: 'Kim',
    firstNameKo: '앨리스',
    lastNameKo: '김',
    isForeigner: false,
    part: 'Frontend',
  },
  {
    id: 'member-2',
    name: 'bob',
    firstName: 'Bob',
    lastName: 'Park',
    firstNameKo: '밥',
    lastNameKo: '박',
    isForeigner: false,
    part: 'Backend',
  },
]

const scopedPartFixture = [
  {
    id: 101,
    name: 'Frontend',
    generationName: '11th',
    members: [
      {
        id: 'member-1',
        name: 'alice',
        firstName: 'Alice',
        lastName: 'Kim',
        firstNameKo: '앨리스',
        lastNameKo: '김',
        isForeigner: false,
      },
    ],
  },
  {
    id: 102,
    name: 'Backend',
    generationName: '11th',
    members: [
      {
        id: 'member-2',
        name: 'bob',
        firstName: 'Bob',
        lastName: 'Park',
        firstNameKo: '밥',
        lastNameKo: '박',
        isForeigner: false,
      },
    ],
  },
]

const membersFixture = [
  {
    id: 'member-1',
    name: 'alice',
    firstName: 'Alice',
    lastName: 'Kim',
    firstNameKo: '앨리스',
    lastNameKo: '김',
    generation: '11th',
    part: 'Frontend',
    isForeigner: false,
  },
  {
    id: 'member-2',
    name: 'bob',
    firstName: 'Bob',
    lastName: 'Park',
    firstNameKo: '밥',
    lastNameKo: '박',
    generation: '11th',
    part: 'Backend',
    isForeigner: false,
  },
]

describe('admin selection components', () => {
  it('opens generation list and toggles participants in MembersSelectInput', async () => {
    const { container } = render(
      <MembersSelectInput
        members={memberOptionsFixture as never}
        defaultValue={['member-1']}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /김앨리스/i }))

    const hiddenInput = container.querySelector(
      'input[name="participants"]'
    ) as HTMLInputElement

    await waitFor(() => {
      expect(JSON.parse(hiddenInput.value)).toEqual([])
    })

    fireEvent.click(screen.getByRole('button', { name: /박밥/i }))
    await waitFor(() => {
      expect(JSON.parse(hiddenInput.value)).toEqual(['member-2'])
    })
  })

  it('keeps part and participant hidden fields in sync in SessionPartParticipantsInput', async () => {
    const { container } = render(
      <SessionPartParticipantsInput
        parts={scopedPartFixture as never}
        members={membersFixture as never}
        defaultValue={{ partId: 101, selectedMembers: ['member-1'] }}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /Backend 11th/i }))

    const partIdInput = container.querySelector(
      'input[name="partId"]'
    ) as HTMLInputElement
    const participantInput = container.querySelector(
      'input[name="participantId"]'
    ) as HTMLInputElement

    await waitFor(() => {
      expect(partIdInput.value).toBe('102')
      expect(JSON.parse(participantInput.value)).toEqual(['member-2'])
    })

    fireEvent.click(screen.getAllByRole('button', { name: /박밥/i })[0]!)
    await waitFor(() => {
      expect(JSON.parse(participantInput.value)).toEqual([])
    })
  })
})
