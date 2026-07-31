import React, { useState } from 'react'
import Modal from './Modal'
import { Task } from '../types'
import { useApp } from '../context/AppContext'

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

  if (!task) return null

  function submit() {
    completeTask(task!.id, {
      commit: commit.trim(),
      notes: notes.trim() || task!.remarks,
      actualHours: hours ? Number(hours) : task!.actualHours ?? undefined,
    })
    onClose()
  }

  return (
    <Modal
      title="Complete task"
      subtitle={task.title}
      onClose={onClose}
    >
      <label>
        Git commit <span className="optional">(optional)</span>
        <input value={commit} onChange={(e) => setCommit(e.target.value)} placeholder="abc1234" />
      </label>
      <label>
        Notes
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="What shipped?" />
      </label>
      <label>
        Actual hours
        <input value={hours} onChange={(e) => setHours(e.target.value)} placeholder={String(task.actualHours ?? '')} />
      </label>
      <div className="modal-actions">
        <button type="button" className="soft-btn" onClick={onClose}>
          Cancel
        </button>
        <button type="button" className="primary-btn" onClick={submit}>
          Mark complete
        </button>
      </div>
    </Modal>
  )
}
