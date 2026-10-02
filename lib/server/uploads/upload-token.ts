/**
 * MCP 업로드 완료 토큰(HMAC 서명). 발급한 객체 키에만 업로드 완료를 허용한다.
 */
import 'server-only'

import { createHmac, timingSafeEqual } from 'node:crypto'
import { getAuthEnv } from '@/lib/server/env-core'

/** 발급 뒤 complete_image_upload 까지 허용하는 시간. 업로드 URL(15분)보다 넉넉히. */
export const UPLOAD_TOKEN_TTL_SECONDS = 60 * 60

/** Better Auth 비밀키로 업로드 토큰 내용을 서명한다. */
function sign(payload: string) {
  return createHmac('sha256', getAuthEnv().BETTER_AUTH_SECRET)
    .update(`mcp-image-upload:${payload}`)
    .digest('base64url')
}

/**
 * create_image_upload 가 발급한 객체 키에만 complete 를 허용하기 위한 토큰.
 * 키·발급 대상 사용자·만료를 묶어 서명하므로, 이미 사이트에 있는 이미지 키나
 * 다른 사람의 업로드를 complete 로 넘겨 검증·삭제하게 할 수 없다.
 */
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
