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

  it('uploads a replacement without deleting the saved image before form submission', async () => {
    vi.mocked(fetch)
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
      expect(fetch).toHaveBeenCalledTimes(2)
    })

    expect(fetch).toHaveBeenNthCalledWith(
      1,
      '/api/admin/projects/main-image',
      expect.objectContaining({
        method: 'POST',
      })
    )
    expect(fetch).toHaveBeenNthCalledWith(
      2,
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

    const deleteButtons = screen.getAllByRole('button', { name: 'Delete' })
    fireEvent.click(deleteButtons[0]!)

    await waitFor(() => {
      expect(JSON.parse(hiddenInput.value)).toEqual([
        'https://cdn.example/projects/content-2.png',
      ])
    })
  })

  // 업로드 API의 403/400 응답이 URL로 제출되어 DB에 저장되지 않게 한다.

  it('keeps the previous value and reports failure when the single upload API rejects', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      })
    )

    const { container } = render(
      <DataImageInput
        name="mainImage"
        title="Main Image"
        defaultValue="https://cdn.example/projects/saved.png"
        baseUrl="/api/admin/projects/main-image"
      >
        Upload main image
      </DataImageInput>
    )

    const fileInput = container.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement
    await userEvent.upload(
      fileInput,
      new File(['img-data'], 'main.png', { type: 'image/png' }),
      { applyAccept: false }
    )

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })

    const hiddenInput = container.querySelector(
      'input[name="mainImage"]'
    ) as HTMLInputElement
    expect(hiddenInput.value).toBe('https://cdn.example/projects/saved.png')
    expect(screen.getByRole('img')).toHaveAttribute('src', hiddenInput.value)
    expect(hiddenInput.value).not.toContain('undefined')

    expect(fetch).toHaveBeenCalledTimes(1)

    expect(
      screen.getByRole('button', { name: 'Upload main image' })
    ).toBeEnabled()
  })

  it('rolls back previews and reports failure when the multiple upload API rejects', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      })
    )

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
    await userEvent.upload(
      fileInput,
      [
        new File(['image-1'], 'content-1.png', { type: 'image/png' }),
        new File(['image-2'], 'content-2.png', { type: 'image/png' }),
      ],
      { applyAccept: false }
    )

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })

    const hiddenInput = container.querySelector(
      'input[name="images"]'
    ) as HTMLInputElement
    expect(JSON.parse(hiddenInput.value)).toEqual([])

    expect(screen.queryAllByRole('button', { name: 'Delete' })).toHaveLength(0)
  })
  it.each([true, false])(
    'keeps deletion aligned when a pending batch succeeds=%s',
    async (succeeds) => {
      let finishUpload!: (response: Response) => void
      vi.mocked(fetch)
        .mockImplementationOnce(
          () =>
            new Promise<Response>((resolve) => {
              finishUpload = resolve
            })
        )
        .mockResolvedValue(new Response(null, { status: 200 }))

      const saved = 'https://cdn.example/projects/saved.png'
      const { container } = render(
        <DataMultipleImageInput
          name="images"
          title="Images"
          baseUrl="/upload"
          defaultValue={[saved]}
        >
          Upload images
        </DataMultipleImageInput>
      )
      await userEvent.upload(
        container.querySelector<HTMLInputElement>('input[type="file"]')!,
        [
          new File(['one'], 'one.png', { type: 'image/png' }),
          new File(['two'], 'two.png', { type: 'image/png' }),
        ]
      )
      await waitFor(() =>
        expect(screen.getAllByRole('button', { name: 'Delete' })).toHaveLength(
          3
        )
      )

      fireEvent.click(screen.getAllByRole('button', { name: 'Delete' })[1]!)
      finishUpload(
        new Response(
          JSON.stringify(
            succeeds
              ? {
                  uploadUrls: [
                    {
                      fileName: 'projects/one.png',
                      uploadUrl: 'https://upload.example/one',
                    },
                    {
                      fileName: 'projects/two.png',
                      uploadUrl: 'https://upload.example/two',
                    },
                  ],
                }
              : { error: 'Forbidden' }
          ),
          { status: succeeds ? 200 : 403 }
        )
      )

      await waitFor(() =>
        expect(
          screen.getByRole('button', { name: 'Upload images' })
        ).toBeEnabled()
      )
      expect(
        JSON.parse(
          container.querySelector<HTMLInputElement>('input[name="images"]')!
            .value
        )
      ).toEqual(
        succeeds ? [saved, 'https://cdn.example/projects/two.png'] : [saved]
      )
      expect(screen.getAllByRole('img')).toHaveLength(succeeds ? 2 : 1)
    }
  )
})
