import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const read = (path: string) => readFileSync(path, 'utf8')

const imports = (path: string) =>
  read(path)
    .split('\n')
    .filter((line) => /^\s*@?import\b/.test(line))
    .join('\n')

// Landing styles are render-blocking CSS that no other page uses: they load
// with the home route instead of the global bundle every page downloads.
describe('landing CSS', () => {
  it('ships with the home page, not the global bundle', () => {
    for (const sheet of ['app/globals.css', 'app/site.css', 'app/admin.css']) {
      expect(imports(sheet), sheet).not.toContain('site-home.css')
    }
    expect(read('app/(home)/[lang]/page.tsx')).toContain(
      "import '@/app/styles/site-home.css'"
    )
  })
})

// The public site and the admin app are separate root layouts. Each loads its
// own stylesheet on top of the shared base, so neither ships the other's CSS.
describe('site and admin CSS', () => {
  it('keeps only shared foundations in globals.css', () => {
    const globals = read('app/globals.css')

    expect(globals).toContain("@import 'tailwindcss'")
    expect(globals).toContain("@import './pretendard.css'")
    expect(imports('app/globals.css')).not.toMatch(/styles\/site-/)
    expect(globals).not.toMatch(/@utility|--canvas|@custom-variant/)
  })

  it('puts the public site design system in site.css only', () => {
    const site = read('app/site.css')

    expect(site).toContain("@import './globals.css'")
    for (const part of ['theme', 'hero', 'chrome', 'content']) {
      expect(site).toContain(`@import './styles/site-${part}.css'`)
    }
    expect(site).not.toMatch(/@utility admin-|--canvas:|@custom-variant dark/)
  })

  it('puts admin tokens and utilities in admin.css only', () => {
    const admin = read('app/admin.css')

    expect(admin).toContain("@import './globals.css'")
    expect(imports('app/admin.css')).not.toMatch(/styles\/site-/)
    expect(admin).toContain('@custom-variant dark')
    expect(admin).toContain('@utility admin-btn')
    expect(admin).toContain('--canvas:')
  })

  it('loads one stylesheet per document shell', () => {
    expect(read('app/(home)/[lang]/layout.tsx')).toContain(
      "import '../../site.css'"
    )
    expect(read('app/(admin)/layout.tsx')).toContain("import '../admin.css'")
    expect(read('app/global-not-found.tsx')).toContain("import './site.css'")
    expect(read('app/global-error.tsx')).toContain("import './site.css'")

    for (const shell of [
      'app/(home)/[lang]/layout.tsx',
      'app/(admin)/layout.tsx',
      'app/global-not-found.tsx',
      'app/global-error.tsx',
    ]) {
      expect(imports(shell), shell).not.toContain('globals.css')
    }
  })
})
