import type { MetadataRoute } from 'next'

/**
 * `generateManifest` 함수는 전달받은 입력값을 바탕으로 필요한 비즈니스 로직을 수행합니다.
 *
 * 구동 원리:
 * 1. 입력값(없음)을 기준으로 전처리/검증 또는 조회 조건을 구성합니다.
 * 2. 함수 본문의 조건 분기와 동기/비동기 로직을 순서대로 실행합니다.
 * 3. 계산 결과를 반환하거나 캐시/DB/리다이렉트 등 필요한 부수 효과를 반영합니다.
 *
 * 작동 결과:
 * - 호출부에서 즉시 활용 가능한 결과값 또는 실행 상태를 제공합니다.
 * - 후속 로직이 안정적으로 이어질 수 있도록 일관된 동작을 보장합니다.
 */
export default function generateManifest(): MetadataRoute.Manifest {
  return {
    name: 'GDGoC Yonsei',
    short_name: 'GDGoC Yonsei',
    description:
      "Official website of GDGoC Yonsei, Yonsei University's student developer community.",
    // 언어별 홈으로 보내면 설치된 앱이 한쪽 로케일에 고정되므로, proxy가 로케일을
    // 판별하도록 루트를 유지합니다.
    start_url: '/',
    display: 'standalone',
    background_color: '#fafafa',
    theme_color: '#4285f4',
    icons: [
      {
        src: '/gdgoc-logo.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/gdgoc-logo.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
}
