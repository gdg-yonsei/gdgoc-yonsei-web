import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import DataImageInput from '@/app/components/admin/data-image-input'
import DataMultipleImageInput from '@/app/components/admin/data-multiple-image-input'

describe('admin upload components', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.NEXT_PUBLIC_IMAGE_URL = 'https://cdn.example/'
    vi.stubGlobal('fetch', vi.fn())
  })

  it('uploads a single image, deletes previous hosted image, and stores uploaded url', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(new Response(null, { status: 200 }))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            uploadUrl: 'https://upload.example/signed-url',
            fileName: 'projects/new-main-image.png',
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      )
      .mockResolvedValueOnce(new Response(null, { status: 200 }))

    const { container } = render(
      <DataImageInput
        name="mainImage"
        title="Main Image"
        baseUrl="/api/admin/projects/main-image"
        defaultValue="https://cdn.example/projects/previous.png"
      >
        Upload main image
      </DataImageInput>
    )

    const fileInput = container.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement
    const file = new File(['img-data'], 'new-main-image.png', {
      type: 'image/png',
    })
    await userEvent.upload(fileInput, file, { applyAccept: false })

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(3)
    })

    expect(fetch).toHaveBeenNthCalledWith(
      1,
      '/api/admin/projects/main-image',
      expect.objectContaining({
        method: 'DELETE',
      })
    )
    expect(fetch).toHaveBeenNthCalledWith(
      2,
      '/api/admin/projects/main-image',
      expect.objectContaining({
        method: 'POST',
      })
    )
    expect(fetch).toHaveBeenNthCalledWith(
      3,
      'https://upload.example/signed-url',
      expect.objectContaining({
        method: 'PUT',
        body: file,
      })
    )

    const hiddenInput = container.querySelector(
      'input[name="mainImage"]'
    ) as HTMLInputElement

    await waitFor(() => {
      expect(hiddenInput.value).toBe(
        'https://cdn.example/projects/new-main-image.png'
      )
    })
  })

  it('uploads multiple images and allows deleting selected preview/image url', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            uploadUrls: [
              {
                fileName: 'projects/content-1.png',
                uploadUrl: 'https://upload.example/content-1',
              },
              {
                fileName: 'projects/content-2.png',
                uploadUrl: 'https://upload.example/content-2',
              },
            ],
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      )
      .mockResolvedValueOnce(new Response(null, { status: 200 }))
      .mockResolvedValueOnce(new Response(null, { status: 200 }))

    const { container } = render(
      <DataMultipleImageInput
        name="images"
        title="Content Images"
        baseUrl="/api/admin/projects/content-image"
        defaultValue={[]}
      >
        Upload content images
      </DataMultipleImageInput>
    )

    const fileInput = container.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement
    const file1 = new File(['image-1'], 'content-1.png', { type: 'image/png' })
    const file2 = new File(['image-2'], 'content-2.png', { type: 'image/png' })

    await userEvent.upload(fileInput, [file1, file2], { applyAccept: false })

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(3)
    })

    const hiddenInput = container.querySelector(
      'input[name="images"]'
    ) as HTMLInputElement
    await waitFor(() => {
      expect(JSON.parse(hiddenInput.value)).toEqual([
        'https://cdn.example/projects/content-1.png',
        'https://cdn.example/projects/content-2.png',
      ])
    })

    const deleteButtons = screen
      .getAllByRole('button')
      .filter((button) => button.className.includes('bg-red-500'))
    fireEvent.click(deleteButtons[0]!)

    await waitFor(() => {
      expect(JSON.parse(hiddenInput.value)).toEqual([
        'https://cdn.example/projects/content-2.png',
      ])
    })
  })
})
