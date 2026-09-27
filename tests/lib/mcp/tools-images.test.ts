import { describe, expect, it, vi } from 'vitest'

const images = vi.hoisted(() => ({
  createImageUpload: vi.fn(async () => ({ ok: true, data: {} })),
  completeImageUpload: vi.fn(async () => ({ ok: true, data: {} })),
  importImageFromUrl: vi.fn(async () => ({ ok: true, data: {} })),
}))
vi.mock('@/db', () => ({ default: {} }))
vi.mock('@/lib/server/services/admin/images', () => ({
  ...images,
  MAX_IMAGE_UPLOAD_BYTES: 209_715_200,
  IMAGE_TARGETS: ['sessions', 'projects', 'users'],
}))

import type { ToolDefinition } from '@/lib/mcp/registry'
import { isToolVisible } from '@/lib/mcp/registry'
import { ALL_TOOLS } from '@/lib/mcp/tools'
import type { Actor } from '@/lib/server/services/admin/types'

const tool = (name: string) =>
  ALL_TOOLS.find((candidate) => candidate.name === name) as ToolDefinition

describe('image tools', () => {
  it('validates target and the 200MB size limit in the input schema', () => {
    const input = tool('create_image_upload').input
    expect(
      input.safeParse({ target: 'sessions', fileName: 'a.png', mimeType: 'image/png', sizeBytes: 209_715_200 }).success
    ).toBe(true)
    expect(
      input.safeParse({ target: 'sessions', fileName: 'a.png', mimeType: 'image/png', sizeBytes: 209_715_201 }).success
    ).toBe(false)
    expect(
      input.safeParse({ target: 'secrets', fileName: 'a.png', mimeType: 'image/png', sizeBytes: 1 }).success
    ).toBe(false)
  })

  it('import_image_from_url only accepts https URLs', () => {
    const input = tool('import_image_from_url').input
    expect(input.safeParse({ target: 'projects', url: 'https://example.com/a.png' }).success).toBe(true)
    expect(input.safeParse({ target: 'projects', url: 'file:///etc/passwd' }).success).toBe(false)
  })

  it('is visible to an alumnus (profile images) but not with a read-only token', () => {
    const alumnus: Actor = { userId: 'a', role: 'ALUMNUS', scopes: ['gyms:read', 'gyms:write'], via: 'mcp' }
    expect(isToolVisible(alumnus, tool('import_image_from_url'))).toBe(true)
    expect(isToolVisible({ ...alumnus, scopes: ['gyms:read'] }, tool('import_image_from_url'))).toBe(false)
  })

  it('passes the call to the image service', async () => {
    const actor: Actor = { userId: 'c', role: 'CORE', scopes: ['gyms:write'], via: 'mcp' }
    await tool('complete_image_upload').run(actor, { objectKey: 'sessions/a.png' })
    expect(images.completeImageUpload).toHaveBeenCalledWith(actor, { objectKey: 'sessions/a.png' })
  })
})
