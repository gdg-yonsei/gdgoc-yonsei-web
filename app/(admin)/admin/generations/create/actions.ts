'use server'

import { auth } from '@/auth'
import handlePermission from '@/lib/server/permission/handle-permission'
import { generationValidation } from '@/lib/validations/generation'
import db from '@/db'
import { generations } from '@/db/schema/generations'
import { forbidden, redirect } from 'next/navigation'
import getGenerationFormData from '@/lib/server/form-data/get-generation-form-data'
import { revalidateCache } from '@/lib/server/cache'

/**
 * `createGenerationAction` 함수는 전달받은 입력값을 바탕으로 필요한 비즈니스 로직을 수행합니다.
 *
 * 구동 원리:
 * 1. 입력값(없음)을 기준으로 전처리/검증 또는 조회 조건을 구성합니다.
 * 2. 함수 본문의 조건 분기와 동기/비동기 로직을 순서대로 실행합니다.
 * 3. 계산 결과를 반환하거나 캐시/DB/리다이렉트 등 필요한 부수 효과를 반영합니다.
 *
 * 작동 결과:
 * - 호출부에서 즉시 활용 가능한 결과값 또는 실행 상태를 제공합니다.
 * - 후속 로직이 안정적으로 이어질 수 있도록 일관된 동작을 보장합니다.
 */
export async function createGenerationAction(
  prev: { error: string },
  formData: FormData
) {
  // 사용자 generation 을 추가할 권한이 있는지 확인
  const session = await auth()
  if (!(await handlePermission(session?.user?.id, 'post', 'generations'))) {
    return forbidden()
  }

  // form data 에서 generation data 추출
  const { name, startDate, endDate } = getGenerationFormData(formData)

  // zod validation
  const parsedGenerationDataResult = generationValidation.safeParse({
    name,
    startDate,
    endDate,
  })

  if (!parsedGenerationDataResult.success) {
    console.log(parsedGenerationDataResult.error.issues)
    return { error: parsedGenerationDataResult.error.issues[0].message }
  }

  const parsedGenerationData = parsedGenerationDataResult.data

  // generation data 쿼리
  try {
    await db
      .insert(generations)
      .values({
        name: parsedGenerationData.name,
        startDate: parsedGenerationData.startDate,
        endDate: parsedGenerationData.endDate,
      })
      .returning({
        id: generations.id,
      })

    // 캐시 업데이트
    revalidateCache(['generations', 'parts'])

    // Warm up cache for the new generation member page
    const paths = [
      `${process.env.NEXT_PUBLIC_SITE_URL}/ko/member/${parsedGenerationData.name}`,
      `${process.env.NEXT_PUBLIC_SITE_URL}/en/member/${parsedGenerationData.name}`,
    ]

    await Promise.allSettled(
      paths.map((path) =>
        fetch(path, {
          cache: 'no-store',
        })
      )
    )
  } catch (e) {
    // DB 업데이트 오류
    console.error(e)
    return { error: 'DB Update Error' }
  }

  // generation 페이지로 이동
  redirect(`/admin/generations`)
}
