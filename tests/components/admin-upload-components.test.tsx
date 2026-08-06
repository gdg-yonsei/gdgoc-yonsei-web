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

    // 삭제 버튼은 접근 가능한 이름으로 찾습니다. 이전에는 Tailwind 클래스
    // (`bg-red-500`)로 찾고 있어 색만 바꿔도 테스트가 깨졌습니다.
    const deleteButtons = screen.getAllByRole('button', { name: 'Delete' })
    fireEvent.click(deleteButtons[0]!)

    await waitFor(() => {
      expect(JSON.parse(hiddenInput.value)).toEqual([
        'https://cdn.example/projects/content-2.png',
      ])
    })
  })

  // 아래 두 테스트는 업로드 API 가 정상적인 에러 응답(403/400)을 돌려줬을 때
  // 그것이 성공으로 취급되던 버그를 막는다. 예전 구현은 response.ok 를 보지 않아
  // `undefined` 가 섞인 URL 을 히든 필드에 넣었고, 그대로 폼이 전송돼 DB 에 저장됐다.
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
    expect(hiddenInput.value).toBe('')
    expect(hiddenInput.value).not.toContain('undefined')

    // 사전 서명 URL 발급이 실패했으므로 스토리지로의 PUT 은 시도조차 하지 않는다.
    expect(fetch).toHaveBeenCalledTimes(1)

    // 로딩 상태가 풀려 다시 시도할 수 있어야 한다.
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

    // 저장되지 않은 이미지가 저장된 것처럼 남아 있으면 안 된다.
    expect(screen.queryAllByRole('button', { name: 'Delete' })).toHaveLength(0)
  })
})
