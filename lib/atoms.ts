import { atom } from 'jotai'

/**
 * 로그인 진행중인지 저장하는 상태
 */
export const isAuthenticatingState = atom(false)

/**
 * 메뉴바가 열려있는지 저장하는 상태
 */
export const menuBarState = atom(false)

/**
 * 로딩중인지 저장하는 상태
 */
export const isLoadingState = atom(false)
