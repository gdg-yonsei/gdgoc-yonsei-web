import { expect, it } from 'vitest'
import { detectImageType } from '@/lib/server/uploads/image-signature'

const bytes = (...values: number[]) => new Uint8Array(values)
const ascii = (text: string) => [...Buffer.from(text)]

it.each([
  ['jpeg', bytes(0xff, 0xd8, 0xff, 0xe0), 'jpeg'],
  ['png', bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a), 'png'],
  [
    'webp',
    new Uint8Array([...ascii('RIFF'), 0, 0, 0, 0, ...ascii('WEBP')]),
    'webp',
  ],
  ['gif', new Uint8Array(ascii('GIF89a')), 'gif'],
  ['avif', new Uint8Array([0, 0, 0, 0x1c, ...ascii('ftypavif')]), 'avif'],
  ['svg', new Uint8Array(ascii('<svg xmlns=')), null],
  ['pdf', bytes(0x25, 0x50, 0x44, 0x46), null],
  ['empty', new Uint8Array(), null],
])('%s', (_label, input, expected) => {
  expect(detectImageType(input)).toBe(expected)
})
