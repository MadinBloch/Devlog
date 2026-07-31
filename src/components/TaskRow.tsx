import React, { useEffect, useRef, useState } from 'react'
import { Task } from '../types'
import { useApp } from '../context/AppContext'
import { TYPE_LABELS, boardColor, boardName } from '../utils/helpers'

export default function TaskRow({
  task,
  onEdit,
  onComplete,
  showDoneMeta,
}: {
  task: Task
  onEdit: (t: Task) => void
  onComplete: (t: Task) => void
  showDoneMeta?: boolean
}) {
  const { data, softDeleteTask, toggleFavorite, togglePin, startTimer, reopenTask } = useApp()
  const boards = data?.boards || []
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false)
    }
    if (menuOpen) document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [menuOpen])

  const pending = task.status === 'pending'

  return (
    <div className={`queue-row task-row ${task.isPinned ? 'is-pinned' : ''}`}>
      <button
        type="button"
        className={`check ${!pending ? 'done' : ''}`}
        title={pending ? 'Mark complete' : 'Completed'}
        onClick={() => pending && onComplete(task)}
      />
      <div className="queue-main" onDoubleClick={() => onEdit(task)}>
        <strong className="task-title-line">
          {task.isPinned && <span className="mini-badge">Pinned</span>}
          {task.isFavorite && <span className="star on" style={{ fontSize: 13 }}>★</span>}
          {task.title}
        </strong>
        <div className="queue-meta">
          <span className="board-dot" style={{ background: boardColor(boards, task.boardId) }} />
          {boardName(boards, task.boardId)}
          <span className={`priority ${task.priority}`}>{task.priority}</span>
          <span className="type-pill">{TYPE_LABELS[task.type] || task.type}</span>
          {task.workDate && <span>{task.workDate}</span>}
          {task.estimatedHours != null && <span>~{task.estimatedHours}h</span>}
          {task.branch && <span className="mono-chip">{task.branch}</span>}
          {showDoneMeta && task.actualHours != null && <span>{task.actualHours}h logged</span>}
          {showDoneMeta && task.gitCommit && <span>#{task.gitCommit}</span>}
        </div>
        {(task.description || (showDoneMeta && task.remarks)) && (
          <p className="task-notes">{showDoneMeta ? task.remarks || task.description : task.description}</p>
        )}
      </div>

      <div className="row-actions">
        {pending ? (
          <>
            <button type="button" className="action-btn primary-ghost" onClick={() => onComplete(task)}>
              Complete
            </button>
            <button type="button" className="action-btn" onClick={() => onEdit(task)}>
              Edit
            </button>
          </>
        ) : (
          <>
            <button type="button" className="action-btn" onClick={() => onEdit(task)}>
              Edit
            </button>
            <button type="button" className="action-btn" onClick={() => reopenTask(task.id)}>
              Reopen
            </button>
          </>
        )}

        <div className="more-wrap" ref={menuRef}>
          <button type="button" className="action-btn more-btn" onClick={() => setMenuOpen((v) => !v)} aria-label="More">
            ···
          </button>
          {menuOpen && (
            <div className="more-menu">
              {pending && (
                <button
                  type="button"
                  onClick={() => {
                    startTimer(task.id, task.timerEstimateMinutes ?? 30)
                    setMenuOpen(false)
                  }}
                >
                  Start timer
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  toggleFavorite(task.id)
                  setMenuOpen(false)
                }}
              >
                {task.isFavorite ? 'Unfavorite' : 'Favorite'}
              </button>
              <button
                type="button"
                onClick={() => {
                  togglePin(task.id)
                  setMenuOpen(false)
                }}
              >
                {task.isPinned ? 'Unpin' : 'Pin'}
              </button>
              <button
                type="button"
                className="danger"
                onClick={() => {
                  if (confirm('Delete this task?')) softDeleteTask(task.id)
                  setMenuOpen(false)
                }}
              >
                Delete
              </button>
            </div>
          )}
        </div>

        {showDoneMeta && task.completedAt && (
          <span className="done-time">{new Date(task.completedAt).toLocaleString()}</span>
        )}
      </div>
    </div>
  )
}
