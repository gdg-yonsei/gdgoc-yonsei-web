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

const baseServerEnvSchema = z.object({
  AUTH_DRIZZLE_URL: z.string().min(1).optional(),
  BETTER_AUTH_SECRET: z.string().min(1).optional(),
  BETTER_AUTH_URL: z.string().url().optional(),
  GITHUB_CLIENT_ID: z.string().min(1).optional(),
  GITHUB_CLIENT_SECRET: z.string().min(1).optional(),
  GOOGLE_CLIENT_ID: z.string().min(1).optional(),
  GOOGLE_CLIENT_SECRET: z.string().min(1).optional(),
  // Temporary aliases keep an existing deployment usable while its environment
  // variables are renamed from Auth.js conventions.
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
  const env = getBaseServerEnv()

  return authEnvSchema.parse({
    BETTER_AUTH_SECRET: env.BETTER_AUTH_SECRET ?? env.AUTH_SECRET,
    BETTER_AUTH_URL: env.BETTER_AUTH_URL ?? env.AUTH_URL,
    GITHUB_CLIENT_ID: env.GITHUB_CLIENT_ID ?? env.AUTH_GITHUB_ID,
    GITHUB_CLIENT_SECRET: env.GITHUB_CLIENT_SECRET ?? env.AUTH_GITHUB_SECRET,
    GOOGLE_CLIENT_ID: env.GOOGLE_CLIENT_ID ?? env.AUTH_GOOGLE_ID,
    GOOGLE_CLIENT_SECRET: env.GOOGLE_CLIENT_SECRET ?? env.AUTH_GOOGLE_SECRET,
  })
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
