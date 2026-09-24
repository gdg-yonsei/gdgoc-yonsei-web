import { prepareE2EData } from './global-setup'

const port = Number(process.env.PORT ?? 3100)
// Must match playwright.production.config.ts (the auth cookie is per host).
const baseURL = `http://localhost:${port.toString()}`

prepareE2EData(baseURL).then(
  () => process.exit(0),
  (error: unknown) => {
    console.error(error)
    process.exit(1)
  }
)
