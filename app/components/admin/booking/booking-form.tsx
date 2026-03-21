'use client'

import { useState } from 'react'
import DataInput from '@/app/components/admin/data-input'
import SubmitButton from '@/app/components/admin/submit-button'
import { requestBookingAction } from '@/lib/server/actions/booking/request-booking'
import venuesDataRaw from './venues.json'
import Link from 'next/link'

// Type cast the imported json
const venuesData = venuesDataRaw as {
  [campus: string]: {
    buildings: string[]
    rooms: {
      id: string
      building: string
      name: string
      capacity: string
    }[]
  }
}

function generateTimeOptions(): { label: string; value: string }[] {
  const options: { label: string; value: string }[] = []
  for (let hour = 8; hour <= 22; hour++) {
    for (let min = 0; min < 60; min += 10) {
      if (hour === 22 && min > 0) break
      const h = hour.toString().padStart(2, '0')
      const m = min.toString().padStart(2, '0')
      options.push({ label: `${h}:${m}`, value: `${h}:${m}` })
    }
  }
  return options
}

const timeOptions = generateTimeOptions()

export default function BookingForm() {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<boolean>(false)

  const [selectedCampus, setSelectedCampus] = useState<string>('신촌캠퍼스')
  const [selectedBuilding, setSelectedBuilding] = useState<string>(
    venuesData['신촌캠퍼스']?.buildings[0] || ''
  )

  const [startDate, setStartDate] = useState('')
  const [startTime, setStartTime] = useState('08:00')
  const [endDate, setEndDate] = useState('')
  const [endTime, setEndTime] = useState('08:00')

  async function handleSubmit(formData: FormData) {
    setError(null)
    setSuccess(false)

    if (!startDate || !endDate) {
      setError('날짜를 선택해주세요.')
      return
    }

    formData.set('campus', selectedCampus)
    formData.set('startTime', `${startDate}T${startTime}`)
    formData.set('endTime', `${endDate}T${endTime}`)

    const result = await requestBookingAction(formData)

    if (result.success) {
      setSuccess(true)
    } else {
      setError(result.error || 'Failed to request booking.')
    }
  }

  return (
    <div className="flex w-full flex-col gap-6 rounded-2xl bg-neutral-100 p-6 md:w-fit">
      <h2 className="text-xl font-bold">대관 예약 신청</h2>
      <p className="text-sm text-neutral-600">
        연세대학교 공관 대관 시스템 공간 대관 예약
      </p>
      <p className="text-sm text-neutral-600">
        장소의 공실 여부는{' '}
        <Link href={'https://space.yonsei.ac.kr'} target={'_blank'}>
          https://space.yonsei.ac.kr
        </Link>
        에 접속해서 미리 확인해야 합니다.
      </p>

      {error && (
        <div className="rounded-xl bg-red-100 p-4 text-sm text-red-700">
          오류: {error}
        </div>
      )}
      {success && (
        <div className="rounded-xl bg-green-100 p-4 text-sm text-green-700">
          신청이 접수되었습니다! 예약 스케줄러가 자동으로 실행됩니다.
        </div>
      )}

      <form action={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col">
          <p className="px-1 text-sm font-semibold text-neutral-700">캠퍼스</p>
          <select
            className="member-data-input"
            value={selectedCampus}
            onChange={(e) => {
              const val = e.target.value
              setSelectedCampus(val)
              if (venuesData && venuesData[val]?.buildings.length > 0) {
                setSelectedBuilding(venuesData[val].buildings[0])
              } else {
                setSelectedBuilding('')
              }
            }}
          >
            <option value="신촌캠퍼스">신촌캠퍼스</option>
            <option value="국제캠퍼스">국제캠퍼스</option>
          </select>
        </div>

        <div className="flex flex-col">
          <p className="px-1 text-sm font-semibold text-neutral-700">
            건물 (예: 학생회관)
          </p>
          <select
            name="building"
            className="member-data-input"
            value={selectedBuilding}
            onChange={(e) => setSelectedBuilding(e.target.value)}
            required
          >
            {venuesData?.[selectedCampus]?.buildings.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col">
          <p className="px-1 text-sm font-semibold text-neutral-700">
            공간 이름
          </p>
          <select name="roomName" className="member-data-input" required>
            {venuesData?.[selectedCampus]?.rooms
              .filter((r) => r.building.startsWith(selectedBuilding))
              .map((r) => (
                <option key={r.id} value={r.name}>
                  {r.name} ({r.building}) [{r.capacity}]
                </option>
              ))}
          </select>
        </div>

        <div className="flex flex-col">
          <p className="px-1 text-sm font-semibold text-neutral-700">
            시작 날짜
          </p>
          <input
            type="date"
            className="member-data-input"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value)
              if (!endDate) setEndDate(e.target.value)
            }}
            required
          />
        </div>

        <div className="flex flex-col">
          <p className="px-1 text-sm font-semibold text-neutral-700">
            시작 시간
          </p>
          <select
            className="member-data-input"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            required
          >
            {timeOptions.map((t) => (
              <option key={`start-${t.value}`} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col">
          <p className="px-1 text-sm font-semibold text-neutral-700">
            종료 날짜
          </p>
          <input
            type="date"
            className="member-data-input"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            required
          />
        </div>

        <div className="flex flex-col">
          <p className="px-1 text-sm font-semibold text-neutral-700">
            종료 시간
          </p>
          <select
            className="member-data-input"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            required
          >
            {timeOptions.map((t) => (
              <option key={`end-${t.value}`} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <DataInput
          title="행사 이름 (예: GDGoC 정기 세션)"
          name="eventName"
          placeholder="GDGoC 정기 세션"
          defaultValue=""
          required
        />

        <div className="flex flex-col">
          <p className="px-1 text-sm font-semibold text-neutral-700">
            행사 유형
          </p>
          <select name="eventType" className="member-data-input" required>
            <option value="행사 및 회의">행사 및 회의</option>
            <option value="기타">기타</option>
          </select>
        </div>

        <DataInput
          title="예상 참석 인원"
          name="attendees"
          placeholder="10"
          type="number"
          defaultValue={10}
          required
        />
        <DataInput
          title="연락처 (예: 010-1234-5678)"
          name="contactPhone"
          placeholder="010-0000-0000"
          defaultValue=""
          required
        />

        <SubmitButton className="mt-4 w-full rounded-xl bg-blue-600 p-3 text-white transition-all hover:bg-blue-700">
          예약 신청하기
        </SubmitButton>
      </form>
    </div>
  )
}
