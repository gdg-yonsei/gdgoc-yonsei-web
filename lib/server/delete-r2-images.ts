/**
 * @file This file contains a server-side function for deleting multiple images from Cloudflare R2 storage.
 */

import 'server-only'
import r2Client from '@/lib/server/r2-client'
import { DeleteObjectsCommand } from '@aws-sdk/client-s3'
import { getR2BucketEnv } from '@/lib/server/env'
import { logger } from '@/lib/server/logger'

/**
 * Deletes multiple images from the Cloudflare R2 bucket.
 *
 * @param imageKeys - An array of strings, where each string is the key of an image to be deleted.
 * @returns A promise that resolves to `true` if the deletion command was sent successfully, otherwise `false`.
 *          Note: This does not guarantee that all objects were deleted, only that the request was processed.
 */
export default async function deleteR2Images(
  imageKeys: string[]
): Promise<boolean> {
  // If there are no keys to delete, return true as there is nothing to do.
  if (imageKeys.length === 0) {
    return true
  }

  try {
    const bucketEnv = getR2BucketEnv()

    // Create the command to delete the specified objects.
    const deleteCommand = new DeleteObjectsCommand({
      Bucket: bucketEnv.R2_BUCKET_NAME,
      Delete: {
        Objects: imageKeys.map((key) => ({ Key: key })),
      },
    })

    // Send the deletion command to the R2 client.
    await r2Client.send(deleteCommand)
    return true
  } catch (err) {
    logger.error('r2.delete-images', err, {
      imageKeyCount: imageKeys.length,
    })
    return false
  }
}
