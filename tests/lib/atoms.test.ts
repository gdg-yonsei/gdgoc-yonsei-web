import { describe, expect, it } from 'vitest'
import { createStore } from 'jotai'
import {
  homeMenuBarState,
  isAuthenticatingState,
  isLoadingState,
  menuBarState,
  modalState,
  uploadMultipleImagesState,
  uploadProfileImageState,
  uploadSingleImageState,
} from '@/lib/atoms'

describe('shared jotai atoms', () => {
  it('initializes primitive atoms with expected defaults', () => {
    const store = createStore()

    expect(store.get(isAuthenticatingState)).toBe(false)
    expect(store.get(menuBarState)).toBe(false)
    expect(store.get(homeMenuBarState)).toBe(false)
    expect(store.get(uploadSingleImageState)).toBe(false)
    expect(store.get(uploadMultipleImagesState)).toBe(false)
    expect(store.get(uploadProfileImageState)).toBe(false)
  })

  it('tracks derived loading state from upload atoms', () => {
    const store = createStore()

    expect(store.get(isLoadingState)).toBe(false)

    store.set(uploadSingleImageState, true)
    expect(store.get(isLoadingState)).toBe(true)

    store.set(uploadSingleImageState, false)
    store.set(uploadMultipleImagesState, true)
    expect(store.get(isLoadingState)).toBe(true)

    store.set(uploadMultipleImagesState, false)
    store.set(uploadProfileImageState, true)
    expect(store.get(isLoadingState)).toBe(true)

    store.set(uploadProfileImageState, false)
    expect(store.get(isLoadingState)).toBe(false)
  })

  it('updates modal payload and action', () => {
    const store = createStore()
    const defaultModal = store.get(modalState)

    expect(defaultModal.text).toBe('')
    expect(typeof defaultModal.action).toBe('function')

    const action = () => 'done'
    store.set(modalState, { text: 'Delete data?', action })

    const nextModal = store.get(modalState)
    expect(nextModal.text).toBe('Delete data?')
    expect(nextModal.action).toBe(action)
    expect(nextModal.action()).toBe('done')
  })
})
