// 기능별 필수값만 검사해 R2 설정 없이도 공개 페이지를 연다. 운영은 캐시하고 테스트는 매번 읽는다.
// tsx 도구도 가져오므로 server-only는 env.ts에만 둔다. 앱은 env.ts를 사용해야 한다.
import { z } from 'zod'

function requiredStringEnv(envName: string) {
  const message = `${envName} is not set in environment variables.`

  return z
    .string({
      error: message,
    })
    .min(1, message)
}

function requiredUrlEnv(envName: string) {
  return requiredStringEnv(envName).url(
    `${envName} must be a valid URL in environment variables.`
  )
}

const redisUrlSchema = z
  .string()
  .regex(/^redis(s)?:\/\//, 'REDIS_URL must start with redis:// or rediss://')

// 기능별 스키마가 필수 여부를 정하므로 기본 스키마에서는 모든 값을 선택으로 둔다.
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

export function getSiteEnv() {
  return siteEnvSchema.parse(getBaseServerEnv())
}

export function getImageEnv() {
  return imageEnvSchema.parse(getBaseServerEnv())
}

export function getDatabaseEnv() {
  return databaseEnvSchema.parse(getBaseServerEnv())
}

export function getAuthEnv() {
  return authEnvSchema.parse(getBaseServerEnv())
}

export function getR2ClientEnv() {
  return r2ClientEnvSchema.parse(getBaseServerEnv())
}

export function getR2BucketEnv() {
  return r2BucketEnvSchema.parse(getBaseServerEnv())
}

export function getResendEnv() {
  return resendEnvSchema.parse(getBaseServerEnv())
}
