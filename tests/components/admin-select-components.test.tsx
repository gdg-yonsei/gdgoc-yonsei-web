import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import MembersSelectInput from '@/app/components/admin/member-select-input'
import SessionPartParticipantsInput from '@/app/components/admin/session-part-participants-input'

const membersWithGenerationFixture = [
  {
    id: 1,
    name: '11th',
    parts: [
      {
        id: 101,
        name: 'Frontend',
        usersToParts: [
          {
            user: {
              id: 'member-1',
              name: 'alice',
              firstNameKo: '앨리스',
              lastNameKo: '김',
              isForeigner: false,
            },
          },
          {
            user: {
              id: 'member-2',
              name: 'bob',
              firstNameKo: '밥',
              lastNameKo: '박',
              isForeigner: false,
            },
          },
        ],
      },
    ],
  },
]

const partGenerationFixture = [
  {
    id: 1,
    name: '11th',
    parts: [
      {
        id: 101,
        name: 'Frontend',
        usersToParts: [
          {
            user: {
              id: 'member-1',
              name: 'alice',
              firstName: 'Alice',
              lastName: 'Kim',
              firstNameKo: '앨리스',
              lastNameKo: '김',
              isForeigner: false,
            },
          },
        ],
      },
      {
        id: 102,
        name: 'Backend',
        usersToParts: [
          {
            user: {
              id: 'member-2',
              name: 'bob',
              firstName: 'Bob',
              lastName: 'Park',
              firstNameKo: '밥',
              lastNameKo: '박',
              isForeigner: false,
            },
          },
        ],
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
        membersList={membersWithGenerationFixture as never}
        defaultValue={['member-1']}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: 'Open' }))
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
        generationData={partGenerationFixture as never}
        membersData={membersFixture as never}
        defaultValue={{ partId: 101, selectedMembers: ['member-1'] }}
      />
    )

    fireEvent.click(screen.getAllByRole('button', { name: /11th Backend/i })[0])

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

    fireEvent.click(screen.getAllByRole('button', { name: /박밥/i })[0])
    await waitFor(() => {
      expect(JSON.parse(participantInput.value)).toEqual([])
    })
  })
})
