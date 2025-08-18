/**
 * @file This file contains a server-side function for deleting multiple images from Cloudflare R2 storage.
 */

import 'server-only'
import r2Client from '@/lib/server/r2-client'
import { DeleteObjectsCommand } from '@aws-sdk/client-s3'

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

  // Ensure the R2 bucket name is configured.
  if (!process.env.R2_BUCKET_NAME) {
    console.error('R2_BUCKET_NAME is not set in environment variables.')
    return false
  }

  // Create the command to delete the specified objects.
  const deleteCommand = new DeleteObjectsCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Delete: {
      Objects: imageKeys.map((key) => ({ Key: key })),
    },
  })

  try {
    // Send the deletion command to the R2 client.
    await r2Client.send(deleteCommand)
    return true
  } catch (err) {
    // Log any errors that occur during the deletion process.
    console.error('Failed to delete images from R2:', err)
    return false
  }
}
