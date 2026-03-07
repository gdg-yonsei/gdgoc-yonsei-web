/**
 * @file This file configures and exports a singleton S3 client for interacting with Cloudflare R2 storage.
 */

import { S3Client } from '@aws-sdk/client-s3'
import { getR2ClientEnv } from '@/lib/server/env'

const r2Env = getR2ClientEnv()

/**
 * An instance of the S3Client configured to connect to Cloudflare R2 storage.
 * This client is used for all R2-related operations, such as generating pre-signed URLs
 * for uploads or deleting objects from the bucket.
 * It is configured using credentials and account ID from environment variables.
 */
const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${r2Env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: r2Env.R2_ACCESS_KEY,
    secretAccessKey: r2Env.R2_SECRET_KEY,
  },
})

export default r2Client
