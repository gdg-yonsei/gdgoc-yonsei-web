'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * Data Multiple Select Input Component
 *
 * input 데이터는 리스트 형태를 JSON 문자열로 변환하여 input 에 저장
 *
 * 이후 활용할 때 JSON.parse 를 통해 데이터를 추출하여 사용 필요
 * @param data - data list
 * @param name - input name
 * @param title - input title
 * @param defaultValue - default value
 * @constructor
 */
export default function DataSelectMultipleInput({
  data,
  name,
  title,
  defaultValue,
}: {
  data: { name: string; value: string }[]
  name: string
  title: string
  defaultValue: string[]
}) {
  // input ref
  const inputRef = useRef<HTMLInputElement>(null)
  // multiple value state
  const [value, setValue] = useState(defaultValue)

  // handle click event
  /**
   * `handleClick` 함수는 전달받은 입력값을 바탕으로 필요한 비즈니스 로직을 수행합니다.
   *
   * 구동 원리:
   * 1. 입력값(`data`, `string`)을 기준으로 전처리/검증 또는 조회 조건을 구성합니다.
   * 2. 함수 본문의 조건 분기와 동기/비동기 로직을 순서대로 실행합니다.
   * 3. 계산 결과를 반환하거나 캐시/DB/리다이렉트 등 필요한 부수 효과를 반영합니다.
   *
   * 작동 결과:
   * - 호출부에서 즉시 활용 가능한 결과값 또는 실행 상태를 제공합니다.
   * - 후속 로직이 안정적으로 이어질 수 있도록 일관된 동작을 보장합니다.
   */
  function handleClick(data: string) {
    // if value includes data, remove data from value
    if (value.includes(data)) {
      setValue(value.filter((v) => v !== data))
    } else {
      // if value does not include data, add data to value
      setValue([...value, data])
    }
  }

  useEffect(() => {
    // if input ref exists, set value to input
    if (inputRef.current) {
      inputRef.current.value = JSON.stringify(value)
    }
  }, [value])

  return (
    <div
      className={
        'col-span-1 flex flex-col gap-2 sm:col-span-2 md:col-span-3 lg:col-span-4'
      }
    >
      <div className={'member-data-title'}>{title}</div>
      <input name={name} hidden={true} ref={inputRef} />
      <div className={'member-data-grid gap-2'}>
        {data.map((d, i) => (
          <button
            type={'button'}
            key={i}
            className={`rounded-xl p-2 px-4 ${value.includes(d.value) ? 'bg-neutral-900 text-white' : 'bg-white'}`}
            onClick={() => handleClick(d.value)}
          >
            {d.name}
          </button>
        ))}
      </div>
    </div>
  )
}
