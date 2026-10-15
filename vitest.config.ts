import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
    alias: {
      'server-only': fileURLToPath(
        new URL('./tests/mocks/server-only.ts', import.meta.url)
      ),
      'next/font/google': fileURLToPath(
        new URL('./tests/mocks/next-font-google.ts', import.meta.url)
      ),
      'next/root-params': fileURLToPath(
        new URL('./tests/mocks/next-root-params.ts', import.meta.url)
      ),
    },
  },
  test: {
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    // The cold Next module graph can exceed Vitest's 5s default when isolated workers start together.
    testTimeout: 15_000,
    // PGlite(WASM Postgres)를 띄우는 beforeEach가 병렬 실행 부하에서 10초 기본값을 넘는다.
    hookTimeout: 30_000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['lib/**/*.ts', 'app/components/**/*.tsx'],
    },
  },
})
