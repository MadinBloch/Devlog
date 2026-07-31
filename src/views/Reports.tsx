import React, { useMemo, useState } from 'react'
import { useApp } from '../context/AppContext'
import { todayISO, TYPE_LABELS, PRIORITY_LABELS } from '../utils/helpers'
import { TaskType, Priority } from '../types'

export default function Reports() {
  const { data } = useApp()
  const [date, setDate] = useState(todayISO())

  const tasks = useMemo(() => {
    if (!data) return []
    return data.tasks.filter(
      (t) => !t.deletedAt && t.status === 'completed' && t.completedAt?.slice(0, 10) === date
    )
  }, [data, date])

  const totalHours = tasks.reduce((s, t) => s + (t.actualHours || 0), 0)
  const hoursByType: Record<string, number> = {}
  const hoursByPriority: Record<string, number> = {}
  tasks.forEach((t) => {
    const h = t.actualHours || 0
    hoursByType[t.type] = (hoursByType[t.type] || 0) + h
    hoursByPriority[t.priority] = (hoursByPriority[t.priority] || 0) + h
  })

  function exportTxt() {
    const lines = [
      `DevLog report — ${date}`,
      `Completed: ${tasks.length}`,
      `Hours: ${totalHours.toFixed(2)}`,
      '',
      ...tasks.map((t) => `✓ ${t.title} — ${t.actualHours || 0}h — ${t.gitCommit || ''}`),
    ]
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([lines.join('\n')], { type: 'text/plain' }))
    a.download = `devlog_report_${date}.txt`
    a.click()
  }

  function exportCsv() {
    const rows = [['title', 'hours', 'priority', 'type', 'commit']]
    tasks.forEach((t) => rows.push([t.title, String(t.actualHours || ''), t.priority, t.type, t.gitCommit]))
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    a.download = `devlog_report_${date}.csv`
    a.click()
  }

  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">Insights</div>
          <h1>Reports</h1>
          <p>Daily summary of completed work.</p>
        </div>
      </div>
      <div className="report-tools">
        <label>
          Date
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </label>
        <button type="button" className="soft-btn" onClick={exportTxt}>
          Export TXT
        </button>
        <button type="button" className="soft-btn" onClick={exportCsv}>
          Export CSV
        </button>
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
              <strong>{Object.keys(hoursByType).length}</strong>
              <span>Types</span>
            </div>
          </div>
          <div className="report-lines">
            {tasks.length === 0 && <p className="empty">No completions this day.</p>}
            {tasks.map((t) => (
              <p key={t.id}>
                <span>✓</span> {t.title}
                {t.actualHours != null ? ` — ${t.actualHours}h` : ''}
                {t.gitCommit ? ` — #${t.gitCommit}` : ''}
              </p>
            ))}
          </div>
        </div>
        <div className="card report-card">
          <div className="card-title">
            <h2>Hours breakdown</h2>
          </div>
          <h3 style={{ fontSize: 13, margin: '8px 0' }}>By type</h3>
          {(Object.keys(TYPE_LABELS) as TaskType[])
            .filter((k) => hoursByType[k])
            .map((k) => (
              <div key={k} className="activity">
                <div>
                  <strong>{TYPE_LABELS[k]}</strong>
                  <p>{hoursByType[k].toFixed(2)}h</p>
                </div>
              </div>
            ))}
          <h3 style={{ fontSize: 13, margin: '16px 0 8px' }}>By priority</h3>
          {(Object.keys(PRIORITY_LABELS) as Priority[])
            .filter((k) => hoursByPriority[k])
            .map((k) => (
              <div key={k} className="activity">
                <div>
                  <strong>{PRIORITY_LABELS[k]}</strong>
                  <p>{hoursByPriority[k].toFixed(2)}h</p>
                </div>
              </div>
            ))}
          {!Object.keys(hoursByType).length && <div className="empty">No hours logged.</div>}
        </div>
      </div>
    </>
  )
}
