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
    memberships: [{ generationId: 11, generation: '11th', part: 'Frontend' }],
    isForeigner: false,
  },
  {
    id: 'member-2',
    name: 'bob',
    firstName: 'Bob',
    lastName: 'Park',
    firstNameKo: '밥',
    lastNameKo: '박',
    memberships: [
      { generationId: 11, generation: '11th', part: 'Backend' },
      { generationId: 10, generation: '10th', part: 'AI' },
    ],
    isForeigner: false,
  },
  {
    id: 'member-3',
    name: 'carol',
    firstName: 'Carol',
    lastName: 'Lee',
    firstNameKo: '캐럴',
    lastNameKo: '이',
    memberships: [{ generationId: 10, generation: '10th', part: 'AI' }],
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

  it('filters participants by name and part and selects every shown member', async () => {
    const { container } = render(
      <SessionPartParticipantsInput
        parts={scopedPartFixture as never}
        members={membersFixture as never}
        defaultValue={{ partId: 101, selectedMembers: [] }}
      />
    )

    const participantInput = container.querySelector(
      'input[name="participantId"]'
    ) as HTMLInputElement
    const search = screen.getByRole('searchbox', {
      name: 'Search by name...',
    })

    // 공백을 섞어 입력해도 한글 이름을 찾습니다.
    fireEvent.change(search, { target: { value: '박 밥' } })
    expect(screen.queryByTitle('김앨리스')).toBeNull()
    expect(screen.getByTitle('박밥')).toBeTruthy()

    fireEvent.click(
      screen.getByRole('button', { name: 'Select all shown (1)' })
    )
    await waitFor(() => {
      expect(JSON.parse(participantInput.value)).toEqual(['member-2'])
    })

    fireEvent.change(search, { target: { value: '' } })
    fireEvent.change(screen.getByRole('combobox', { name: 'Part' }), {
      target: { value: 'Frontend' },
    })
    expect(screen.queryByTitle('박밥')).toBeNull()

    fireEvent.click(
      screen.getByRole('button', { name: 'Select all shown (1)' })
    )
    await waitFor(() => {
      expect(JSON.parse(participantInput.value)).toEqual([
        'member-2',
        'member-1',
      ])
    })

    // 표시된 멤버가 모두 선택되어 있으면 같은 버튼이 선택 해제로 바뀌고,
    // 필터 밖의 선택은 유지됩니다.
    fireEvent.click(
      screen.getByRole('button', { name: 'Deselect all shown (1)' })
    )
    await waitFor(() => {
      expect(JSON.parse(participantInput.value)).toEqual(['member-2'])
    })

    fireEvent.change(search, { target: { value: 'nobody' } })
    expect(screen.getByText('No results')).toBeTruthy()
    expect(
      (
        screen.getByRole('button', {
          name: 'Select all shown (0)',
        }) as HTMLButtonElement
      ).disabled
    ).toBe(true)
  })

  it('filters participants by generation and narrows parts to that generation', async () => {
    const { container } = render(
      <SessionPartParticipantsInput
        parts={scopedPartFixture as never}
        members={membersFixture as never}
        defaultValue={{ partId: 101, selectedMembers: [] }}
      />
    )

    const participantInput = container.querySelector(
      'input[name="participantId"]'
    ) as HTMLInputElement
    const generationSelect = screen.getByRole('combobox', {
      name: 'Generation',
    }) as HTMLSelectElement
    const partSelect = screen.getByRole('combobox', {
      name: 'Part',
    }) as HTMLSelectElement

    // 최신 기수가 먼저 나옵니다.
    expect(
      Array.from(generationSelect.options).map((option) => option.value)
    ).toEqual(['', '11th', '10th'])

    fireEvent.change(generationSelect, { target: { value: '10th' } })
    expect(screen.queryByTitle('김앨리스')).toBeNull()
    expect(screen.getByTitle('박밥').textContent).toContain('10th · AI')
    expect(screen.getByTitle('이캐럴')).toBeTruthy()
    expect(
      Array.from(partSelect.options).map((option) => option.value)
    ).toEqual(['', 'AI'])

    fireEvent.click(
      screen.getByRole('button', { name: 'Select all shown (2)' })
    )
    await waitFor(() => {
      expect(JSON.parse(participantInput.value)).toEqual([
        'member-2',
        'member-3',
      ])
    })

    // 새 기수에 없는 파트 필터는 초기화됩니다.
    fireEvent.change(partSelect, { target: { value: 'AI' } })
    fireEvent.change(generationSelect, { target: { value: '11th' } })
    expect(partSelect.value).toBe('')
    expect(screen.queryByTitle('이캐럴')).toBeNull()
    expect(screen.getByTitle('박밥').textContent).toContain('11th · Backend')
  })
})
