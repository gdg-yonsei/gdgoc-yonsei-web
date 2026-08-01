'use client'

import { useState } from 'react'
import QRCode from 'react-qr-code'
import { QrCodeIcon } from '@heroicons/react/24/outline'
import { useAdminI18n } from '@/app/components/admin/admin-i18n-provider'

/**
 * `QRCodeGenerator` 컴포넌트는 전달받은 props와 현재 상태를 기반으로 화면(UI)을 구성하여 렌더링합니다.
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
export default function QRCodeGenerator() {
  const [value, setValue] = useState('')
  const { t } = useAdminI18n()
  return (
    <div className={'admin-card flex w-full flex-col gap-4'}>
      <h3 className={'type-title text-ink flex items-center gap-2'}>
        <QrCodeIcon className={'text-ink-muted size-5'} aria-hidden={'true'} />
        {t('qrCodeGenerator')}
      </h3>
      <div className={'flex justify-center'}>
        {value ? (
          <QRCode value={value} className={'size-56'} />
        ) : (
          <div
            className={
              'border-hairline bg-surface-sunken size-56 rounded-md border border-dashed'
            }
          />
        )}
      </div>
      <div className={'flex flex-col gap-1.5'}>
        <input
          type={'text'}
          aria-label={t('qrCodeGenerator')}
          placeholder={t('qrValuePlaceholder')}
          className={'admin-input'}
          onChange={(e) => {
            if (e.target.value.length < 23648) {
              setValue(e.target.value)
            } else {
              alert(t('qrTooLong'))
            }
          }}
        />
        <p className={'type-caption text-ink-muted'}>{t('qrCaptureHint')}</p>
      </div>
    </div>
  )
}
