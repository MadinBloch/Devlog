import React, { useMemo, useState } from 'react'
import { useApp } from '../context/AppContext'
import { Task } from '../types'
import TaskRow from '../components/TaskRow'
import { completedTasks, todayISO } from '../utils/helpers'

export default function Completed({
  onEdit,
  onComplete,
}: {
  onEdit: (t: Task) => void
  onComplete: (t: Task) => void
}) {
  const { data } = useApp()
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  const list = useMemo(() => {
    if (!data) return []
    return completedTasks(data.tasks)
      .filter((t) => {
        const d = t.completedAt?.slice(0, 10) || ''
        if (from && d < from) return false
        if (to && d > to) return false
        return true
      })
      .sort((a, b) => (b.completedAt || '').localeCompare(a.completedAt || ''))
  }, [data, from, to])

  const byDay = useMemo(() => {
    const map = new Map<string, Task[]>()
    for (const t of list) {
      const day = t.completedAt?.slice(0, 10) || 'unknown'
      if (!map.has(day)) map.set(day, [])
      map.get(day)!.push(t)
    }
    return map
  }, [list])

  function exportCsv() {
    const rows = [['title', 'completedAt', 'hours', 'commit', 'priority', 'type']]
    list.forEach((t) =>
      rows.push([t.title, t.completedAt || '', String(t.actualHours ?? ''), t.gitCommit, t.priority, t.type])
    )
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    a.download = 'completed_tasks.csv'
    a.click()
  }

  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">History</div>
          <h1>Completed</h1>
          <p>Finished work grouped by day.</p>
        </div>
        <div className="heading-actions">
          <button type="button" className="soft-btn" onClick={() => { setFrom(todayISO()); setTo(todayISO()) }}>
            Today
          </button>
          <button type="button" className="soft-btn" onClick={exportCsv}>
            Export CSV
          </button>
        </div>
      </div>

      <div className="filter-panel">
        <div className="filter-bar">
          <label>
            From
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </label>
          <label>
            To
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </label>
          <button type="button" className="chip-btn ghost" onClick={() => { setFrom(''); setTo('') }}>
            Clear
          </button>
          <span className="filter-count">{list.length} tasks</span>
        </div>
      </div>

      <div className="completed-stack">
        {list.length === 0 && <div className="empty-state empty">No completed tasks in range.</div>}
        {[...byDay.entries()].map(([day, tasks]) => (
          <div key={day} className="card completed-day">
            <div className="completed-day-head">
              <h2>{day}</h2>
              <span className="queue-count">{tasks.length}</span>
            </div>
            <div className="queue-rows">
              {tasks.map((t) => (
                <TaskRow key={t.id} task={t} onEdit={onEdit} onComplete={onComplete} showDoneMeta />
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
