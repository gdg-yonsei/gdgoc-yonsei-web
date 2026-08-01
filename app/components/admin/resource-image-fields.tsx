import DataImageInput from '@/app/components/admin/data-image-input'
import DataMultipleImageInput from '@/app/components/admin/data-multiple-image-input'
import { type AdminMessages } from '@/lib/admin-i18n'

export default function ResourceImageFields({
  mainImageBaseUrl,
  contentImageBaseUrl,
  mainImageDefaultValue,
  contentImagesDefaultValue = [],
  t,
}: {
  mainImageBaseUrl: string
  contentImageBaseUrl: string
  mainImageDefaultValue?: string | null
  contentImagesDefaultValue?: string[]
  t: AdminMessages
}) {
  return (
    <div
      className={'admin-form-grid-full grid grid-cols-1 gap-2 sm:grid-cols-2'}
    >
      <div>
        <DataImageInput
          title={t.mainImage}
          name={'mainImage'}
          baseUrl={mainImageBaseUrl}
          defaultValue={mainImageDefaultValue ?? undefined}
        >
          {t.selectImage}
        </DataImageInput>
      </div>
      <div>
        <DataMultipleImageInput
          baseUrl={contentImageBaseUrl}
          name={'contentImages'}
          title={t.contentImages}
          defaultValue={contentImagesDefaultValue}
        >
          {t.selectImage}
        </DataMultipleImageInput>
      </div>
    </div>
  )
}
