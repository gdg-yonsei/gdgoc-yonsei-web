// 관리자 폼과 MCP 입력의 공통 상한. 화면에서는 넘길 일이 없는 넉넉한 값이며,
// 조작된 요청이 거대한 값을 DB·캐시·공개 페이지에 밀어 넣지 못하게 한다.

/** 이름·제목·장소처럼 한 줄로 쓰는 값. */
export const MAX_TITLE_LENGTH = 200
/** 카드에 보이는 요약, 파트 설명. */
export const MAX_SUMMARY_LENGTH = 2_000
/** 마크다운 본문. */
export const MAX_BODY_LENGTH = 100_000
export const MAX_URL_LENGTH = 2_048
/** 사용자 ID. Better Auth ID와 UUID 모두 이보다 짧다. */
export const MAX_ID_LENGTH = 128
/** 한 항목에 붙일 수 있는 본문 이미지 수. */
export const MAX_IMAGES = 100
/** 한 항목의 참가자·구성원 수. */
export const MAX_PEOPLE = 1_000
