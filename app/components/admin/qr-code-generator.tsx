'use client'

import { useState } from 'react'
import QRCode from 'react-qr-code'

export default function QRCodeGenerator() {
  const [value, setValue] = useState('')
  return (
    <div
      className={
        'w-full p-4 rounded-xl bg-white flex flex-col items-center justify-center gap-8'
      }
    >
      <h2 className={'text-xl font-semibold mr-auto'}>QR Code Generator</h2>
      {value ? (
        <QRCode value={value} className={'size-64'} />
      ) : (
        <div className={'size-64 bg-neutral-200 rounded-lg'} />
      )}
      <div className={'flex flex-col items-center justify-center gap-1'}>
        <input
          type={'text'}
          placeholder={'Please enter the value.'}
          className={
            'p-2 px-4 rounded-full focus:outline-none focus:ring-2 ring-sky-500 bg-neutral-100 w-full'
          }
          onChange={(e) => setValue(e.target.value)}
        />
        <p>Please capture the QR Code and use it.</p>
      </div>
    </div>
  )
}
