/**
 * 관리자 화면 전역 클라이언트 상태(Jotai atom): 메뉴, 업로드 진행 여부, 확인 모달.
 */
import { atom } from 'jotai'

/** 로그인 버튼을 누른 뒤 인증이 진행 중인지(중복 클릭 방지). */
export const isAuthenticatingState = atom(false)

/** 모바일 메뉴 드로어가 열려 있는지. */
export const menuBarState = atom(false)

/** 이미지 업로드가 하나라도 진행 중인지. 업로드 중에는 제출 버튼을 막는다. */
export const isLoadingState = atom(
  (get) =>
    get(uploadSingleImageState) ||
    get(uploadMultipleImagesState) ||
    get(uploadProfileImageState)
)

/** 대표 이미지(한 장) 업로드 중인지. */
export const uploadSingleImageState = atom(false)

/** 본문 이미지(여러 장) 업로드 중인지. */
export const uploadMultipleImagesState = atom(false)

/** 프로필 이미지 업로드 중인지. */
export const uploadProfileImageState = atom(false)

/** 확인 모달 상태: 보여 줄 문구와 확인을 눌렀을 때 실행할 동작. 문구가 비어 있으면 닫힌 상태다. */
export const modalState = atom({
  text: '',
  action: () => {},
})
