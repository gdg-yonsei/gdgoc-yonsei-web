'use client'

import { useState } from 'react'
import QRCode from 'react-qr-code'

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
