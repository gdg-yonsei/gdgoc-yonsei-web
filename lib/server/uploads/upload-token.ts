// 완료 토큰은 발급한 객체 키에만 업로드 완료를 허용하는 HMAC 서명이다.
import 'server-only'

import { createHmac, timingSafeEqual } from 'node:crypto'
import { getAuthEnv } from '@/lib/server/env-core'

/** 발급 뒤 complete_image_upload 까지 허용하는 시간. 업로드 URL(15분)보다 넉넉히. */
export const UPLOAD_TOKEN_TTL_SECONDS = 60 * 60

function sign(payload: string) {
  return createHmac('sha256', getAuthEnv().BETTER_AUTH_SECRET)
    .update(`mcp-image-upload:${payload}`)
    .digest('base64url')
}

// 키·사용자·만료를 함께 서명해 기존 사이트 이미지나 남의 업로드를 완료 검증으로 삭제할 수 없게 한다.
export function issueUploadToken(
  objectKey: string,
  userId: string,
  now = Date.now()
): string {
  const expiresAt = Math.floor(now / 1000) + UPLOAD_TOKEN_TTL_SECONDS
  return `${expiresAt}.${sign(`${objectKey}|${userId}|${expiresAt}`)}`
}

/** 토큰이 이 객체 키·사용자에게 발급됐고 아직 유효한지. 서명 비교는 타이밍 공격을 막는 방식으로 한다. */
export function verifyUploadToken(
  token: string,
  objectKey: string,
  userId: string,
  now = Date.now()
): boolean {
  const [expiresAtRaw, signature] = token.split('.')
  const expiresAt = Number(expiresAtRaw)
  if (!signature || !Number.isInteger(expiresAt)) return false
  if (expiresAt < Math.floor(now / 1000)) return false

  const expected = Buffer.from(sign(`${objectKey}|${userId}|${expiresAt}`))
  const given = Buffer.from(signature)
  return expected.length === given.length && timingSafeEqual(expected, given)
}
