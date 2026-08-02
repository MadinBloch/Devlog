import React, { useEffect, useState } from 'react'
import Modal from './Modal'
import { Task, Priority, TaskType } from '../types'
import { useApp } from '../context/AppContext'
import { TYPE_LABELS, PRIORITY_LABELS, todayISO } from '../utils/helpers'

export default function TaskModal({
  open,
  onClose,
  task,
}: {
  open: boolean
  onClose: () => void
  task?: Task | null
}) {
  const { addTask, editTask, data, addBoard } = useApp()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [boardId, setBoardId] = useState<string | null>(null)
  const [newBoardName, setNewBoardName] = useState('')
  const [priority, setPriority] = useState<Priority>('medium')
  const [type, setType] = useState<TaskType>('feature')
  const [status, setStatus] = useState<'pending' | 'completed'>('pending')
  const [tagIds, setTagIds] = useState<string[]>([])
  const [workDate, setWorkDate] = useState(todayISO())
  const [estimatedHours, setEstimatedHours] = useState('')
  const [branch, setBranch] = useState('')
  const [remarks, setRemarks] = useState('')
  const [isFavorite, setIsFavorite] = useState(false)
  const [isPinned, setIsPinned] = useState(false)

  useEffect(() => {
    if (!open) return
    setTitle(task?.title || '')
    setDescription(task?.description || '')
    setBoardId(task?.boardId ?? data?.boards[0]?.id ?? null)
    setNewBoardName('')
    setPriority(task?.priority ?? 'medium')
    setType(task?.type ?? 'feature')
    setStatus(task?.status ?? 'pending')
    setTagIds(task?.tagIds ?? [])
    setWorkDate(task?.workDate || todayISO())
    setEstimatedHours(task?.estimatedHours?.toString() ?? '')
    setBranch(task?.branch ?? '')
    setRemarks(task?.remarks ?? '')
    setIsFavorite(task?.isFavorite ?? false)
    setIsPinned(task?.isPinned ?? false)
  }, [task, open, data?.boards])

  if (!open) return null

  function toggleTag(id: string) {
    setTagIds((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))
  }

  function save() {
    if (!title.trim()) return
    let finalBoard = boardId
    if (newBoardName.trim()) {
      const b = addBoard({ name: newBoardName.trim() })
      if (b) finalBoard = b.id
    }
    const partial = {
      title: title.trim(),
      description,
      boardId: finalBoard,
      priority,
      type,
      status,
      tagIds,
      workDate: workDate || null,
      estimatedHours: estimatedHours ? Number(estimatedHours) : null,
      branch,
      remarks,
      isFavorite,
      isPinned,
      completedAt: status === 'completed' ? task?.completedAt || new Date().toISOString() : null,
    }
    if (task) editTask(task.id, partial)
    else addTask(partial)
    onClose()
  }

  return (
    <Modal
      title={task ? 'Edit task' : 'New task'}
      onClose={onClose}
      footer={
        <div className="modal-actions sticky-actions">
          <span className="modal-hint">Ctrl+Enter to save</span>
          <button type="button" className="soft-btn" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="primary-btn" onClick={save} disabled={!title.trim()}>
            Save
          </button>
        </div>
      }
    >
      <div
        className="task-form"
        onKeyDown={(e) => {
          if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault()
            save()
          }
        }}
      >
        <label>
          Title
          <input value={title} onChange={(e) => setTitle(e.target.value)} autoFocus placeholder="What needs doing?" />
        </label>
        <label>
          Description <span className="optional">(optional)</span>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
        </label>
        <div className="modal-fields">
          <label>
            Board
            <select value={boardId ?? ''} onChange={(e) => setBoardId(e.target.value || null)}>
              <option value="">No board</option>
              {data?.boards.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Or new board
            <input value={newBoardName} onChange={(e) => setNewBoardName(e.target.value)} placeholder="Create board…" />
          </label>
          <label>
            Work date
            <input type="date" value={workDate} onChange={(e) => setWorkDate(e.target.value)} />
          </label>
          <label>
            Status
            <select value={status} onChange={(e) => setStatus(e.target.value as 'pending' | 'completed')}>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
            </select>
          </label>
          <label>
            Priority
            <select value={priority} onChange={(e) => setPriority(e.target.value as Priority)}>
              {Object.entries(PRIORITY_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </label>
          <label>
            Type
            <select value={type} onChange={(e) => setType(e.target.value as TaskType)}>
              {Object.entries(TYPE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </label>
          <label>
            Estimated hours
            <input value={estimatedHours} onChange={(e) => setEstimatedHours(e.target.value)} placeholder="1.5" />
          </label>
          <label>
            Branch
            <input value={branch} onChange={(e) => setBranch(e.target.value)} placeholder="feature/…" />
          </label>
        </div>
        <label>
          Remarks
          <input value={remarks} onChange={(e) => setRemarks(e.target.value)} />
        </label>
        {(data?.tags.length ?? 0) > 0 && (
          <div className="form-block">
            <div className="chip-label">Tags</div>
            <div className="filter-chips" style={{ marginTop: 6 }}>
              {data?.tags.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className={`tag-chip ${tagIds.includes(t.id) ? 'on' : ''}`}
                  onClick={() => toggleTag(t.id)}
                >
                  {t.name}
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="filter-chips form-block">
          <button type="button" className={`chip-btn ${isFavorite ? 'active' : ''}`} onClick={() => setIsFavorite((v) => !v)}>
            ★ Favorite
          </button>
          <button type="button" className={`chip-btn ${isPinned ? 'active' : ''}`} onClick={() => setIsPinned((v) => !v)}>
            Pin
          </button>
        </div>
      </div>
    </Modal>
  )
}
