'use client'

import { useState } from 'react'
import QRCode from 'react-qr-code'
import { QrCodeIcon } from '@heroicons/react/24/outline'
import { useAdminI18n } from '@/app/components/admin/admin-i18n-provider'

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
