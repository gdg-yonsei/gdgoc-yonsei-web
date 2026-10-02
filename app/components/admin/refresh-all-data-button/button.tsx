'use client'

/**
 * 캐시 새로고침 제출 버튼(클라이언트 컴포넌트). 제출 중에는 스피너를 보여 준다.
 */
import { useFormStatus } from 'react-dom'
import LoadingSpinner from '@/app/components/admin/loading-spinner'
import { ArrowPathIcon } from '@heroicons/react/24/outline'
import { useAdminI18n } from '@/app/components/admin/admin-i18n-provider'

/** 아이콘만 있는 제출 버튼. 라벨은 접근 가능한 이름과 툴팁으로 제공한다. */
export default function RefreshDataSubmitButton() {
  const { pending } = useFormStatus()
  const { t } = useAdminI18n()

  return (
    // 사이드바 하단은 세로 공간이 빠듯해 아이콘만 보여 주고, 라벨은 접근 가능한
    // 이름과 툴팁으로 제공한다.
    <button
      type={'submit'}
      className={'admin-btn-secondary size-9 min-h-9 shrink-0 px-0'}
      disabled={pending}
      aria-label={pending ? t('refreshing') : t('refreshCacheData')}
      title={pending ? t('refreshing') : t('refreshCacheData')}
    >
      {pending ? (
        <LoadingSpinner
          className={'size-4 border-2 border-current/30 border-t-current'}
        />
      ) : (
        <ArrowPathIcon className={'size-4'} aria-hidden={'true'} />
      )}
    </button>
  )
}
