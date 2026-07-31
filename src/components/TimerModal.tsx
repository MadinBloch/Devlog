import React, { useEffect, useMemo, useState } from 'react'
import Modal from './Modal'
import { useApp } from '../context/AppContext'
import { pendingTasks, boardName, TYPE_LABELS } from '../utils/helpers'

const PRESETS = [15, 25, 30, 45, 60]

export default function TimerModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data, startTimer } = useApp()
  const [q, setQ] = useState('')
  const [selectedId, setSelectedId] = useState('')
  const [estimate, setEstimate] = useState('30')
  const [custom, setCustom] = useState('')

  useEffect(() => {
    if (!open) return
    setQ('')
    setSelectedId('')
    setEstimate('30')
    setCustom('')
  }, [open])

  const list = useMemo(() => {
    if (!data) return []
    return pendingTasks(data.tasks).filter((t) =>
      (t.title + t.description + t.boardId).toLowerCase().includes(q.toLowerCase())
    )
  }, [data, q])

  const selected = data?.tasks.find((t) => t.id === selectedId)

  if (!open) return null

  function start() {
    if (!selectedId) return
    const mins = custom ? Number(custom) : Number(estimate)
    startTimer(selectedId, mins || 30)
    onClose()
  }

  return (
    <Modal
      title="Start timer"
      subtitle="Pick a pending task and estimate"
      onClose={onClose}
      wide
      footer={
        <div className="timer-footer">
          <div className="timer-estimate-block compact">
            <span className="chip-label">Estimate</span>
            <div className="estimate-hints">
              {PRESETS.map((m) => (
                <button
                  key={m}
                  type="button"
                  className={`est-chip ${estimate === String(m) && !custom ? 'is-on' : ''}`}
                  onClick={() => {
                    setEstimate(String(m))
                    setCustom('')
                  }}
                >
                  {m}m
                </button>
              ))}
            </div>
            <label className="custom-minutes inline-custom">
              Custom
              <input value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="40" />
              <span className="small-unit">min</span>
            </label>
          </div>
          <div className="modal-actions sticky-actions">
            <button type="button" className="soft-btn" onClick={onClose}>
              Cancel
            </button>
            <button type="button" className="primary-btn" onClick={start} disabled={!selectedId}>
              Start timer
            </button>
          </div>
        </div>
      }
    >
      {selected && (
        <div className="timer-selected">
          <div className="timer-selected-top">
            <span className="chip-label">Selected</span>
          </div>
          <strong>{selected.title}</strong>
          <small>
            {boardName(data?.boards || [], selected.boardId)} · {TYPE_LABELS[selected.type]} · {selected.priority}
          </small>
        </div>
      )}

      <div className="timer-picker timer-picker-fixed">
        <label className="timer-search-label">
          <span>⌕</span>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter pending tasks…" autoFocus />
        </label>
        <div className="timer-task-list">
          {list.length === 0 && <div className="timer-empty">No pending tasks match</div>}
          {list.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`timer-pick ${selectedId === t.id ? 'is-selected' : ''}`}
              onClick={() => setSelectedId(t.id)}
              onDoubleClick={() => {
                const mins = custom ? Number(custom) : Number(estimate) || 30
                startTimer(t.id, mins)
                onClose()
              }}
            >
              <span className="timer-pick-title">{t.title}</span>
              <span className="timer-pick-meta">
                {boardName(data?.boards || [], t.boardId)} · {t.priority}
              </span>
            </button>
          ))}
        </div>
      </div>
      <p className="timer-tip">Tip: double-click a task to start immediately</p>
    </Modal>
  )
}
