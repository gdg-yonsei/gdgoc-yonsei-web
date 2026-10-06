// 메타데이터 생성이 무거운 sharp·satori 렌더러를 가져오지 않도록 규격 상수를 분리한다.

export const SOCIAL_IMAGE_SIZE = { width: 1200, height: 630 } as const

/** 소셜 이미지 응답 형식. 사진이 들어가므로 PNG보다 작은 JPEG를 쓴다. */
export const SOCIAL_IMAGE_CONTENT_TYPE = 'image/jpeg'
