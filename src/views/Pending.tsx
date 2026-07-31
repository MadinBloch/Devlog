import React, { useMemo, useState } from 'react'
import { useApp } from '../context/AppContext'
import { Task, Priority, TaskType } from '../types'
import TaskRow from '../components/TaskRow'
import { pendingTasks, TYPE_LABELS, PRIORITY_LABELS } from '../utils/helpers'

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

  const list = useMemo(() => {
    if (!data) return []
    return pendingTasks(data.tasks).filter((t) => {
      if (board !== 'all' && t.boardId !== board) return false
      if (types.length && !types.includes(t.type)) return false
      if (priorities.length && !priorities.includes(t.priority)) return false
      if (from && (t.workDate || '') < from) return false
      if (to && (t.workDate || '') > to) return false
      return true
    })
  }, [data, board, types, priorities, from, to])

  function toggleType(t: TaskType) {
    setTypes((p) => (p.includes(t) ? p.filter((x) => x !== t) : [...p, t]))
  }
  function togglePri(p: Priority) {
    setPriorities((list) => (list.includes(p) ? list.filter((x) => x !== p) : [...list, p]))
  }

  function exportTxt() {
    const lines = list.map((t) => `- [${t.priority}] ${t.title}${t.workDate ? ` (${t.workDate})` : ''}`)
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'pending_tasks.txt'
    a.click()
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
            Export
          </button>
        </div>
      </div>

      <div className="filter-panel">
        <div className="filter-bar">
          <label>
            Board
            <select value={board} onChange={(e) => setBoard(e.target.value)}>
              <option value="all">All</option>
              {data?.boards.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            From
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </label>
          <label>
            To
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </label>
          <button
            type="button"
            className="chip-btn ghost"
            onClick={() => {
              setBoard('all')
              setTypes([])
              setPriorities([])
              setFrom('')
              setTo('')
            }}
          >
            Clear
          </button>
          <span className="filter-count">{list.length} tasks</span>
        </div>
        <div className="filter-chips">
          <span className="chip-label">Type</span>
          {(Object.keys(TYPE_LABELS) as TaskType[]).map((t) => (
            <button key={t} type="button" className={`chip-btn ${types.includes(t) ? 'active' : ''}`} onClick={() => toggleType(t)}>
              {TYPE_LABELS[t]}
            </button>
          ))}
        </div>
        <div className="filter-chips">
          <span className="chip-label">Priority</span>
          {(Object.keys(PRIORITY_LABELS) as Priority[]).map((p) => (
            <button key={p} type="button" className={`chip-btn ${priorities.includes(p) ? 'active' : ''}`} onClick={() => togglePri(p)}>
              {PRIORITY_LABELS[p]}
            </button>
          ))}
        </div>
      </div>

      <div className="queue-list">
        {list.length === 0 && <div className="empty-state empty">No pending tasks match filters.</div>}
        {[...grouped.entries()].map(([boardId, tasks]) => {
          const boardObj = data?.boards.find((b) => b.id === boardId)
          return (
            <div key={boardId} className="card queue-board">
              <div className="queue-board-head">
                <h2>
                  <span className="board-dot" style={{ background: boardObj?.color || '#94a3b8' }} />
                  {boardObj?.name || 'No board'}
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
