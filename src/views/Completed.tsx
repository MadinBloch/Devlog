import React, { useMemo, useState } from 'react'
import { useApp } from '../context/AppContext'
import { Task, Priority, TaskType } from '../types'
import TaskRow from '../components/TaskRow'
import TaskFilters from '../components/TaskFilters'
import { completedTasks, TYPE_LABELS, downloadText, formatDisplayDate } from '../utils/helpers'

export default function Completed({
  onEdit,
  onComplete,
}: {
  onEdit: (t: Task) => void
  onComplete: (t: Task) => void
}) {
  const { data, search } = useApp()
  const [board, setBoard] = useState('all')
  const [types, setTypes] = useState<TaskType[]>([])
  const [priorities, setPriorities] = useState<Priority[]>([])
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [query, setQuery] = useState('')

  const list = useMemo(() => {
    if (!data) return []
    const q = (query || search).trim().toLowerCase()
    return completedTasks(data.tasks).filter((t) => {
      const d = t.completedAt?.slice(0, 10) || t.workDate || ''
      if (board !== 'all' && t.boardId !== board) return false
      if (types.length && !types.includes(t.type)) return false
      if (priorities.length && !priorities.includes(t.priority)) return false
      if (from && d < from) return false
      if (to && d > to) return false
      if (q) {
        const hay = [t.title, t.description, t.remarks, t.gitCommit, t.branch].join(' ').toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [data, board, types, priorities, from, to, query, search])

  const byDay = useMemo(() => {
    const map = new Map<string, Task[]>()
    for (const t of list) {
      const day = t.completedAt?.slice(0, 10) || t.workDate || 'No date'
      if (!map.has(day)) map.set(day, [])
      map.get(day)!.push(t)
    }
    return map
  }, [list])

  function exportTxt() {
    const lines = [
      `Completed Tasks — ${formatDisplayDate(new Date().toISOString())}`,
      '='.repeat(56),
      '',
      ...(from || to ? [`Date filter: ${formatDisplayDate(from) || '...'} to ${formatDisplayDate(to) || '...'}`, ''] : []),
    ]
    if (!list.length) {
      lines.push('No completed tasks for the selected filters.')
    } else {
      for (const [day, tasks] of byDay) {
        lines.push(formatDisplayDate(day) || day, '')
        for (const t of tasks) {
          lines.push(`-- ${t.title}`)
          const extra = [
            TYPE_LABELS[t.type] || t.type,
            data?.boards.find((b) => b.id === t.boardId)?.name || 'Unassigned',
          ]
          if (t.gitCommit) extra.push(`commit ${t.gitCommit}`)
          if (t.actualHours != null) extra.push(`${t.actualHours}h`)
          lines.push(`   ${extra.join(' · ')}`)
        }
        lines.push('')
      }
    }
    downloadText(lines.join('\n'), `completed-tasks-${new Date().toISOString().slice(0, 10)}.txt`)
  }

  function exportCsv() {
    const rows = [['title', 'completedAt', 'hours', 'commit', 'priority', 'type', 'board']]
    list.forEach((t) =>
      rows.push([
        t.title,
        formatDisplayDate(t.completedAt),
        String(t.actualHours ?? ''),
        t.gitCommit,
        t.priority,
        t.type,
        data?.boards.find((b) => b.id === t.boardId)?.name || '',
      ])
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
          <p>Finished work with the same filters as Laravel DevLog.</p>
        </div>
        <div className="heading-actions">
          <button type="button" className="soft-btn" onClick={exportTxt}>
            Export text
          </button>
          <button type="button" className="soft-btn" onClick={exportCsv}>
            Export CSV
          </button>
        </div>
      </div>

      <TaskFilters
        from={from}
        to={to}
        setFrom={setFrom}
        setTo={setTo}
        board={board}
        setBoard={setBoard}
        boards={data?.boards}
        types={types}
        setTypes={setTypes}
        priorities={priorities}
        setPriorities={setPriorities}
        query={query}
        setQuery={setQuery}
        count={list.length}
        onClear={() => {
          setBoard('all')
          setTypes([])
          setPriorities([])
          setFrom('')
          setTo('')
          setQuery('')
        }}
        dateLabel="Completed date"
      />

      <div className="completed-stack">
        {list.length === 0 && (
          <div className="empty-state empty">
            <strong>No completed tasks match this filter.</strong>
            <p>Try another date range or type (Major / Minor), or clear filters.</p>
          </div>
        )}
        {[...byDay.entries()].map(([day, tasks]) => (
          <div key={day} className="card completed-day">
            <div className="completed-day-head">
              <h2>{formatDisplayDate(day) || day}</h2>
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
