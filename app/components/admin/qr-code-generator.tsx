'use client'

import { useState } from 'react'
import QRCode from 'react-qr-code'

export default function QRCodeGenerator() {
  const [value, setValue] = useState('')
  return (
    <div
      className={
        'flex w-full flex-col items-center justify-center gap-8 rounded-xl bg-white p-4'
      }
    >
      <h2 className={'mr-auto text-xl font-semibold'}>QR Code Generator</h2>
      {value ? (
        <QRCode value={value} className={'size-64'} />
      ) : (
        <div className={'size-64 rounded-lg bg-neutral-200'} />
      )}
      <div className={'flex flex-col items-center justify-center gap-1'}>
        <input
          type={'text'}
          placeholder={'Please enter the value.'}
          className={
            'w-full rounded-full border-sky-500 bg-neutral-100 p-2 px-4 focus:border-2 focus:outline-none'
          }
          onChange={(e) => {
            if (e.target.value.length < 23648) {
              setValue(e.target.value)
            } else {
              alert('The value is too long. Please enter a shorter value.')
            }
          }}
        />
        <p>Please capture the QR Code and use it.</p>
      </div>
    </div>
  )
}
