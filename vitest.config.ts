import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths()],
  resolve: {
    alias: {
      'server-only': fileURLToPath(
        new URL('./tests/mocks/server-only.ts', import.meta.url)
      ),
    },
  },
  test: {
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['lib/**/*.ts', 'app/components/**/*.tsx'],
    },
  },
})
