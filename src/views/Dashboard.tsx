import React, { useMemo, useState } from 'react'
import { useApp } from '../context/AppContext'
import { Task } from '../types'
import TaskRow from '../components/TaskRow'
import { pendingTasks, completedTasks, todayISO, boardColor, boardName, formatDisplayDate } from '../utils/helpers'

export default function Dashboard({
  onEdit,
  onComplete,
  onNew,
  setView,
}: {
  onEdit: (t: Task) => void
  onComplete: (t: Task) => void
  onNew: () => void
  setView: (v: string) => void
}) {
  const { data, addTask } = useApp()
  const [quick, setQuick] = useState('')

  const pending = useMemo(() => (data ? pendingTasks(data.tasks) : []), [data])
  const completed = useMemo(() => (data ? completedTasks(data.tasks) : []), [data])
  const completedToday = completed.filter((t) => t.completedAt?.slice(0, 10) === todayISO())
  const pinned = pending.filter((t) => t.isPinned || t.isFavorite).slice(0, 8)
  const focus = (pinned.length ? pinned : pending).slice(0, 8)
  const recent = completed.slice(0, 6)
  const hoursToday = completedToday.reduce((s, t) => s + (t.actualHours || 0), 0)

  if (!data) return <div className="page-heading"><p>Loading…</p></div>

  function capture() {
    if (!quick.trim()) return
    addTask({ title: quick.trim(), workDate: todayISO() })
    setQuick('')
  }

  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">Overview</div>
          <h1>Dashboard</h1>
          <p>Your personal work OS — edit locally, Sync when ready.</p>
        </div>
      </div>

      <div className="quick-capture">
        <div className="quick-capture-icon">+</div>
        <label>
          <span>QUICK CAPTURE</span>
          <input
            value={quick}
            onChange={(e) => setQuick(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && capture()}
            placeholder="What are you working on?"
          />
        </label>
        <button type="button" className="primary-btn" onClick={capture}>
          Add
        </button>
      </div>

      <div className="stats">
        <article className="stat-click" onClick={() => setView('pending')} role="button" tabIndex={0}>
          <small>PENDING</small>
          <strong>{pending.length}</strong>
          <p>Open tasks</p>
        </article>
        <article className="stat-click" onClick={() => setView('completed')} role="button" tabIndex={0}>
          <small>DONE TODAY</small>
          <strong>{completedToday.length}</strong>
          <p>{hoursToday.toFixed(1)}h logged</p>
        </article>
        <article className="stat-click" onClick={() => setView('boards')} role="button" tabIndex={0}>
          <small>BOARDS</small>
          <strong>{data.boards.length}</strong>
          <p>Active boards</p>
        </article>
        <article className="stat-click" onClick={() => setView('completed')} role="button" tabIndex={0}>
          <small>COMPLETED</small>
          <strong>{completed.length}</strong>
          <p>All time</p>
        </article>
      </div>

      <div className="dashboard-grid">
        <div className="card">
          <div className="card-title">
            <div>
              <div className="eyebrow">Focus</div>
              <h2>
                Priority queue <b>{focus.length}</b>
              </h2>
            </div>
            <button type="button" className="text-btn" onClick={() => setView('pending')}>
              View all
            </button>
          </div>
          {focus.length === 0 && <div className="empty">No pending tasks. Add one above.</div>}
          {focus.map((t) => (
            <div key={t.id} className="focus-task">
              <button type="button" className="check" onClick={() => onComplete(t)} />
              <div className="task-main">
                <strong>{t.title}</strong>
                <p>
                  <span className="board-dot" style={{ background: boardColor(data.boards, t.boardId) }} />
                  {boardName(data.boards, t.boardId)}
                  <span className={`priority ${t.priority}`}>{t.priority}</span>
                </p>
              </div>
              <button type="button" className="edit-task" onClick={() => onEdit(t)}>
                Edit
              </button>
            </div>
          ))}
          <button type="button" className="add-inline" onClick={onNew}>
            + Add task
          </button>
        </div>

        <div className="card compact">
          <div className="card-title">
            <div>
              <div className="eyebrow">Activity</div>
              <h2>Recently completed</h2>
            </div>
          </div>
          {recent.length === 0 && <div className="empty">Nothing completed yet.</div>}
          {recent.map((t) => (
            <div key={t.id} className="activity" style={{ cursor: 'pointer' }} onClick={() => onEdit(t)}>
              <div className="activity-icon">✓</div>
              <div>
                <strong>{t.title}</strong>
                <p>{t.actualHours != null ? `${t.actualHours}h` : '—'}{t.gitCommit ? ` · #${t.gitCommit}` : ''}</p>
              </div>
              <time>{t.completedAt ? formatDisplayDate(t.completedAt) : ''}</time>
            </div>
          ))}
        </div>
      </div>

      {pending.length > 0 && (
        <div className="queue-list" style={{ paddingTop: 8 }}>
          <div className="card queue-board">
            <div className="queue-board-head">
              <div>
                <div className="eyebrow">Queue</div>
                <h2>All pending</h2>
              </div>
              <span className="queue-count">{pending.length}</span>
            </div>
            <div className="queue-rows">
              {pending.slice(0, 12).map((t) => (
                <TaskRow key={t.id} task={t} onEdit={onEdit} onComplete={onComplete} />
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
