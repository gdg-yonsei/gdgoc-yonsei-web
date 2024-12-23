import 'dotenv/config'
import { drizzle } from 'drizzle-orm/postgres-js'

const db = drizzle(process.env.AUTH_DRIZZLE_URL!)

export default db
