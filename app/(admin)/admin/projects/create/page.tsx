import AdminDefaultLayout from '@/app/components/admin/admin-default-layout'
import DataForm from '@/app/components/data-form'
import DataInput from '@/app/components/admin/data-input'
import SubmitButton from '@/app/components/admin/submit-button'
import { createProjectAction } from '@/app/(admin)/admin/projects/create/actions'
import DataImageInput from '@/app/components/admin/data-image-input'
import DataMultipleImageInput from '@/app/components/admin/data-multiple-image-input'
import DataTextarea from '@/app/components/admin/data-textarea'
import MDXEditor from '@/app/components/admin/mdx-editor'
import AdminNavigationButton from '@/app/components/admin/admin-navigation-button'
import { ChevronLeftIcon } from '@heroicons/react/24/outline'
import MembersSelectInput from '@/app/components/admin/member-select-input'
import { getMembers } from '@/lib/server/fetcher/admin/get-members'
import { Metadata } from 'next'
import { getAdminLocale, getAdminMessages } from '@/lib/admin-i18n/server'
import BilingualPanel from '@/app/components/admin/bilingual-panel'
import { auth } from '@/auth'
import { resolveAdminGenerationScope } from '@/lib/server/admin-generation-scope'

export const metadata: Metadata = {
  title: 'Create Project',
}

/**
 * `CreateProjectPage` 컴포넌트는 전달받은 props와 현재 상태를 기반으로 화면(UI)을 구성하여 렌더링합니다.
 *
 * 구동 원리:
 * 1. 입력값(없음)을 읽고 필요한 계산/조건 분기 로직을 수행합니다.
 * 2. 이벤트 핸들러와 상태 변화를 반영하여 어떤 UI를 보여줄지 결정합니다.
 * 3. 최종 JSX를 반환해 호출 위치의 화면에 결과를 렌더링합니다.
 *
 * 작동 결과:
 * - 사용자에게 현재 데이터/상태에 맞는 인터페이스를 제공합니다.
 * - 상위 컴포넌트와 props를 통해 연결되어 페이지 상호작용 흐름을 완성합니다.
 */
export default async function CreateProjectPage() {
  const t = getAdminMessages(await getAdminLocale())
  const session = await auth()
  const resolvedScope = session?.user?.id
    ? await resolveAdminGenerationScope(session.user.id)
    : null

  if (resolvedScope?.scope?.kind !== 'generation' || !resolvedScope.selectedGeneration) {
    return (
      <AdminDefaultLayout>
        <AdminNavigationButton href={'/admin/projects'}>
          <ChevronLeftIcon className={'size-8'} />
          <p className={'text-lg'}>{t.projects}</p>
        </AdminNavigationButton>
        <div className={'admin-title'}>
          {t.create} {t.project}
        </div>
        <div className={'rounded-2xl bg-white p-6 text-neutral-700'}>
          <div className={'font-semibold'}>{t.selectSpecificGenerationToCreate}</div>
        </div>
      </AdminDefaultLayout>
    )
  }

  const membersList = await getMembers(resolvedScope.scope)

  return (
    <AdminDefaultLayout>
      <AdminNavigationButton href={'/admin/projects'}>
        <ChevronLeftIcon className={'size-8'} />
        <p className={'text-lg'}>{t.projects}</p>
      </AdminNavigationButton>
      <div className={'admin-title'}>
        {t.create} {t.project}
      </div>
      <DataForm
        action={createProjectAction}
        className={'member-data-grid gap-2'}
      >
        <input
          hidden={true}
          name={'generationId'}
          readOnly={true}
          value={String(resolvedScope.selectedGeneration.id)}
        />
        <div
          className={
            'member-data-col-span col-span-1 grid grid-cols-1 gap-2 sm:col-span-3 sm:grid-cols-2 md:col-span-4'
          }
        >
          <div>
            <DataImageInput
              title={t.mainImage}
              name={'mainImage'}
              baseUrl={'/api/admin/projects/main-image'}
            >
              {t.selectImage}
            </DataImageInput>
          </div>
          <div>
            <DataMultipleImageInput
              baseUrl={'/api/admin/projects/content-image'}
              name={'contentImages'}
              title={t.contentImages}
            >
              {t.selectImage}
            </DataMultipleImageInput>
          </div>
        </div>
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
                title={t.nameEn}
                defaultValue={''}
                name={'name'}
                placeholder={t.nameEn}
              />
            }
            koContent={
              <DataInput
                title={t.nameKo}
                defaultValue={''}
                name={'nameKo'}
                placeholder={t.nameKo}
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
              <DataTextarea
                defaultValue={''}
                name={'description'}
                placeholder={t.descriptionEn}
              />
            }
            koContent={
              <DataTextarea
                defaultValue={''}
                name={'descriptionKo'}
                placeholder={t.descriptionKo}
              />
            }
          />
        </div>
        <div className={'member-data-box col-span-1 sm:col-span-2 md:col-span-3 lg:col-span-4'}>
          <div className={'member-data-title'}>{t.generation}</div>
          <div className={'member-data-content'}>
            {resolvedScope.selectedGeneration.name}
          </div>
        </div>
        <MembersSelectInput members={membersList} defaultValue={[]} />
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
                placeholder={'Write the project content in English.'}
              />
            }
            koContent={
              <MDXEditor
                title={t.contentKo}
                name={'contentKo'}
                placeholder={'프로젝트 내용을 한국어로 작성하세요.'}
              />
            }
          />
        </div>
        <SubmitButton />
      </DataForm>
    </AdminDefaultLayout>
  )
}
