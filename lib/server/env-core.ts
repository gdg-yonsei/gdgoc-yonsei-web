import { z } from 'zod'

function requiredStringEnv(envName: string) {
  const message = `${envName} is not set in environment variables.`

  return z
    .string({
      required_error: message,
      invalid_type_error: message,
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

const baseServerEnvSchema = z.object({
  AUTH_DRIZZLE_URL: z.string().min(1).optional(),
  AUTH_SECRET: z.string().min(1).optional(),
  AUTH_GITHUB_ID: z.string().min(1).optional(),
  AUTH_GITHUB_SECRET: z.string().min(1).optional(),
  AUTH_GOOGLE_ID: z.string().min(1).optional(),
  AUTH_GOOGLE_SECRET: z.string().min(1).optional(),
  AUTH_URL: z.string().url().optional(),
  NEXT_PUBLIC_SITE_URL: z.string().url().optional(),
  NEXT_PUBLIC_IMAGE_URL: z.string().url().optional(),
  R2_ACCESS_KEY: z.string().min(1).optional(),
  R2_SECRET_KEY: z.string().min(1).optional(),
  CLOUDFLARE_ACCOUNT_ID: z.string().min(1).optional(),
  R2_BUCKET_NAME: z.string().min(1).optional(),
  RESEND_API_KEY: z.string().min(1).optional(),
  REDIS_URL: redisUrlSchema.optional(),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
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

const redisEnvSchema = z.object({
  REDIS_URL: requiredStringEnv('REDIS_URL').regex(
    /^redis(s)?:\/\//,
    'REDIS_URL must start with redis:// or rediss://'
  ),
})

type BaseServerEnv = z.infer<typeof baseServerEnvSchema>

let cachedBaseEnv: BaseServerEnv | null = null

function getBaseServerEnv(): BaseServerEnv {
  if (process.env.NODE_ENV === 'test') {
    return baseServerEnvSchema.parse(process.env)
  }

  if (!cachedBaseEnv) {
    cachedBaseEnv = baseServerEnvSchema.parse(process.env)
  }

  return cachedBaseEnv
}

export function getServerEnv() {
  return getBaseServerEnv()
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

export function getR2ClientEnv() {
  return r2ClientEnvSchema.parse(getBaseServerEnv())
}

export function getR2BucketEnv() {
  return r2BucketEnvSchema.parse(getBaseServerEnv())
}

export function getResendEnv() {
  return resendEnvSchema.parse(getBaseServerEnv())
}

export function getRedisEnv() {
  return redisEnvSchema.safeParse(getBaseServerEnv())
}
