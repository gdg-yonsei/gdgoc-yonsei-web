import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import DataForm from '@/app/components/admin/data-form'
import { sessionValidation } from '@/lib/validations/session'

describe('DataForm input preservation', () => {
  it.each(['create', 'edit'] as const)(
    'preserves %s form values after capacity validation fails and allows retry',
    async (mode) => {
      const submissions: FormData[] = []
      async function action(_state: { error: string }, formData: FormData) {
        submissions.push(formData)
        const result = sessionValidation.shape.maxCapacity.safeParse(
          Number(formData.get('maxCapacity'))
        )
        return {
          error: result.success
            ? 'Another validation error'
            : (result.error.issues[0]?.message ?? 'Invalid capacity'),
        }
      }
      const user = userEvent.setup()
      render(
        <DataForm action={action}>
          <input
            aria-label="English name"
            name="name"
            defaultValue={mode === 'edit' ? 'Original name' : ''}
          />
          <input aria-label="Korean name" name="nameKo" />
          <textarea aria-label="Description" name="description" />
          <textarea aria-label="Korean description" name="descriptionKo" />
          <select
            aria-label="Category"
            name="category"
            defaultValue="tech_talk"
          >
            <option value="tech_talk">Tech talk</option>
            <option value="hackathon">Hackathon</option>
          </select>
          <input aria-label="Public" name="publicOpen" type="checkbox" />
          <input aria-label="Start" name="startAt" type="datetime-local" />
          <input
            aria-label="Capacity"
            name="maxCapacity"
            type="number"
            defaultValue={0}
          />
          <button type="submit">Submit</button>
        </DataForm>
      )

      const name = screen.getByRole('textbox', { name: 'English name' })
      await user.clear(name)
      await user.type(name, 'New session')
      await user.type(screen.getByLabelText('Korean name'), '새 세션')
      await user.type(
        screen.getByLabelText('Description'),
        'Session description'
      )
      await user.type(screen.getByLabelText('Korean description'), '세션 설명')
      await user.selectOptions(screen.getByLabelText('Category'), 'hackathon')
      await user.click(screen.getByRole('checkbox', { name: 'Public' }))
      await user.type(screen.getByLabelText('Start'), '2027-03-20T10:00')
      await user.click(screen.getByRole('button', { name: 'Submit' }))

      expect(await screen.findByText(/Too small/)).toBeVisible()
      expect(name).toHaveValue('New session')
      expect(screen.getByLabelText('Korean name')).toHaveValue('새 세션')
      expect(screen.getByLabelText('Description')).toHaveValue(
        'Session description'
      )
      expect(screen.getByLabelText('Korean description')).toHaveValue(
        '세션 설명'
      )
      expect(screen.getByLabelText('Category')).toHaveValue('hackathon')
      expect(screen.getByRole('checkbox', { name: 'Public' })).toBeChecked()
      expect(screen.getByLabelText('Start')).toHaveValue('2027-03-20T10:00')

      await user.clear(screen.getByRole('spinbutton', { name: 'Capacity' }))
      await user.type(
        screen.getByRole('spinbutton', { name: 'Capacity' }),
        '20'
      )
      await user.click(screen.getByRole('button', { name: 'Submit' }))

      expect(await screen.findByText('Another validation error')).toBeVisible()
      expect(submissions).toHaveLength(2)
      expect(submissions[1]?.get('name')).toBe('New session')
      expect(submissions[1]?.get('descriptionKo')).toBe('세션 설명')
      expect(submissions[1]?.get('maxCapacity')).toBe('20')
      expect(name).toHaveValue('New session')
    }
  )
})
