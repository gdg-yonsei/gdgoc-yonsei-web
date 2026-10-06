import DataInput from '@/app/components/admin/data-input'
import GenerationField from '@/app/components/admin/generation-field'
import MembersSelectInput, {
  type ProjectMemberOption,
} from '@/app/components/admin/member-select-input'
import ResourceImageFields from '@/app/components/admin/resource-image-fields'
import TagsInput from '@/app/components/admin/tags-input'
import {
  BilingualInputField,
  BilingualMdxField,
  BilingualTextareaField,
} from '@/app/components/admin/bilingual-fields'
import type { AdminMessages } from '@/lib/admin-i18n'
import type { getProject } from '@/lib/server/fetcher/admin/get-project'

type SavedProject = NonNullable<Awaited<ReturnType<typeof getProject>>>

export default function ProjectFormFields({
  t,
  generation,
  members,
  tagNames,
  project,
}: {
  t: AdminMessages
  generation: { id: number | null; name: string | null | undefined }
  members: ProjectMemberOption[]
  tagNames: string[]
  project?: SavedProject
}) {
  return (
    <>
      <ResourceImageFields
        mainImageBaseUrl={'/api/admin/projects/main-image'}
        contentImageBaseUrl={'/api/admin/projects/content-image'}
        mainImageDefaultValue={project?.mainImage}
        contentImagesDefaultValue={project?.images}
        t={t}
      />
      <BilingualInputField
        t={t}
        fieldLabel={t.name}
        enName={'name'}
        koName={'nameKo'}
        enTitle={t.nameEn}
        koTitle={t.nameKo}
        enPlaceholder={t.nameEn}
        koPlaceholder={t.nameKo}
        enDefaultValue={project?.name}
        koDefaultValue={project?.nameKo}
      />
      <BilingualTextareaField
        t={t}
        fieldLabel={t.description}
        enName={'description'}
        koName={'descriptionKo'}
        enPlaceholder={t.descriptionEn}
        koPlaceholder={t.descriptionKo}
        enDefaultValue={project?.description}
        koDefaultValue={project?.descriptionKo}
      />
      <DataInput
        title={'Repository URL'}
        defaultValue={project?.repoUrl ?? null}
        name={'repoUrl'}
        placeholder={'https://github.com/gdg-yonsei/...'}
        type={'url'}
      />
      <DataInput
        title={'Demo URL'}
        defaultValue={project?.demoUrl ?? null}
        name={'demoUrl'}
        placeholder={'https://...'}
        type={'url'}
      />
      <TagsInput
        defaultValue={project?.projectsToTags.map(({ tag }) => tag.name) ?? []}
        suggestions={tagNames}
      />
      <GenerationField
        title={t.generation}
        value={generation.name}
        inputName={'generationId'}
        inputValue={generation.id}
      />
      <MembersSelectInput
        members={members}
        defaultValue={
          project?.usersToProjects.map(({ userId }) => userId) ?? []
        }
      />
      <BilingualMdxField
        t={t}
        fieldLabel={t.content}
        enName={'content'}
        koName={'contentKo'}
        enTitle={t.contentEn}
        koTitle={t.contentKo}
        enPlaceholder={'Write the project content in English.'}
        koPlaceholder={'프로젝트 내용을 한국어로 작성하세요.'}
        enDefaultValue={project?.content}
        koDefaultValue={project?.contentKo}
      />
    </>
  )
}
