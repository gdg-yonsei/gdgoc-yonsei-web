import AdminDefaultLayout from '@/app/components/admin/admin-default-layout'
import { getProject } from '@/lib/server/fetcher/admin/get-project'
import { notFound } from 'next/navigation'
import AdminNavigationButton from '@/app/components/admin/admin-navigation-button'
import { ChevronLeftIcon } from '@heroicons/react/24/outline'
import { updateProjectAction } from '@/app/(admin)/admin/projects/[projectId]/edit/actions'
import DataForm from '@/app/components/data-form'
import DataInput from '@/app/components/admin/data-input'
import SubmitButton from '@/app/components/admin/submit-button'
import MDXEditor from '@/app/components/admin/mdx-editor'
import DataImageInput from '@/app/components/admin/data-image-input'
import DataMultipleImageInput from '@/app/components/admin/data-multiple-image-input'
import MembersSelectInput from '@/app/components/admin/member-select-input'
import { getMembers } from '@/lib/server/fetcher/admin/get-members'
import { Metadata } from 'next'
import { getAdminLocale, getAdminMessages } from '@/lib/admin-i18n/server'
import BilingualPanel from '@/app/components/admin/bilingual-panel'
import { auth } from '@/auth'
import { resolveAdminGenerationScope } from '@/lib/server/admin-generation-scope'
import AdminGenerationScopeMismatchNotice from '@/app/components/admin/admin-generation-scope-mismatch-notice'

export const metadata: Metadata = {
  title: 'Edit Project',
}

/**
 * `EditProjectPage` 컴포넌트는 전달받은 props와 현재 상태를 기반으로 화면(UI)을 구성하여 렌더링합니다.
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
export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ projectId: string }>
}) {
  const t = getAdminMessages(await getAdminLocale())
  const locale = await getAdminLocale()
  const { projectId } = await params
  const projectData = await getProject(projectId)
  if (!projectData) {
    notFound()
  }

  const updateProjectActionWithProjectId = updateProjectAction.bind(
    null,
    projectId
  )

  const session = await auth()
  const resolvedScope = session?.user?.id
    ? await resolveAdminGenerationScope(session.user.id)
    : null
  const actualGeneration = projectData.generation
    ? {
        id: projectData.generation.id,
        name: projectData.generation.name,
      }
    : null
  const membersList =
    actualGeneration &&
    (await getMembers({
      kind: 'generation',
      generationId: actualGeneration.id,
    }))

  return (
    <AdminDefaultLayout>
      {actualGeneration && (
        <AdminGenerationScopeMismatchNotice
          actualGeneration={actualGeneration}
          canSwitch={
            resolvedScope?.canAccessAll === true ||
            resolvedScope?.options.some(
              (option) => option.id === actualGeneration.id
            ) === true
          }
          currentScope={resolvedScope?.scope ?? null}
          locale={locale}
        />
      )}
      <AdminNavigationButton href={`/admin/projects/${projectId}`}>
        <ChevronLeftIcon className={'size-8'} />
        <p className={'text-lg'}>
          {projectData.name} {t.project}
        </p>
      </AdminNavigationButton>
      <div className={'admin-title py-4'}>
        {t.edit} {projectData.name} {t.project}
      </div>
      <DataForm
        action={updateProjectActionWithProjectId}
        className={'member-data-grid w-full gap-4'}
      >
        <input
          hidden={true}
          name={'generationId'}
          readOnly={true}
          value={String(actualGeneration?.id ?? projectData.generationId)}
        />
        <div className={'col-span-1 sm:col-span-2 lg:col-span-4'}>
          <BilingualPanel
            enTitle={t.english}
            koTitle={t.korean}
            fieldLabel={t.name}
            requiredBoth={true}
            enFieldNames={['name']}
            koFieldNames={['nameKo']}
            enContent={
              <DataInput
                defaultValue={projectData.name}
                name={'name'}
                placeholder={t.nameEn}
                title={t.nameEn}
              />
            }
            koContent={
              <DataInput
                defaultValue={projectData.nameKo}
                name={'nameKo'}
                placeholder={t.nameKo}
                title={t.nameKo}
              />
            }
          />
        </div>
        <div className={'col-span-1 sm:col-span-2 lg:col-span-4'}>
          <BilingualPanel
            enTitle={t.english}
            koTitle={t.korean}
            fieldLabel={t.description}
            requiredBoth={true}
            enFieldNames={['description']}
            koFieldNames={['descriptionKo']}
            enContent={
              <DataInput
                defaultValue={projectData.description}
                name={'description'}
                placeholder={t.descriptionEn}
                title={t.descriptionEn}
              />
            }
            koContent={
              <DataInput
                defaultValue={projectData.descriptionKo}
                name={'descriptionKo'}
                placeholder={t.descriptionKo}
                title={t.descriptionKo}
              />
            }
          />
        </div>
        <div className={'member-data-box col-span-1 sm:col-span-2 md:col-span-3 lg:col-span-4'}>
          <div className={'member-data-title'}>{t.generation}</div>
          <div className={'member-data-content'}>{actualGeneration?.name}</div>
        </div>
        <MembersSelectInput
          defaultValue={projectData.usersToProjects.map((user) => user.userId)}
          members={membersList ?? []}
        />
        <div
          className={
            'member-data-col-span col-span-1 grid grid-cols-1 gap-2 sm:col-span-3 sm:grid-cols-2 md:col-span-4'
          }
        >
          <div>
            <DataImageInput
              baseUrl={'/api/admin/projects/main-image'}
              title={t.mainImage}
              name={'mainImage'}
              defaultValue={projectData.mainImage}
            >
              {t.selectImage}
            </DataImageInput>
          </div>
          <div>
            <DataMultipleImageInput
              baseUrl={'/api/admin/projects/content-image'}
              name={'contentImages'}
              title={t.contentImages}
              defaultValue={projectData.images.map((image) => image)}
            >
              {t.selectImage}
            </DataMultipleImageInput>
          </div>
        </div>
        <div className={'col-span-1 sm:col-span-2 lg:col-span-4'}>
          <BilingualPanel
            enTitle={t.english}
            koTitle={t.korean}
            fieldLabel={t.content}
            requiredBoth={true}
            enFieldNames={['content']}
            koFieldNames={['contentKo']}
            enContent={
              <MDXEditor
                title={t.contentEn}
                name={'content'}
                defaultValue={projectData.content}
                placeholder={'Please write content'}
              />
            }
            koContent={
              <MDXEditor
                title={t.contentKo}
                name={'contentKo'}
                defaultValue={projectData.contentKo}
                placeholder={'한국어 본문을 작성하세요.'}
              />
            }
          />
        </div>
        <SubmitButton />
      </DataForm>
    </AdminDefaultLayout>
  )
}
