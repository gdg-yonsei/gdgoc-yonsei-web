/**
 * @file This file configures and exports a singleton S3 client for interacting with Cloudflare R2 storage.
 */

import { S3Client } from '@aws-sdk/client-s3';

// Ensure all required environment variables for R2 are set.
if (
  !process.env.CLOUDFLARE_ACCOUNT_ID ||
  !process.env.R2_ACCESS_KEY ||
  !process.env.R2_SECRET_KEY
) {
  throw new Error(
    'Cloudflare R2 environment variables (CLOUDFLARE_ACCOUNT_ID, R2_ACCESS_KEY, R2_SECRET_KEY) are not properly set.',
  );
}

/**
 * An instance of the S3Client configured to connect to Cloudflare R2 storage.
 * This client is used for all R2-related operations, such as generating pre-signed URLs
 * for uploads or deleting objects from the bucket.
 * It is configured using credentials and account ID from environment variables.
 */
const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY,
    secretAccessKey: process.env.R2_SECRET_KEY,
  },
});

export default r2Client;