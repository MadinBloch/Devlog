import React, { useEffect, useState } from 'react'
import Modal from './Modal'
import { Task } from '../types'
import { useApp } from '../context/AppContext'

function toLocalInput(iso?: string | null) {
  const d = iso ? new Date(iso) : new Date()
  if (Number.isNaN(d.getTime())) {
    const n = new Date()
    return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}T${String(n.getHours()).padStart(2, '0')}:${String(n.getMinutes()).padStart(2, '0')}`
  }
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function CompleteModal({
  task,
  onClose,
}: {
  task: Task | null
  onClose: () => void
}) {
  const { completeTask } = useApp()
  const [commit, setCommit] = useState('')
  const [notes, setNotes] = useState('')
  const [hours, setHours] = useState('')
  const [completedAt, setCompletedAt] = useState(toLocalInput())

  useEffect(() => {
    if (!task) return
    setCommit(task.gitCommit || '')
    setNotes(task.remarks || '')
    setHours(task.actualHours != null ? String(task.actualHours) : '')
    setCompletedAt(toLocalInput())
  }, [task])

  if (!task) return null

  function submit() {
    const iso = completedAt ? new Date(completedAt).toISOString() : new Date().toISOString()
    completeTask(task!.id, {
      commit: commit.trim(),
      notes: notes.trim(),
      actualHours: hours ? Number(hours) : task!.actualHours ?? undefined,
      completedAt: iso,
    })
    onClose()
  }

  return (
    <Modal
      title="Mark as complete"
      subtitle={task.title}
      onClose={onClose}
      footer={
        <div className="modal-actions sticky-actions">
          <button type="button" className="soft-btn" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="primary-btn" onClick={submit}>
            Mark complete
          </button>
        </div>
      }
    >
      <label>
        Git commit <span className="optional">(optional)</span>
        <input value={commit} onChange={(e) => setCommit(e.target.value)} placeholder="abc1234" autoFocus />
      </label>
      <label>
        Completion notes
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="What shipped?" />
      </label>
      <div className="modal-fields">
        <label>
          Completed at
          <input type="datetime-local" value={completedAt} onChange={(e) => setCompletedAt(e.target.value)} />
        </label>
        <label>
          Actual hours
          <input value={hours} onChange={(e) => setHours(e.target.value)} placeholder="e.g. 1.5" />
        </label>
      </div>
    </Modal>
  )
}
