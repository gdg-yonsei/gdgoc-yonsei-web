// R2 객체를 지우기 전에 다른 행이 같은 객체를 쓰는지 확인한다.
// 이미지 URL은 공개돼 있어 누구나 자기 항목에 남의 URL을 적을 수 있다. 참조 확인 없이
// "이 항목에서 빠진 이미지"를 지우면 그 방법으로 남의 이미지를 지울 수 있다.
import 'server-only'

import { sql } from 'drizzle-orm'
import { db } from '@/db'
import { projects } from '@/db/schema/projects'
import { sessions } from '@/db/schema/sessions'
import { users } from '@/db/schema/users'
import { logger } from '@/lib/server/logger'

// 저장된 값은 공개 URL, 쿼리가 붙은 URL, 키만 있는 옛 형식이 섞여 있을 수 있어 키가 포함된
// 값을 모두 참조로 본다. 키는 `접두사/UUID.확장자`라 우연히 겹치지 않는다.
async function isReferenced(objectKey: string): Promise<boolean> {
  const [project, session, user] = await Promise.all([
    db
      .select({ id: projects.id })
      .from(projects)
      .where(
        sql`strpos(${projects.mainImage}, ${objectKey}) > 0 OR strpos(${projects.images}::text, ${objectKey}) > 0`
      )
      .limit(1),
    db
      .select({ id: sessions.id })
      .from(sessions)
      .where(
        sql`strpos(${sessions.mainImage}, ${objectKey}) > 0 OR strpos(${sessions.images}::text, ${objectKey}) > 0`
      )
      .limit(1),
    db
      .select({ id: users.id })
      .from(users)
      .where(sql`strpos(${users.image}, ${objectKey}) > 0`)
      .limit(1),
  ])
  return project.length > 0 || session.length > 0 || user.length > 0
}

/**
 * 주어진 객체 키 가운데 프로젝트·세션·프로필 행이 아직 참조하는 키를 돌려준다.
 * DB 변경을 커밋한 뒤에 불러야 방금 뺀 참조가 결과에 섞이지 않는다.
 * 확인에 실패하면 모든 키를 참조 중으로 보고(삭제하지 않게) 로그를 남긴다.
 */
export async function findReferencedImageKeys(
  objectKeys: readonly string[]
): Promise<ReadonlySet<string>> {
  const keys = [...new Set(objectKeys)]
  try {
    const referenced = await Promise.all(keys.map(isReferenced))
    return new Set(keys.filter((_, index) => referenced[index]))
  } catch (error) {
    logger.error('r2.image-references', error, { imageKeyCount: keys.length })
    return new Set(keys)
  }
}
