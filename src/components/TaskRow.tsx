import React from 'react'
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
  const { data, softDeleteTask, toggleFavorite, togglePin, startTimer } = useApp()
  const boards = data?.boards || []

  return (
    <div className="queue-row">
      <button
        type="button"
        className={`check ${task.status === 'completed' ? 'done' : ''}`}
        title="Complete"
        onClick={() => task.status === 'pending' && onComplete(task)}
      />
      <div className="queue-main">
        <strong>
          {task.isPinned ? '📌 ' : ''}
          {task.title}
        </strong>
        <div className="queue-meta">
          <span className="board-dot" style={{ background: boardColor(boards, task.boardId) }} />
          {boardName(boards, task.boardId)}
          <span className={`priority ${task.priority}`}>{task.priority}</span>
          <span className="type-pill">{TYPE_LABELS[task.type]}</span>
          {task.workDate && <span>{task.workDate}</span>}
          {task.estimatedHours != null && <span>~{task.estimatedHours}h</span>}
          {showDoneMeta && task.actualHours != null && <span>{task.actualHours}h logged</span>}
          {showDoneMeta && task.gitCommit && <span>#{task.gitCommit}</span>}
        </div>
        {(task.description || (showDoneMeta && task.remarks)) && (
          <p className="task-notes">{showDoneMeta ? task.remarks || task.description : task.description}</p>
        )}
      </div>
      <div className="row-actions">
        <button type="button" className={`star ${task.isFavorite ? 'on' : ''}`} onClick={() => toggleFavorite(task.id)}>
          ★
        </button>
        <button type="button" className={`pin-btn ${task.isPinned ? 'on' : ''}`} onClick={() => togglePin(task.id)}>
          📌
        </button>
        {task.status === 'pending' && (
          <button type="button" className="edit-task" onClick={() => startTimer(task.id, task.timerEstimateMinutes ?? 30)}>
            Timer
          </button>
        )}
        <button type="button" className="edit-task" onClick={() => onEdit(task)}>
          Edit
        </button>
        <button
          type="button"
          className="delete-task"
          onClick={() => confirm('Delete this task?') && softDeleteTask(task.id)}
        >
          Delete
        </button>
        {showDoneMeta && task.completedAt && (
          <span className="done-time">{new Date(task.completedAt).toLocaleString()}</span>
        )}
      </div>
    </div>
  )
}
