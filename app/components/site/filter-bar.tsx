'use client'

/**
 * 허브 목록(세션·프로젝트·멤버)의 검색·필터 막대(클라이언트 컴포넌트).
 *
 * 순수 필터 규칙(쿼리 문자열 파싱·직렬화, 일치 판정)은 `lib/site/filter-state.ts`에 있다.
 */
import { useState, useSyncExternalStore } from 'react'
import MagnifyingGlassIcon from '@heroicons/react/24/outline/MagnifyingGlassIcon'
import XMarkIcon from '@heroicons/react/24/outline/XMarkIcon'
import { countLabel } from '@/lib/format/text'
import {
  EMPTY_FILTER,
  isFilterActive,
  matchesFilter,
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

/*
 * 상태는 URL 쿼리 문자열 하나뿐이다. 서버는 모든 행을 렌더링하고, 하이드레이션 후 이
 * 스토어가 쿼리 문자열을 행에 적용(`hidden` 속성)한다. React는 그 결과를
 * useSyncExternalStore로 읽는다. 그래서 행 데이터가 RSC payload에 중복으로 실리지 않고,
 * effect 안에서 state를 바꾸는 일도 없다.
 */

/** `history.replaceState`는 이벤트를 내지 않으므로, 필터를 바꿀 때 직접 쏘는 사용자 정의 이벤트. */
const FILTER_EVENT = 'site:filterchange'

/** 스토어 스냅숏: 현재 쿼리 문자열과 보이는 행 수. */
type Snapshot = { search: string; visible: number }

/**
 * `scope` id 요소 안의 `[data-filter-item]` 행에 필터를 적용하는 외부 스토어.
 *
 * 모든 행이 숨겨진 `[data-filter-group]`(기수 묶음 등)도 함께 숨긴다. 뒤로/앞으로 가기
 * (`popstate`)와 필터 변경 이벤트에 반응한다.
 */
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
    const state = parseFilterState(search, keys)
    const root = document.getElementById(scope)
    let visible = root ? 0 : total

    root
      ?.querySelectorAll<HTMLElement>('[data-filter-item]')
      .forEach((item) => {
        const show = matchesFilter(readFilterableItem(item, keys), state, modes)
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
    subscribe(listener: () => void) {
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

/**
 * 검색 입력, 필터 체크박스, 결과 수, 초기화 버튼.
 *
 * @param scope 필터를 적용할 목록 요소의 id
 * @param facets 필터 묶음
 * @param copy 현재 언어 문구
 * @param total 전체 행 수(서버 렌더링·하이드레이션 전 결과 수)
 */
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
