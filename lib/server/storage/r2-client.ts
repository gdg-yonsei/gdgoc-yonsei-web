// R2 클라이언트 생성은 네트워크 호출을 테스트에서 대체할 수 있도록 분리한다.
import 'server-only'

import { S3Client } from '@aws-sdk/client-s3'
import { getR2ClientEnv } from '@/lib/server/env'

const r2Env = getR2ClientEnv()

export const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${r2Env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: r2Env.R2_ACCESS_KEY,
    secretAccessKey: r2Env.R2_SECRET_KEY,
  },
})
