import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import DataInput from '@/app/components/admin/data-input'

describe('DataInput readOnly', () => {
  it('keeps the value submittable but not editable', () => {
    render(
      <form data-testid={'form'}>
        <DataInput
          title={'Email'}
          name={'email'}
          placeholder={'Email'}
          defaultValue={'lead@example.com'}
          readOnly
        />
      </form>
    )
    const input = screen.getByRole('textbox', { name: 'Email' })
    expect(input).toHaveAttribute('readonly')
    expect(input).not.toBeDisabled()
    const data = new FormData(screen.getByTestId('form') as HTMLFormElement)
    expect(data.get('email')).toBe('lead@example.com')
  })
})
