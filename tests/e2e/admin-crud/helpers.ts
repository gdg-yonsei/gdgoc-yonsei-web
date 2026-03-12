import { expect, type Page } from '@playwright/test'

export function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export async function setHiddenInputValue(
  page: Page,
  name: string,
  value: string
) {
  await page.evaluate(
    ({ inputName, inputValue }) => {
      const input = document.querySelector(
        `input[name="${inputName}"]`
      ) as HTMLInputElement | null

      if (!input) {
        throw new Error(`Input not found: ${inputName}`)
      }

      input.value = inputValue
      input.dispatchEvent(new Event('input', { bubbles: true }))
      input.dispatchEvent(new Event('change', { bubbles: true }))
    },
    {
      inputName: name,
      inputValue: value,
    }
  )
}

export async function setAdminGenerationScope(
  page: Page,
  scopeName: string
) {
  const scopeSelect = page
    .locator(
      'select[aria-label="Current Scope"], select[aria-label="현재 범위"], select[aria-label="Generation"], select[aria-label="기수"]'
    )
    .first()

  await expect(scopeSelect).toBeVisible()
  await scopeSelect.selectOption({ label: scopeName })
}

export async function openDeleteModalAndConfirm(page: Page) {
  await page.getByRole('button', { name: 'Delete' }).click()
  await expect(
    page.getByText('Are you sure you want to delete this data?')
  ).toBeVisible()
  await page.getByRole('button', { name: 'Confirm' }).click()
}

export async function openDeleteModalAndCancel(page: Page) {
  await page.getByRole('button', { name: 'Delete' }).click()
  await expect(
    page.getByText('Are you sure you want to delete this data?')
  ).toBeVisible()
  await page.getByRole('button', { name: 'Cancel' }).click()
}
