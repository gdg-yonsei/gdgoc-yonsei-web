'use client'

import {
  ArrowDownTrayIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline'

export type AdminTableSelectControl = {
  id: string
  label?: string
  value: string
  options: Array<{
    label: string
    value: string
  }>
  onChange: (value: string) => void
}

export default function AdminTableToolbar({
  searchValue,
  searchPlaceholder,
  sortControl,
  filterControls = [],
  exportLabel,
  onSearchChange,
  onExportCsv,
}: {
  searchValue: string
  searchPlaceholder: string
  sortControl: AdminTableSelectControl
  filterControls?: AdminTableSelectControl[]
  exportLabel: string
  onSearchChange: (value: string) => void
  onExportCsv: () => void
}) {
  return (
    <div
      className={
        'flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between'
      }
    >
      <div className={'flex flex-1 flex-col gap-3 md:flex-row md:items-center'}>
        <div className={'relative w-full flex-1'}>
          <MagnifyingGlassIcon
            className={
              'absolute top-1/2 left-3 size-5 -translate-y-1/2 text-neutral-400'
            }
          />
          <input
            type={'text'}
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            className={
              'w-full rounded-xl border border-neutral-200 py-2 pr-4 pl-10 text-sm transition-all outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900'
            }
          />
        </div>

        {filterControls.length > 0 && (
          <div
            className={
              'grid w-full grid-cols-2 gap-2 md:flex md:w-auto md:flex-row md:items-center'
            }
          >
            {filterControls.map((control) => (
              <select
                key={control.id}
                aria-label={control.label ?? control.id}
                value={control.value}
                onChange={(event) => control.onChange(event.target.value)}
                className={
                  'w-full rounded-xl border border-neutral-200 p-2 text-sm transition-all outline-none focus:border-neutral-900 md:w-auto'
                }
              >
                {control.options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ))}
          </div>
        )}

        <div
          className={
            'flex w-full items-center justify-between gap-2 border-t border-neutral-100 pt-2 md:w-auto md:border-t-0 md:pt-0'
          }
        >
          {sortControl.label && (
            <span className={'text-xs whitespace-nowrap text-neutral-500'}>
              {sortControl.label}
            </span>
          )}
          <select
            aria-label={sortControl.label ?? sortControl.id}
            value={sortControl.value}
            onChange={(event) => sortControl.onChange(event.target.value)}
            className={
              'w-full rounded-xl border border-neutral-200 p-2 text-sm transition-all outline-none focus:border-neutral-900 md:w-auto'
            }
          >
            {sortControl.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <button
        type={'button'}
        onClick={onExportCsv}
        className={
          'flex w-full items-center justify-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-medium text-neutral-700 shadow-sm transition-all hover:bg-neutral-50 active:scale-95 lg:w-auto'
        }
      >
        <ArrowDownTrayIcon className={'size-4'} />
        <span>{exportLabel}</span>
      </button>
    </div>
  )
}
