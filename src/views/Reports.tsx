import React, { useMemo, useState } from 'react'
import { useApp } from '../context/AppContext'
import {
  todayISO,
  datePreset,
  TYPE_LABELS,
  PRIORITY_LABELS,
  formatDisplayDate,
  boardName,
} from '../utils/helpers'
import { TaskType, Priority } from '../types'
import { toast } from '../utils/toast'

export default function Reports() {
  const { data } = useApp()
  const [date, setDate] = useState(todayISO())
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [mode, setMode] = useState<'day' | 'range'>('day')

  const tasks = useMemo(() => {
    if (!data) return []
    return data.tasks.filter((t) => {
      if (t.deletedAt || t.status !== 'completed') return false
      const d = t.completedAt?.slice(0, 10) || ''
      if (mode === 'day') return d === date
      if (from && d < from) return false
      if (to && d > to) return false
      if (!from && !to) return d === date
      return true
    })
  }, [data, date, from, to, mode])

  const totalHours = tasks.reduce((s, t) => s + (t.actualHours || 0), 0)
  const hoursByType: Record<string, number> = {}
  const hoursByPriority: Record<string, number> = {}
  const hoursByBoard: Record<string, number> = {}
  const countByType: Record<string, number> = {}

  tasks.forEach((t) => {
    const h = t.actualHours || 0
    hoursByType[t.type] = (hoursByType[t.type] || 0) + h
    hoursByPriority[t.priority] = (hoursByPriority[t.priority] || 0) + h
    const b = t.boardId || 'none'
    hoursByBoard[b] = (hoursByBoard[b] || 0) + h
    countByType[t.type] = (countByType[t.type] || 0) + 1
  })

  const maxTypeHours = Math.max(0.01, ...Object.values(hoursByType), ...Object.values(countByType).map((c) => c))

  const periodLabel =
    mode === 'day'
      ? formatDisplayDate(date)
      : `${formatDisplayDate(from) || '…'} → ${formatDisplayDate(to) || '…'}`

  function applyDayPreset(preset: 'today' | 'week' | 'month') {
    if (preset === 'today') {
      setMode('day')
      setDate(todayISO())
      setFrom('')
      setTo('')
      return
    }
    const [a, b] = datePreset(preset)
    setMode('range')
    setFrom(a)
    setTo(b)
  }

  function exportTxt() {
    const lines = [
      `DevLog report — ${periodLabel}`,
      `Completed: ${tasks.length}`,
      `Hours: ${totalHours.toFixed(2)}`,
      '',
      ...tasks.map(
        (t) =>
          `✓ ${t.title} — ${t.actualHours || 0}h — ${TYPE_LABELS[t.type]} — ${t.gitCommit ? '#' + t.gitCommit.slice(0, 8) : ''}`
      ),
    ]
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([lines.join('\n')], { type: 'text/plain' }))
    a.download = `devlog_report_${date}.txt`
    a.click()
  }

  function exportCsv() {
    const rows = [['title', 'completed', 'hours', 'priority', 'type', 'board', 'commit']]
    tasks.forEach((t) =>
      rows.push([
        t.title,
        formatDisplayDate(t.completedAt),
        String(t.actualHours || ''),
        t.priority,
        t.type,
        boardName(data?.boards || [], t.boardId),
        t.gitCommit,
      ])
    )
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    a.download = `devlog_report_${date}.csv`
    a.click()
  }

  async function copyStandup() {
    const pending = data?.tasks.filter((t) => !t.deletedAt && t.status === 'pending').slice(0, 8) || []
    const lines = [
      `DevLog standup — ${periodLabel}`,
      '',
      `Done (${tasks.length}):`,
      ...(tasks.length
        ? tasks.map((t) => `✓ ${t.title}${t.actualHours ? ` (${t.actualHours}h)` : ''}`)
        : ['• (none)']),
      '',
      `Still open (top ${pending.length}):`,
      ...(pending.length ? pending.map((t) => `• ${t.title}`) : ['• (none)']),
      '',
      `Hours logged: ${totalHours.toFixed(1)}h`,
    ]
    try {
      await navigator.clipboard.writeText(lines.join('\n'))
      toast('Standup copied to clipboard', 'success')
    } catch {
      toast('Could not copy — try Export TXT', 'error')
    }
  }

  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">Insights</div>
          <h1>Reports</h1>
          <p>Daily / weekly summary — dates shown as dd mm yyyy.</p>
        </div>
        <div className="heading-actions">
          <button type="button" className="soft-btn" onClick={copyStandup}>
            Copy standup
          </button>
        </div>
      </div>

      <div className="report-tools filter-card">
        <div className="filter-presets">
          <button type="button" className={`chip-btn ${mode === 'day' && date === todayISO() ? 'active' : ''}`} onClick={() => applyDayPreset('today')}>
            Today
          </button>
          <button type="button" className="chip-btn" onClick={() => applyDayPreset('week')}>
            This week
          </button>
          <button type="button" className="chip-btn" onClick={() => applyDayPreset('month')}>
            This month
          </button>
        </div>
        <label>
          Day <span className="date-hint">dd mm yyyy</span>
          <input
            type="date"
            value={date}
            onChange={(e) => {
              setMode('day')
              setDate(e.target.value)
              setFrom('')
              setTo('')
            }}
          />
          <em className="date-display">{formatDisplayDate(date)}</em>
        </label>
        <button type="button" className="soft-btn" onClick={exportTxt}>
          Export TXT
        </button>
        <button type="button" className="soft-btn" onClick={exportCsv}>
          Export CSV
        </button>
        <span className="filter-count">{periodLabel}</span>
      </div>

      <div className="report-grid">
        <div className="card report-card">
          <div className="card-title">
            <h2>Completed</h2>
            <span className="report-count">{tasks.length}</span>
          </div>
          <div className="report-summary">
            <div>
              <strong>{tasks.length}</strong>
              <span>Tasks</span>
            </div>
            <div>
              <strong>{totalHours.toFixed(1)}</strong>
              <span>Hours</span>
            </div>
            <div>
              <strong>{Object.keys(countByType).length}</strong>
              <span>Types</span>
            </div>
          </div>
          <div className="report-lines">
            {tasks.length === 0 && <p className="empty">No completions in this period.</p>}
            {tasks.map((t) => (
              <p key={t.id}>
                <span>✓</span> {t.title}
                {t.actualHours != null ? ` — ${t.actualHours}h` : ''}
                {t.gitCommit ? ` — #${t.gitCommit.slice(0, 10)}` : ''}
                <small className="report-date"> · {formatDisplayDate(t.completedAt)}</small>
              </p>
            ))}
          </div>
          {totalHours === 0 && tasks.length > 0 && (
            <p className="empty hint-line">Tip: log hours via Timer or Complete modal so breakdown fills in.</p>
          )}
        </div>

        <div className="card report-card">
          <div className="card-title">
            <h2>Breakdown</h2>
          </div>

          <h3 className="break-title">By type</h3>
          {(Object.keys(TYPE_LABELS) as TaskType[])
            .filter((k) => countByType[k] || hoursByType[k])
            .map((k) => {
              const hours = hoursByType[k] || 0
              const count = countByType[k] || 0
              const width = Math.max(8, Math.round(((hours || count) / maxTypeHours) * 100))
              return (
                <div key={k} className="break-row">
                  <div className="break-label">
                    <strong>{TYPE_LABELS[k]}</strong>
                    <span>
                      {count} task{count === 1 ? '' : 's'} · {hours.toFixed(1)}h
                    </span>
                  </div>
                  <div className="break-bar">
                    <i style={{ width: `${width}%` }} />
                  </div>
                </div>
              )
            })}
          {!Object.keys(countByType).length && <div className="empty">No data for this period.</div>}

          <h3 className="break-title">By priority</h3>
          {(Object.keys(PRIORITY_LABELS) as Priority[])
            .filter((k) => hoursByPriority[k] || tasks.some((t) => t.priority === k))
            .map((k) => {
              const hours = hoursByPriority[k] || 0
              const count = tasks.filter((t) => t.priority === k).length
              return (
                <div key={k} className="break-row">
                  <div className="break-label">
                    <strong>{PRIORITY_LABELS[k]}</strong>
                    <span>
                      {count} · {hours.toFixed(1)}h
                    </span>
                  </div>
                </div>
              )
            })}

          <h3 className="break-title">By board</h3>
          {Object.entries(hoursByBoard).map(([id, hours]) => {
            const count = tasks.filter((t) => (t.boardId || 'none') === id).length
            return (
              <div key={id} className="break-row">
                <div className="break-label">
                  <strong>{id === 'none' ? 'Unassigned' : boardName(data?.boards || [], id)}</strong>
                  <span>
                    {count} · {hours.toFixed(1)}h
                  </span>
                </div>
              </div>
            )
          })}
          {!Object.keys(hoursByBoard).length && tasks.length === 0 && <div className="empty">No boards.</div>}
        </div>
      </div>
    </>
  )
}
