'use client'

/**
 * 입력한 문자열로 QR 코드를 만드는 관리자 홈 도구(클라이언트 컴포넌트). 세션 출석 링크 공유 등에 쓴다.
 */
import { useState } from 'react'
import QRCode from 'react-qr-code'
import { QrCodeIcon } from '@heroicons/react/24/outline'
import { useAdminI18n } from '@/app/components/admin/admin-i18n-provider'

/**
 * 입력값 길이 상한. QR 최대 버전(40)의 데이터 용량이 23,648비트라 그 이상은 확실히
 * 인코딩할 수 없다. 실제 한계는 문자 종류에 따라 더 작으므로 대략적인 방어선이다.
 */
const MAX_QR_VALUE_LENGTH = 23648

/** 입력창에 적은 값을 바로 QR 코드로 그린다. 너무 길면 경고만 띄우고 이전 값을 유지한다. */
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
            if (e.target.value.length < MAX_QR_VALUE_LENGTH) {
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
