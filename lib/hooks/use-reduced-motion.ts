/**
 * 사용자가 OS에서 "움직임 줄이기"를 켰는지 알려 주는 훅(motion 라이브러리의 훅을 다시 내보낸다).
 * 관리자 메뉴·모달 애니메이션이 쓴다. 이 파일을 거치게 해 테스트에서 쉽게 목으로 바꿀 수 있다.
 */
export { useReducedMotion } from 'motion/react'
