import 'server-only'
import r2Client from '@/lib/admin/r2-client'
import { DeleteObjectsCommand } from '@aws-sdk/client-s3'

export default async function deleteR2Images(imageKeys: string[]) {
  const deleteCommand = new DeleteObjectsCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Delete: {
      Objects: imageKeys.map((key) => {
        return { Key: key }
      }),
    },
  })

  try {
    await r2Client.send(deleteCommand)
    return true
  } catch (err) {
    console.error(err)
    return false
  }
}
