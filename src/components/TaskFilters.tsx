import React from 'react'
import { Priority, TaskType } from '../types'
import { TYPE_LABELS, PRIORITY_LABELS, datePreset, formatDisplayDate } from '../utils/helpers'

type BoardOpt = { id: string; name: string }

export default function TaskFilters({
  from,
  to,
  setFrom,
  setTo,
  board,
  setBoard,
  boards,
  types,
  setTypes,
  priorities,
  setPriorities,
  query,
  setQuery,
  count,
  onClear,
  showBoard = true,
  dateLabel = 'Work date',
}: {
  from: string
  to: string
  setFrom: (v: string) => void
  setTo: (v: string) => void
  board?: string
  setBoard?: (v: string) => void
  boards?: BoardOpt[]
  types: TaskType[]
  setTypes: (v: TaskType[] | ((p: TaskType[]) => TaskType[])) => void
  priorities: Priority[]
  setPriorities: (v: Priority[] | ((p: Priority[]) => Priority[])) => void
  query?: string
  setQuery?: (v: string) => void
  count: number
  onClear: () => void
  showBoard?: boolean
  dateLabel?: string
}) {
  function applyPreset(preset: 'today' | 'week' | 'month') {
    const [a, b] = datePreset(preset)
    setFrom(a)
    setTo(b)
  }

  function toggleType(t: TaskType) {
    setTypes((p) => (p.includes(t) ? p.filter((x) => x !== t) : [...p, t]))
  }

  function togglePri(p: Priority) {
    setPriorities((list) => (list.includes(p) ? list.filter((x) => x !== p) : [...list, p]))
  }

  const rangeLabel =
    from || to
      ? `${formatDisplayDate(from) || '…'} → ${formatDisplayDate(to) || '…'}`
      : 'All dates'

  return (
    <section className="filter-panel filter-card">
      <div className="filter-top">
        <div className="filter-presets">
          <button type="button" className="chip-btn" onClick={() => applyPreset('today')}>
            Today
          </button>
          <button type="button" className="chip-btn" onClick={() => applyPreset('week')}>
            This week
          </button>
          <button type="button" className="chip-btn" onClick={() => applyPreset('month')}>
            This month
          </button>
          <button type="button" className="chip-btn ghost" onClick={onClear}>
            Clear
          </button>
        </div>
        <div className="filter-meta">
          <span className="range-pill" title={dateLabel}>
            {rangeLabel}
          </span>
          <span className="filter-count">{count} shown</span>
        </div>
      </div>

      <div className="filter-bar filter-bar-compact">
        {showBoard && setBoard && (
          <label>
            Board
            <select value={board || 'all'} onChange={(e) => setBoard(e.target.value)}>
              <option value="all">All</option>
              {(boards || []).map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </label>
        )}
        <label>
          From <span className="date-hint">dd mm yyyy</span>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} title={dateLabel} />
          {from && <em className="date-display">{formatDisplayDate(from)}</em>}
        </label>
        <label>
          To <span className="date-hint">dd mm yyyy</span>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} title={dateLabel} />
          {to && <em className="date-display">{formatDisplayDate(to)}</em>}
        </label>
        {setQuery && (
          <label className="filter-search">
            Search
            <input
              value={query || ''}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Title, notes, commit…"
            />
          </label>
        )}
      </div>

      <div className="filter-chips dense">
        <span className="chip-label">Type</span>
        {(Object.keys(TYPE_LABELS) as TaskType[]).map((t) => (
          <button
            key={t}
            type="button"
            className={`chip-btn ${types.includes(t) ? 'active' : ''}`}
            onClick={() => toggleType(t)}
          >
            {TYPE_LABELS[t]}
          </button>
        ))}
      </div>
      <div className="filter-chips dense">
        <span className="chip-label">Priority</span>
        {(Object.keys(PRIORITY_LABELS) as Priority[]).map((p) => (
          <button
            key={p}
            type="button"
            className={`chip-btn ${priorities.includes(p) ? 'active' : ''}`}
            onClick={() => togglePri(p)}
          >
            {PRIORITY_LABELS[p]}
          </button>
        ))}
      </div>
    </section>
  )
}
