import { atom } from 'jotai'

export const isAuthenticatingState = atom(false)

export const userProfileImageState = atom<string | null>(null)

export const menuBarState = atom(false)
