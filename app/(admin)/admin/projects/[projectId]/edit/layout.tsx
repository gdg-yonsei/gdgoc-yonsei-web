import { ReactNode } from 'react'
import { auth } from '@/auth'
import handlePermission from '@/lib/server/permission/handle-permission'
import { forbidden } from 'next/navigation'
import { getProject } from '@/lib/server/fetcher/admin/get-project'

/**
 * `EditProjectLayout` 컴포넌트는 전달받은 props와 현재 상태를 기반으로 화면(UI)을 구성하여 렌더링합니다.
 *
 * 구동 원리:
 * 1. 입력값(`구조 분해된 입력값`)을 읽고 필요한 계산/조건 분기 로직을 수행합니다.
 * 2. 이벤트 핸들러와 상태 변화를 반영하여 어떤 UI를 보여줄지 결정합니다.
 * 3. 최종 JSX를 반환해 호출 위치의 화면에 결과를 렌더링합니다.
 *
 * 작동 결과:
 * - 사용자에게 현재 데이터/상태에 맞는 인터페이스를 제공합니다.
 * - 상위 컴포넌트와 props를 통해 연결되어 페이지 상호작용 흐름을 완성합니다.
 */
export default async function EditProjectLayout({
  children,
  params,
}: {
  children: ReactNode
  params: Promise<{ projectId: string }>
}) {
  const session = await auth()
  const { projectId } = await params
  const projectData = await getProject(projectId)

  // 사용자가 project를 수정할 권한이 있는지 확인
  if (
    !(await handlePermission(
      session?.user?.id,
      'put',
      'projects',
      projectData.authorId
    ))
  ) {
    forbidden()
  }

  return <>{children}</>
}
