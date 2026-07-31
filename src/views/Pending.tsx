import React, { useMemo, useState } from 'react'
import { useApp } from '../context/AppContext'
import { Task, Priority, TaskType } from '../types'
import TaskRow from '../components/TaskRow'
import TaskFilters from '../components/TaskFilters'
import { pendingTasks, TYPE_LABELS, downloadText, formatDisplayDate } from '../utils/helpers'

export default function Pending({
  onEdit,
  onComplete,
}: {
  onEdit: (t: Task) => void
  onComplete: (t: Task) => void
}) {
  const { data } = useApp()
  const [board, setBoard] = useState('all')
  const [types, setTypes] = useState<TaskType[]>([])
  const [priorities, setPriorities] = useState<Priority[]>([])
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [query, setQuery] = useState('')

  const list = useMemo(() => {
    if (!data) return []
    const q = query.trim().toLowerCase()
    return pendingTasks(data.tasks).filter((t) => {
      if (board !== 'all' && t.boardId !== board) return false
      if (types.length && !types.includes(t.type)) return false
      if (priorities.length && !priorities.includes(t.priority)) return false
      if (from && (t.workDate || '') < from) return false
      if (to && (t.workDate || '') > to) return false
      if (q) {
        const hay = [t.title, t.description, t.remarks, t.gitCommit, t.branch].join(' ').toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [data, board, types, priorities, from, to, query])

  function exportTxt() {
    const lines = [
      `Pending Tasks — ${formatDisplayDate(new Date().toISOString())}`,
      '='.repeat(56),
      '',
      ...(from || to ? [`Date filter: ${formatDisplayDate(from) || '...'} to ${formatDisplayDate(to) || '...'}`, ''] : []),
    ]
    const grouped = new Map<string, Task[]>()
    for (const t of list) {
      const key = t.boardId || 'none'
      if (!grouped.has(key)) grouped.set(key, [])
      grouped.get(key)!.push(t)
    }
    if (!list.length) lines.push('No pending tasks for the selected filters.')
    for (const [boardId, tasks] of grouped) {
      const name = data?.boards.find((b) => b.id === boardId)?.name || 'Unassigned'
      lines.push(name, '-'.repeat(32))
      for (const t of tasks) {
        lines.push(`-- ${t.title}`)
        lines.push(
          `   ${TYPE_LABELS[t.type] || t.type} · ${t.priority} · ${formatDisplayDate(t.workDate) || 'no date'}`
        )
      }
      lines.push('')
    }
    downloadText(lines.join('\n'), `pending-tasks-${new Date().toISOString().slice(0, 10)}.txt`)
  }

  const grouped = useMemo(() => {
    const map = new Map<string, Task[]>()
    for (const t of list) {
      const key = t.boardId || 'none'
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(t)
    }
    return map
  }, [list])

  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">Queue</div>
          <h1>Pending</h1>
          <p>Filter and work through open tasks.</p>
        </div>
        <div className="heading-actions">
          <button type="button" className="soft-btn" onClick={exportTxt}>
            Export text
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
        dateLabel="Work date"
      />

      <div className="queue-list">
        {list.length === 0 && (
          <div className="empty-state empty">
            <strong>No pending tasks match this filter.</strong>
            <p>Try another date range or type filter, or clear filters to see everything.</p>
          </div>
        )}
        {[...grouped.entries()].map(([boardId, tasks]) => {
          const boardObj = data?.boards.find((b) => b.id === boardId)
          return (
            <div key={boardId} className="card queue-board">
              <div className="queue-board-head">
                <h2>
                  <span className="board-dot" style={{ background: boardObj?.color || '#94a3b8' }} />
                  {boardObj?.name || 'Unassigned'}
                </h2>
                <span className="queue-count">{tasks.length}</span>
              </div>
              <div className="queue-rows">
                {tasks.map((t) => (
                  <TaskRow key={t.id} task={t} onEdit={onEdit} onComplete={onComplete} />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}
