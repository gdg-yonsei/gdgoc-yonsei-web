// Runs specs against an already running server (serve-prod.sh --no-build).
import base from '../../playwright.production.config'
import { defineConfig } from '@playwright/test'

export default defineConfig({ ...base, testDir: '../../tests/e2e', webServer: undefined, globalSetup: undefined })
