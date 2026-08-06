import type { MetadataRoute } from 'next'

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
