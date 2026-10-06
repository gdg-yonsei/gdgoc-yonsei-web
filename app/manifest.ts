import type { MetadataRoute } from 'next'

export default function generateManifest(): MetadataRoute.Manifest {
  return {
    name: 'GDGoC Yonsei',
    short_name: 'GDGoC Yonsei',
    description:
      "Official website of GDGoC Yonsei, Yonsei University's student developer community.",
    // 설치 앱이 한쪽 언어에 고정되지 않게, 루트 경로에서 proxy가 언어를 고르게 한다.

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
