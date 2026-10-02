/**
 * 대표 이미지 1장 + 본문 이미지 여러 장 입력 묶음. 세션·프로젝트 생성/수정 폼이 함께 쓴다.
 */
import DataImageInput from '@/app/components/admin/data-image-input'
import DataMultipleImageInput from '@/app/components/admin/data-multiple-image-input'
import { type AdminMessages } from '@/lib/admin-i18n'

/**
 * 대표 이미지(`mainImage`)와 본문 이미지(`contentImages`, JSON 배열) 필드.
 *
 * @param mainImageBaseUrl/contentImageBaseUrl 각 이미지의 업로드 API 경로
 * @param t 관리자 번역 사전(서버 컴포넌트 폼에서 넘김)
 */
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
