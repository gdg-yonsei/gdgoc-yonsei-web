/**
 * @file This file contains a function to generate a pre-signed URL for uploading files to Cloudflare R2.
 */

import r2Client from '@/lib/server/r2-client'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import { getR2BucketEnv } from '@/lib/server/env'

/**
 * Generates a pre-signed URL for uploading a file to the R2 bucket.
 * This URL grants temporary permission to upload a file with a specific key and content type.
 *
 * @param fileName - The name of the file to be uploaded. This will be the key in the R2 bucket.
 * @param contentType - The MIME type of the file (e.g., 'image/png').
 * @returns A promise that resolves to the pre-signed URL, valid for one hour.
 */
export default async function getPreSignedUrl(
  fileName: string,
  contentType: string
): Promise<string> {
  const bucketEnv = getR2BucketEnv()

  // Create a command to put an object in the R2 bucket.
  const command = new PutObjectCommand({
    Bucket: bucketEnv.R2_BUCKET_NAME,
    Key: fileName,
    ContentType: contentType,
  })

  // Generate and return the signed URL from the R2 client and the command.
  return getSignedUrl(r2Client, command, { expiresIn: 3600 })
}
