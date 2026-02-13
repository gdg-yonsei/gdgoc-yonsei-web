import { describe, expect, it } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import DataInput from '@/app/components/admin/data-input'
import DataTextarea from '@/app/components/admin/data-textarea'
import DataSelectInput from '@/app/components/admin/data-select-input'
import DataSelectMultipleInput from '@/app/components/admin/data-select-multiple-input'

describe('admin form components', () => {
  it('renders DataInput with value and required state', () => {
    render(
      <DataInput
        defaultValue={'Alice'}
        name={'name'}
        placeholder={'Name'}
        title={'Name'}
        required={true}
      />
    )

    const input = screen.getByPlaceholderText('Name')
    expect(input).toHaveValue('Alice')
    expect(input).toBeRequired()
  })

  it('renders DataTextarea with default value', () => {
    render(
      <DataTextarea
        defaultValue={'Hello'}
        name={'description'}
        placeholder={'Description'}
      />
    )

    expect(screen.getByPlaceholderText('Description')).toHaveValue('Hello')
  })

  it('updates hidden input value in DataSelectInput on button click', async () => {
    const user = userEvent.setup()
    const { container } = render(
      <DataSelectInput
        data={[
          { name: 'Web', value: 'WEB' },
          { name: 'AI', value: 'AI' },
        ]}
        name={'part'}
        title={'Part'}
        defaultValue={'WEB'}
      />
    )

    const hiddenInput = container.querySelector('input[name="part"]')
    expect(hiddenInput).not.toBeNull()

    await waitFor(() => {
      expect(hiddenInput).toHaveValue('WEB')
    })

    await user.click(screen.getByRole('button', { name: 'AI' }))

    await waitFor(() => {
      expect(hiddenInput).toHaveValue('AI')
    })
  })

  it('updates hidden input json in DataSelectMultipleInput on toggles', async () => {
    const user = userEvent.setup()
    const { container } = render(
      <DataSelectMultipleInput
        data={[
          { name: 'A', value: 'A' },
          { name: 'B', value: 'B' },
        ]}
        name={'members'}
        title={'Members'}
        defaultValue={['A']}
      />
    )

    const hiddenInput = container.querySelector('input[name="members"]')
    expect(hiddenInput).not.toBeNull()

    await waitFor(() => {
      expect(hiddenInput).toHaveValue(JSON.stringify(['A']))
    })

    await user.click(screen.getByRole('button', { name: 'B' }))
    await waitFor(() => {
      expect(hiddenInput).toHaveValue(JSON.stringify(['A', 'B']))
    })

    await user.click(screen.getByRole('button', { name: 'A' }))
    await waitFor(() => {
      expect(hiddenInput).toHaveValue(JSON.stringify(['B']))
    })
  })
})
