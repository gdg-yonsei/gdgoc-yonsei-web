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
      className={
        'member-data-col-span col-span-1 grid grid-cols-1 gap-2 sm:col-span-3 sm:grid-cols-2 md:col-span-4'
      }
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
