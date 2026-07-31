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
  const { addTask, editTask, data } = useApp()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [boardId, setBoardId] = useState<string | null>(null)
  const [priority, setPriority] = useState<Priority>('medium')
  const [type, setType] = useState<TaskType>('feature')
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
    setPriority(task?.priority ?? 'medium')
    setType(task?.type ?? 'feature')
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
    const partial = {
      title: title.trim(),
      description,
      boardId,
      priority,
      type,
      tagIds,
      workDate: workDate || null,
      estimatedHours: estimatedHours ? Number(estimatedHours) : null,
      branch,
      remarks,
      isFavorite,
      isPinned,
    }
    if (task) editTask(task.id, partial)
    else addTask(partial)
    onClose()
  }

  return (
    <Modal title={task ? 'Edit task' : 'New task'} onClose={onClose}>
      <label>
        Title
        <input value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
      </label>
      <label>
        Description
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
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
          Work date
          <input type="date" value={workDate} onChange={(e) => setWorkDate(e.target.value)} />
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
          <input value={estimatedHours} onChange={(e) => setEstimatedHours(e.target.value)} />
        </label>
        <label>
          Branch
          <input value={branch} onChange={(e) => setBranch(e.target.value)} />
        </label>
      </div>
      <label>
        Remarks
        <input value={remarks} onChange={(e) => setRemarks(e.target.value)} />
      </label>
      <div style={{ marginTop: 12 }}>
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
      <div className="filter-chips" style={{ marginTop: 14 }}>
        <button type="button" className={`chip-btn ${isFavorite ? 'active' : ''}`} onClick={() => setIsFavorite((v) => !v)}>
          ★ Favorite
        </button>
        <button type="button" className={`chip-btn ${isPinned ? 'active' : ''}`} onClick={() => setIsPinned((v) => !v)}>
          📌 Pin
        </button>
      </div>
      <div className="modal-actions">
        <button type="button" className="soft-btn" onClick={onClose}>
          Cancel
        </button>
        <button type="button" className="primary-btn" onClick={save}>
          Save
        </button>
      </div>
    </Modal>
  )
}
