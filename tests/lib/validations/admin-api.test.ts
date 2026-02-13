import { describe, expect, it } from 'vitest'
import {
  deleteResourceValidation,
  imageDeleteValidation,
  memberProfileImageUploadValidation,
  multipleImageUploadValidation,
  singleImageUploadValidation,
  updateMemberProfileImageValidation,
} from '@/lib/validations/admin-api'

describe('admin api validation schemas', () => {
  it('validates single image upload payload', () => {
    expect(
      singleImageUploadValidation.safeParse({
        fileName: 'profile.png',
        type: 'image/png',
      }).success
    ).toBe(true)

    expect(
      singleImageUploadValidation.safeParse({
        fileName: 'profile',
        type: 'image/png',
      }).success
    ).toBe(false)

    expect(
      singleImageUploadValidation.safeParse({
        fileName: 'profile.png',
        type: 'application/json',
      }).success
    ).toBe(false)

    expect(
      singleImageUploadValidation.safeParse({
        fileName: '../profile.png',
        type: 'image/png',
      }).success
    ).toBe(false)
  })

  it('validates multiple image upload payload', () => {
    expect(
      multipleImageUploadValidation.safeParse({
        images: [{ fileName: '1.jpg', type: 'image/jpeg' }],
      }).success
    ).toBe(true)

    expect(
      multipleImageUploadValidation.safeParse({
        images: [],
      }).success
    ).toBe(false)

    expect(
      multipleImageUploadValidation.safeParse({
        images: Array.from({ length: 21 }, (_, index) => ({
          fileName: `${index.toString()}.jpg`,
          type: 'image/jpeg',
        })),
      }).success
    ).toBe(false)
  })

  it('validates member profile image upload payload', () => {
    expect(
      memberProfileImageUploadValidation.safeParse({
        memberId: 'user-id',
        fileName: 'profile.webp',
        type: 'image/webp',
      }).success
    ).toBe(true)

    expect(
      memberProfileImageUploadValidation.safeParse({
        memberId: '',
        fileName: 'profile.webp',
        type: 'image/webp',
      }).success
    ).toBe(false)
  })

  it('validates image delete and profile update payload', () => {
    expect(imageDeleteValidation.safeParse({ imageUrl: 'path/to/file' }).success)
      .toBe(true)
    expect(imageDeleteValidation.safeParse({ imageUrl: '' }).success).toBe(
      false
    )

    expect(
      updateMemberProfileImageValidation.safeParse({
        profileImage: 'https://example.com/image.png',
      }).success
    ).toBe(true)
    expect(
      updateMemberProfileImageValidation.safeParse({
        profileImage: '',
      }).success
    ).toBe(false)
  })

  it('validates delete resource payload by resource type', () => {
    expect(
      deleteResourceValidation.safeParse({
        dataType: 'sessions',
        dataId: '4ef0a326-52ec-4da5-b204-9a67c7332a0f',
      }).success
    ).toBe(true)

    expect(
      deleteResourceValidation.safeParse({
        dataType: 'sessions',
        dataId: '123',
      }).success
    ).toBe(false)

    expect(
      deleteResourceValidation.safeParse({
        dataType: 'parts',
        dataId: '3',
      }).success
    ).toBe(true)

    expect(
      deleteResourceValidation.safeParse({
        dataType: 'parts',
        dataId: 'invalid',
      }).success
    ).toBe(false)
  })
})
