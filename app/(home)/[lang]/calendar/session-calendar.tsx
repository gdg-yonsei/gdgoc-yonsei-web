'use client'

import { useState, useSyncExternalStore } from 'react'
import Link from 'next/link'
import ChevronLeftIcon from '@heroicons/react/24/outline/ChevronLeftIcon'
import ChevronRightIcon from '@heroicons/react/24/outline/ChevronRightIcon'
import type { Locale } from '@/lib/i18n'
import Chip from '@/app/components/site/chip'
import {
  eventsInMonth,
  eventsOnDay,
  monthOfDay,
  monthWeeks,
  shiftMonth,
  type CalendarEvent,
} from '@/lib/site/calendar'
import {
  formatMonthKey,
  formatSessionLongDate,
  toSeoulDateIso,
} from '@/lib/format/datetime'
import { partHue } from '@/lib/site/labels'
import type { CalendarWidgetCopy } from '@/lib/contents/calendar-copy'
import { countLabel, fillTemplate } from '@/lib/format/text'

function sessionCount(copy: CalendarWidgetCopy, count: number) {
  return count === 0
    ? copy.countNone
    : countLabel(count, copy.countOne, copy.countMany)
}

/** 날짜 칸 하나에 보일 최대 일정 수. 넘치면 "+n개 더"로 접는다. */
const CELL_LIMIT = 2

const subscribeNever = () => () => {}
const readSeoulToday = () => toSeoulDateIso(new Date())

const longDate = (day: string, lang: Locale) =>
  formatSessionLongDate(new Date(`${day}T00:00:00Z`), lang)

/* 캐시 가능한 서버 셸은 한 시간 단위 serverToday의 달을 표시하고, 하이드레이션 뒤에는 실제 서울 날짜로 바꾼다. */
export default function SessionCalendar({
  lang,
  copy: t,
  events,
  serverToday,
}: {
  lang: Locale

  copy: CalendarWidgetCopy
  events: CalendarEvent[]
  serverToday: string
}) {
  const today = useSyncExternalStore(
    subscribeNever,
    readSeoulToday,
    () => serverToday
  )
  const [pickedMonth, setPickedMonth] = useState<string | null>(null)
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const month = pickedMonth ?? monthOfDay(today)

  const showMonth = (next: string) => {
    setPickedMonth(next)
    setSelectedDay(null)
  }

  const agenda = selectedDay
    ? eventsOnDay(events, selectedDay)
    : eventsInMonth(events, month)

  return (
    <section className="calendar" aria-labelledby="calendar-month">
      <div className="calendar-toolbar">
        <h2 id="calendar-month" className="calendar-month" aria-live="polite">
          {formatMonthKey(month, lang)}
        </h2>
        <div className="calendar-nav">
          <button
            type="button"
            className="calendar-nav-button"
            aria-label={t.previous}
            onClick={() => showMonth(shiftMonth(month, -1))}
          >
            <ChevronLeftIcon aria-hidden="true" className="size-5" />
          </button>
          <button
            type="button"
            className="calendar-today-button"
            onClick={() => {
              showMonth(monthOfDay(today))
              setSelectedDay(today)
            }}
          >
            {t.today}
          </button>
          <button
            type="button"
            className="calendar-nav-button"
            aria-label={t.next}
            onClick={() => showMonth(shiftMonth(month, 1))}
          >
            <ChevronRightIcon aria-hidden="true" className="size-5" />
          </button>
        </div>
      </div>

      <table className="calendar-grid">
        <thead>
          <tr>
            {t.weekdays.map((weekday) => (
              <th key={weekday} scope="col">
                {weekday}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {monthWeeks(month).map((week) => (
            <tr key={week[0]}>
              {week.map((day) => {
                const dayEvents = eventsOnDay(events, day)
                const hidden = dayEvents.length - CELL_LIMIT

                return (
                  <td
                    key={day}
                    className="calendar-day"
                    data-outside={monthOfDay(day) !== month || undefined}
                    data-today={day === today || undefined}
                    data-selected={day === selectedDay || undefined}
                  >
                    <button
                      type="button"
                      className="calendar-day-button"
                      aria-label={`${longDate(day, lang)}, ${sessionCount(t, dayEvents.length)}`}
                      aria-pressed={day === selectedDay}
                      aria-current={day === today ? 'date' : undefined}
                      onClick={() => {
                        if (monthOfDay(day) !== month)
                          setPickedMonth(monthOfDay(day))
                        setSelectedDay(day === selectedDay ? null : day)
                      }}
                    >
                      <span className="calendar-day-number">
                        {Number(day.slice(8))}
                      </span>
                      {dayEvents.length > 0 && (
                        <span aria-hidden="true" className="calendar-dots">
                          {dayEvents.slice(0, 3).map((event) => (
                            <span
                              key={event.id}
                              className="calendar-dot"
                              data-hue={event.hue}
                            />
                          ))}
                        </span>
                      )}
                    </button>
                    {dayEvents.length > 0 && (
                      <ul aria-hidden="true" className="calendar-cell-events">
                        {dayEvents.slice(0, CELL_LIMIT).map((event) => (
                          <li
                            key={event.id}
                            className="calendar-cell-event"
                            data-hue={event.hue}
                            data-scheduled={!event.href || undefined}
                          >
                            {event.startDay === day && (
                              <span className="calendar-cell-time">
                                {event.startTime}
                              </span>
                            )}
                            <span className="calendar-cell-title">
                              {event.title}
                            </span>
                          </li>
                        ))}
                        {hidden > 0 && (
                          <li className="calendar-cell-more">
                            {fillTemplate(t.more, { count: hidden })}
                          </li>
                        )}
                      </ul>
                    )}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>

      <div className="calendar-agenda">
        <div className="calendar-agenda-head">
          <h3 id="calendar-agenda-title" className="calendar-agenda-title">
            {selectedDay
              ? longDate(selectedDay, lang)
              : formatMonthKey(month, lang)}
          </h3>
          {selectedDay && (
            <button
              type="button"
              className="calendar-agenda-reset"
              onClick={() => setSelectedDay(null)}
            >
              {t.wholeMonth}
            </button>
          )}
        </div>
        {agenda.length === 0 ? (
          <p className="calendar-agenda-empty">
            {selectedDay ? t.dayEmpty : t.monthEmpty}
          </p>
        ) : (
          <ol
            className="calendar-agenda-list"
            aria-labelledby="calendar-agenda-title"
          >
            {agenda.map((event) => (
              <AgendaEntry
                key={event.id}
                event={event}
                lang={lang}
                scheduledLabel={t.scheduled}
              />
            ))}
          </ol>
        )}
      </div>
    </section>
  )
}

function AgendaEntry({
  event,
  lang,
  scheduledLabel,
}: {
  event: CalendarEvent
  lang: Locale
  scheduledLabel: string
}) {
  const days =
    event.endDay === event.startDay
      ? longDate(event.startDay, lang)
      : `${longDate(event.startDay, lang)} – ${longDate(event.endDay, lang)}`
  const time = event.endTime
    ? `${event.startTime}–${event.endTime}`
    : event.startTime

  return (
    <li
      className="calendar-entry"
      data-hue={event.hue}
      data-scheduled={!event.href || undefined}
    >
      <p className="calendar-entry-when">
        <time dateTime={event.dateTime}>{days}</time> · {time}
      </p>
      <p className="calendar-entry-title">
        {event.href ? (
          <Link href={event.href} transitionTypes={['nav-forward']}>
            {event.title}
          </Link>
        ) : (
          event.title
        )}
      </p>
      <div className="calendar-entry-meta">
        {!event.href && <Chip>{scheduledLabel}</Chip>}
        <Chip hue={event.hue}>{event.categoryLabel}</Chip>
        {event.partName && (
          <Chip hue={partHue(event.partName)}>{event.partName}</Chip>
        )}
        {event.location && <span>{event.location}</span>}
      </div>
    </li>
  )
}
