/**
 * Cloudflare R2(S3 호환) 클라이언트 싱글턴.
 *
 * R2에 직접 접근하는 코드는 `lib/server/storage/r2.ts`뿐이며, 이 클라이언트도 그
 * 모듈에서만 사용한다. 테스트에서 네트워크 호출을 손쉽게 가로챌 수 있도록 클라이언트
 * 생성만 별도 파일로 분리했다.
 */
import 'server-only'

import { S3Client } from '@aws-sdk/client-s3'
import { getR2ClientEnv } from '@/lib/server/env'

const r2Env = getR2ClientEnv()

/** R2 계정 엔드포인트에 연결된 S3 클라이언트. 모듈 로드 시 한 번만 만든다. */
export const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${r2Env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: r2Env.R2_ACCESS_KEY,
    secretAccessKey: r2Env.R2_SECRET_KEY,
  },
})
