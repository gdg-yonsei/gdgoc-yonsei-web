import fs from 'node:fs/promises'
import { SEEDED_DATA_FILE, SeededE2EData } from '../setup/constants'

export async function readSeededData(): Promise<SeededE2EData> {
  const raw = await fs.readFile(SEEDED_DATA_FILE, 'utf8')
  return JSON.parse(raw) as SeededE2EData
}
