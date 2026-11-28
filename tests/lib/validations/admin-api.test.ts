import { describe, expect, it } from 'vitest'
import {
  deleteResourceValidation,
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
        size: 1024,
      }).success
    ).toBe(true)

    expect(
      singleImageUploadValidation.safeParse({
        fileName: 'profile',
        type: 'image/png',
        size: 1024,
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
        size: 1024,
      }).success
    ).toBe(false)
  })

  it('requires a whole-byte size within the upload limit', () => {
    const withSize = (size: unknown) =>
      singleImageUploadValidation.safeParse({
        fileName: 'profile.png',
        type: 'image/png',
        size,
      }).success

    expect(withSize(1)).toBe(true)
    expect(withSize(209_715_200)).toBe(true)
    expect(withSize(undefined)).toBe(false)
    expect(withSize(0)).toBe(false)
    expect(withSize(1.5)).toBe(false)
    expect(withSize('1024')).toBe(false)
    expect(withSize(209_715_201)).toBe(false)
  })

  it('validates multiple image upload payload', () => {
    expect(
      multipleImageUploadValidation.safeParse({
        images: [{ fileName: '1.jpg', type: 'image/jpeg', size: 1024 }],
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
          size: 1024,
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
        size: 1024,
      }).success
    ).toBe(true)

    expect(
      memberProfileImageUploadValidation.safeParse({
        memberId: '',
        fileName: 'profile.webp',
        type: 'image/webp',
        size: 1024,
      }).success
    ).toBe(false)
  })

  it('validates profile image update payload', () => {
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
