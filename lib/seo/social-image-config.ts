/**
 * 소셜 미리보기 이미지(Open Graph, Twitter) 공통 규격.
 *
 * 이미지 렌더러(`social-image.tsx`, sharp·satori 포함)는 무거워서 요청 시에만 동적으로
 * 불러온다. 메타데이터 생성 쪽이 렌더러를 import하지 않고도 규격을 쓸 수 있게
 * 상수만 이 가벼운 모듈에 둔다.
 */

/** 모든 소셜 이미지의 크기(px). 주요 플랫폼 권장 비율 1.91:1. */
export const SOCIAL_IMAGE_SIZE = { width: 1200, height: 630 } as const

/** 소셜 이미지 응답 형식. 사진이 들어가므로 PNG보다 작은 JPEG를 쓴다. */
export const SOCIAL_IMAGE_CONTENT_TYPE = 'image/jpeg'
