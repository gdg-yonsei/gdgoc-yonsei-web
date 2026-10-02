/**
 * 환경변수 검증(zod).
 *
 * `process.env`를 직접 읽지 않고 이 모듈의 `get*Env()`로 읽는다. 필요한 값이 없거나 형식이
 * 틀리면 그 값을 처음 쓰는 시점에 분명한 메시지로 실패한다.
 *
 * - 기본 스키마(`baseServerEnvSchema`)는 모든 값을 선택으로 두고, 기능별 함수가 그 기능에
 *   필요한 값만 필수로 검사한다. 그래서 R2 설정이 없어도 공개 페이지는 뜬다.
 * - 테스트(`NODE_ENV=test`)에서는 테스트가 환경변수를 바꿀 수 있도록 매번 다시 읽는다.
 *
 * `server-only`를 붙이지 않은 이유: Next 밖에서 tsx로 도는 DB 시드·마이그레이션·e2e 스크립트가
 * `db/index.ts`를 통해 이 파일을 import한다. Next 앱 코드에서는 `server-only`가 붙은
 * `lib/server/env.ts`를 쓴다.
 */
import { z } from 'zod'

/** 비어 있으면 안 되는 문자열 환경변수 스키마. */
function requiredStringEnv(envName: string) {
  const message = `${envName} is not set in environment variables.`

  return z
    .string({
      error: message,
    })
    .min(1, message)
}

/** URL 형식이어야 하는 환경변수 스키마. */
function requiredUrlEnv(envName: string) {
  return requiredStringEnv(envName).url(
    `${envName} must be a valid URL in environment variables.`
  )
}

const redisUrlSchema = z
  .string()
  .regex(/^redis(s)?:\/\//, 'REDIS_URL must start with redis:// or rediss://')

/** 앱이 읽는 모든 환경변수. 여기서는 모두 선택이며, 기능별 스키마가 필수 여부를 정한다. */
const baseServerEnvSchema = z.object({
  AUTH_DRIZZLE_URL: z.string().min(1).optional(),
  BETTER_AUTH_SECRET: z.string().min(1).optional(),
  BETTER_AUTH_URL: z.string().url().optional(),
  GITHUB_CLIENT_ID: z.string().min(1).optional(),
  GITHUB_CLIENT_SECRET: z.string().min(1).optional(),
  GOOGLE_CLIENT_ID: z.string().min(1).optional(),
  GOOGLE_CLIENT_SECRET: z.string().min(1).optional(),
  NEXT_PUBLIC_SITE_URL: z.string().url().optional(),
  NEXT_PUBLIC_IMAGE_URL: z.string().url().optional(),
  R2_ACCESS_KEY: z.string().min(1).optional(),
  R2_SECRET_KEY: z.string().min(1).optional(),
  CLOUDFLARE_ACCOUNT_ID: z.string().min(1).optional(),
  R2_BUCKET_NAME: z.string().min(1).optional(),
  RESEND_API_KEY: z.string().min(1).optional(),
  REDIS_URL: redisUrlSchema.optional(),
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
})

const siteEnvSchema = z.object({
  NEXT_PUBLIC_SITE_URL: requiredUrlEnv('NEXT_PUBLIC_SITE_URL'),
})

const imageEnvSchema = z.object({
  NEXT_PUBLIC_IMAGE_URL: requiredUrlEnv('NEXT_PUBLIC_IMAGE_URL'),
})

const databaseEnvSchema = z.object({
  AUTH_DRIZZLE_URL: requiredStringEnv('AUTH_DRIZZLE_URL'),
})

const authEnvSchema = z.object({
  BETTER_AUTH_SECRET: requiredStringEnv('BETTER_AUTH_SECRET').min(
    32,
    'BETTER_AUTH_SECRET must be at least 32 characters.'
  ),
  BETTER_AUTH_URL: requiredUrlEnv('BETTER_AUTH_URL'),
  GITHUB_CLIENT_ID: requiredStringEnv('GITHUB_CLIENT_ID'),
  GITHUB_CLIENT_SECRET: requiredStringEnv('GITHUB_CLIENT_SECRET'),
  GOOGLE_CLIENT_ID: requiredStringEnv('GOOGLE_CLIENT_ID'),
  GOOGLE_CLIENT_SECRET: requiredStringEnv('GOOGLE_CLIENT_SECRET'),
})

const r2ClientEnvSchema = z.object({
  CLOUDFLARE_ACCOUNT_ID: requiredStringEnv('CLOUDFLARE_ACCOUNT_ID'),
  R2_ACCESS_KEY: requiredStringEnv('R2_ACCESS_KEY'),
  R2_SECRET_KEY: requiredStringEnv('R2_SECRET_KEY'),
})

const r2BucketEnvSchema = z.object({
  R2_BUCKET_NAME: requiredStringEnv('R2_BUCKET_NAME'),
})

const resendEnvSchema = z.object({
  RESEND_API_KEY: requiredStringEnv('RESEND_API_KEY'),
})

type BaseServerEnv = z.infer<typeof baseServerEnvSchema>

let cachedBaseEnv: BaseServerEnv | null = null

/** 기본 스키마로 검증한 환경변수. 운영에서는 한 번만 검증해 캐시한다. */
function getBaseServerEnv(): BaseServerEnv {
  if (process.env.NODE_ENV === 'test') {
    return baseServerEnvSchema.parse(process.env)
  }

  if (!cachedBaseEnv) {
    cachedBaseEnv = baseServerEnvSchema.parse(process.env)
  }

  return cachedBaseEnv
}

/** 사이트 공개 주소(`NEXT_PUBLIC_SITE_URL`). 캐노니컬 URL, 메일 링크에 쓴다. */
export function getSiteEnv() {
  return siteEnvSchema.parse(getBaseServerEnv())
}

/** 공개 이미지 도메인(`NEXT_PUBLIC_IMAGE_URL`, R2 공개 버킷 주소). */
export function getImageEnv() {
  return imageEnvSchema.parse(getBaseServerEnv())
}

/** PostgreSQL 접속 문자열(`AUTH_DRIZZLE_URL`). */
export function getDatabaseEnv() {
  return databaseEnvSchema.parse(getBaseServerEnv())
}

/** Better Auth 비밀키·주소와 GitHub/Google OAuth 앱 설정. */
export function getAuthEnv() {
  return authEnvSchema.parse(getBaseServerEnv())
}

/** Cloudflare R2 계정 ID와 접근 키. */
export function getR2ClientEnv() {
  return r2ClientEnvSchema.parse(getBaseServerEnv())
}

/** R2 버킷 이름. */
export function getR2BucketEnv() {
  return r2BucketEnvSchema.parse(getBaseServerEnv())
}

/** Resend 메일 API 키. */
export function getResendEnv() {
  return resendEnvSchema.parse(getBaseServerEnv())
}
