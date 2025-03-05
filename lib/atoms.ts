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
 * Global Loading State
 *
 * POST, PUT 을 할 수 없는 상태를 나타냄 (ex. 이미지 업로드 중)
 */
export const isLoadingState = atom(
  (get) =>
    get(uploadSingleImageState) ||
    get(uploadMultipleImagesState) ||
    get(uploadProfileImageState)
)

/**
 * 개별 이미지를 업로드 하고 있는지 나타내는 상태
 */
export const uploadSingleImageState = atom(false)

/**
 * 다중 이미지를 업로드 하고 있는지 나타내는 상태
 */
export const uploadMultipleImagesState = atom(false)

/**
 * 사용자 프로필 이미지 업로드 상태
 */
export const uploadProfileImageState = atom(false)

/**
 * Home Page 상단 메뉴 바 상태
 */
export const homeMenuBarState = atom(false)

/**
 * Generation 선택 상태
 */
export const generationState = atom('')

/**
 * Modal 상태
 */
export const modalState = atom({
  text: '',
  action: () => {},
})
