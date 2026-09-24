'use client'

import { useState, useSyncExternalStore } from 'react'
import MagnifyingGlassIcon from '@heroicons/react/24/outline/MagnifyingGlassIcon'
import XMarkIcon from '@heroicons/react/24/outline/XMarkIcon'
import { countLabel } from '@/lib/site/format'
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

export type FilterFacet = {
  key: string
  legend: string
  mode?: FacetMode
  options: FacetOption[]
}

/*
 * The URL is the only state. The server renders every row; after hydration
 * this store applies the query string to the rows (`hidden`) and React reads
 * the result through useSyncExternalStore, so no row data is duplicated into
 * the RSC payload and no state is set inside an effect.
 */
const FILTER_EVENT = 'site:filterchange'

type Snapshot = { search: string; visible: number }

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

function commit(state: FilterState, keys: readonly string[]) {
  const { pathname, hash } = window.location
  window.history.replaceState(
    window.history.state,
    '',
    `${pathname}${serializeFilterState(state, keys)}${hash}`
  )
  window.dispatchEvent(new Event(FILTER_EVENT))
}

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
