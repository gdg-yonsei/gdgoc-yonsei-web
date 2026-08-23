import { prepareE2EData } from './global-setup'

const port = Number(process.env.PORT ?? 3100)
const baseURL = `http://127.0.0.1:${port.toString()}`

prepareE2EData(baseURL).then(
  () => process.exit(0),
  (error: unknown) => {
    console.error(error)
    process.exit(1)
  }
)
