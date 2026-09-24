import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import TagsInput from '@/app/components/admin/tags-input'

function hiddenTags(container: HTMLElement): string[] {
  const input = container.querySelector<HTMLInputElement>('input[name="tags"]')
  return JSON.parse(input?.value ?? 'null') as string[]
}

const field = () => screen.getByRole('combobox', { name: 'Tech stack' })

describe('TagsInput', () => {
  it('adds tags on Enter and comma and skips case-insensitive duplicates', async () => {
    const user = userEvent.setup()
    const { container } = render(
      <TagsInput defaultValue={[]} suggestions={[]} />
    )

    await user.type(field(), 'Next.js{Enter}firebase,next.js{Enter}')

    expect(hiddenTags(container)).toEqual(['Next.js', 'firebase'])
    expect(
      screen.getByRole('button', { name: 'Remove tag Next.js' })
    ).toBeInTheDocument()
  })

  it('splits a pasted list', async () => {
    const user = userEvent.setup()
    const { container } = render(
      <TagsInput defaultValue={['Go']} suggestions={[]} />
    )

    await user.click(field())
    await user.paste('Rust, Zig,,go')

    expect(hiddenTags(container)).toEqual(['Go', 'Rust', 'Zig'])
  })

  it('removes the last tag with Backspace on an empty field, or any tag by its button', async () => {
    const user = userEvent.setup()
    const { container } = render(
      <TagsInput defaultValue={['Go', 'Rust', 'Zig']} suggestions={[]} />
    )

    await user.click(field())
    await user.keyboard('{Backspace}')
    expect(hiddenTags(container)).toEqual(['Go', 'Rust'])

    await user.click(screen.getByRole('button', { name: 'Remove tag Go' }))
    expect(hiddenTags(container)).toEqual(['Rust'])
  })

  it('keeps a typed tag when the field loses focus', async () => {
    const user = userEvent.setup()
    const { container } = render(
      <TagsInput defaultValue={[]} suggestions={[]} />
    )

    await user.type(field(), 'Svelte')
    await user.tab()

    expect(hiddenTags(container)).toEqual(['Svelte'])
  })

  it('stops at 12 tags and says so', () => {
    const twelve = Array.from({ length: 12 }, (_, index) => `tag-${index}`)
    const { container } = render(
      <TagsInput defaultValue={twelve} suggestions={[]} />
    )

    expect(field()).toBeDisabled()
    expect(screen.getByText('Tag limit reached (12).')).toBeInTheDocument()
    expect(hiddenTags(container)).toHaveLength(12)
  })

  it('suggests existing tags that are not chosen yet', () => {
    const { container } = render(
      <TagsInput defaultValue={['Go']} suggestions={['go', 'Kotlin']} />
    )

    expect(
      [...container.querySelectorAll('datalist option')].map((option) =>
        option.getAttribute('value')
      )
    ).toEqual(['Kotlin'])
  })
})
