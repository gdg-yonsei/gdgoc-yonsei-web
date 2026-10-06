'use client'

import { useState, useSyncExternalStore } from 'react'
import MagnifyingGlassIcon from '@heroicons/react/24/outline/MagnifyingGlassIcon'
import XMarkIcon from '@heroicons/react/24/outline/XMarkIcon'
import { countLabel } from '@/lib/format/text'
import {
  EMPTY_FILTER,
  isFilterActive,
  createFilterMatcher,
  parseFilterState,
  readFilterableItem,
  serializeFilterState,
  toggleFacetValue,
  type FacetMode,
  type FacetOption,
  type FilterBarCopy,
  type FilterState,
} from '@/lib/site/filter-state'

/** 필터 묶음 하나(예: 기수, 태그). `mode`는 여러 값을 OR(`any`)로 볼지 AND(`all`)로 볼지. */
export type FilterFacet = {
  key: string
  legend: string
  mode?: FacetMode
  options: FacetOption[]
}

/* URL 쿼리를 외부 스토어로 읽고 서버 렌더링 행의 hidden 속성을 갱신한다.
 * 행 데이터를 RSC payload에 중복으로 싣거나 effect에서 state를 바꾸지 않는다. */

/** `history.replaceState`는 이벤트를 내지 않으므로, 필터를 바꿀 때 직접 쏘는 사용자 정의 이벤트. */
const FILTER_EVENT = 'site:filterchange'

type Snapshot = { search: string; visible: number }

/** 모든 행이 숨은 그룹도 숨기고, 뒤로·앞으로 가기와 필터 변경 이벤트에 반응한다. */
function createFilterStore(
  scope: string,
  keys: readonly string[],
  modes: Readonly<Record<string, FacetMode>>,
  total: number
) {
  const serverSnapshot: Snapshot = { search: '', visible: total }
  let snapshot = serverSnapshot
  const listeners = new Set<() => void>()

  function apply() {
    const search = window.location.search
    const matches = createFilterMatcher(parseFilterState(search, keys), modes)
    const root = document.getElementById(scope)
    let visible = root ? 0 : total

    root
      ?.querySelectorAll<HTMLElement>('[data-filter-item]')
      .forEach((item) => {
        const show = matches(readFilterableItem(item, keys))
        item.hidden = !show
        if (show) visible += 1
      })
    root
      ?.querySelectorAll<HTMLElement>('[data-filter-group]')
      .forEach((group) => {
        group.hidden =
          group.querySelector('[data-filter-item]:not([hidden])') === null
      })

    if (search !== snapshot.search || visible !== snapshot.visible) {
      snapshot = { search, visible }
      listeners.forEach((listener) => listener())
    }
  }

  return {
    subscribe: (listener: () => void) => {
      listeners.add(listener)
      if (listeners.size === 1) {
        window.addEventListener('popstate', apply)
        window.addEventListener(FILTER_EVENT, apply)
      }
      apply()
      return () => {
        listeners.delete(listener)
        if (listeners.size === 0) {
          window.removeEventListener('popstate', apply)
          window.removeEventListener(FILTER_EVENT, apply)
        }
      }
    },
    getSnapshot: () => snapshot,
    getServerSnapshot: () => serverSnapshot,
  }
}

/** 필터 상태를 URL에 반영(기록을 쌓지 않고 교체)하고 스토어에 알린다. */
function commit(state: FilterState, keys: readonly string[]) {
  const { pathname, hash } = window.location
  window.history.replaceState(
    window.history.state,
    '',
    `${pathname}${serializeFilterState(state, keys)}${hash}`
  )
  window.dispatchEvent(new Event(FILTER_EVENT))
}

/** scope는 목록 id이며, total은 서버 렌더링·하이드레이션 전 결과 수다. */
export default function FilterBar({
  scope,
  facets,
  copy,
  total,
}: {
  scope: string
  facets: FilterFacet[]
  copy: FilterBarCopy
  total: number
}) {
  const keys = facets.map((facet) => facet.key)
  const [store] = useState(() =>
    createFilterStore(
      scope,
      keys,
      Object.fromEntries(
        facets.map((facet) => [facet.key, facet.mode ?? 'any'])
      ),
      total
    )
  )
  const { search, visible } = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getServerSnapshot
  )
  const state = parseFilterState(search, keys)

  return (
    <div role="search" aria-label={copy.label} className="filter-bar">
      <label className="filter-search">
        <MagnifyingGlassIcon aria-hidden="true" className="size-4 flex-none" />
        <span className="sr-only">{copy.search}</span>
        <input
          type="search"
          value={state.q}
          placeholder={copy.searchPlaceholder}
          enterKeyHint="search"
          onChange={(event) =>
            commit({ ...state, q: event.target.value }, keys)
          }
        />
      </label>
      {facets.map((facet) =>
        facet.options.length === 0 ? null : (
          <fieldset key={facet.key} className="filter-facet">
            <legend className="filter-legend">{facet.legend}</legend>
            <div className="filter-options">
              {facet.options.map((option) => (
                <label key={option.value} className="filter-chip">
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={
                      state.selected[facet.key]?.includes(option.value) ?? false
                    }
                    onChange={() =>
                      commit(
                        toggleFacetValue(state, facet.key, option.value),
                        keys
                      )
                    }
                  />
                  <span>{option.label}</span>
                  <span aria-hidden="true" className="filter-chip-count">
                    {option.count}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        )
      )}
      <div className="filter-status">
        <p aria-live="polite">
          {visible === 0
            ? copy.noResults
            : countLabel(visible, copy.resultOne, copy.resultMany)}
        </p>
        {isFilterActive(state) && (
          <button
            type="button"
            className="filter-reset"
            onClick={() => commit(EMPTY_FILTER, keys)}
          >
            <XMarkIcon aria-hidden="true" className="size-4" />
            {copy.reset}
          </button>
        )}
      </div>
    </div>
  )
}
