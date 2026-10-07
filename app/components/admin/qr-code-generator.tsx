'use client'

import { useId, useState } from 'react'
import QRCode from 'react-qr-code'
import { QrCodeIcon } from '@heroicons/react/24/outline'
import { useAdminI18n } from '@/app/components/admin/admin-i18n-provider'

/** QR 버전 40의 최대 용량 23,648비트를 대략적인 입력 상한으로 쓴다. 문자 종류에 따라 실제 한계는 더 작다. */
const MAX_QR_VALUE_LENGTH = 23648

export default function QRCodeGenerator() {
  const [value, setValue] = useState('')
  const { t } = useAdminI18n()
  const inputId = useId()
  const errorId = useId()
  const tooLong = value.length >= MAX_QR_VALUE_LENGTH
  return (
    <div className={'admin-card flex w-full flex-col gap-4'}>
      <h3 className={'type-title text-ink flex items-center gap-2'}>
        <QrCodeIcon className={'text-ink-muted size-5'} aria-hidden={'true'} />
        {t('qrCodeGenerator')}
      </h3>
      <div className={'flex flex-col gap-1.5'}>
        <label htmlFor={inputId} className={'admin-field-label'}>
          {t('qrValueLabel')}
        </label>
        <input
          id={inputId}
          type={'text'}
          className={'admin-input'}
          aria-invalid={tooLong}
          aria-describedby={tooLong ? errorId : undefined}
          onChange={(e) => setValue(e.target.value)}
        />
      </div>
      <div className={'flex justify-center'}>
        {value && !tooLong ? (
          <QRCode value={value} className={'size-56'} />
        ) : (
          <div
            className={
              'border-hairline bg-surface-sunken type-caption flex size-56 items-center justify-center rounded-md border border-dashed p-4 text-center'
            }
          >
            {tooLong ? (
              <p id={errorId} role={'alert'} className={'text-danger'}>
                {t('qrTooLong')}
              </p>
            ) : (
              <p className={'text-ink-muted'}>{t('qrEmpty')}</p>
            )}
          </div>
        )}
      </div>
      {value && !tooLong && (
        <p className={'type-caption text-ink-muted'}>{t('qrCaptureHint')}</p>
      )}
    </div>
  )
}
