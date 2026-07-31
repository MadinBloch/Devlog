import React, { useEffect, useState } from 'react'
import { useApp } from '../context/AppContext'
import { formatDuration } from '../utils/helpers'

export default function TimerBar() {
  const { data, stopTimer } = useApp()
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(id)
  }, [])

  const active = data?.tasks.find((t) => t.timerStartedAt && !t.deletedAt)
  if (!active?.timerStartedAt) return null

  const startedAtMs = new Date(active.timerStartedAt).getTime()
  const estimateMinutes = active.timerEstimateMinutes || 30
  const elapsedSec = Math.max(0, Math.floor((now - startedAtMs) / 1000))
  const estimateSec = Math.max(1, estimateMinutes * 60)
  const remainSec = estimateSec - elapsedSec
  const overtime = remainSec < 0
  const progress = Math.min(100, Math.round((elapsedSec / estimateSec) * 100))

  return (
    <div className="timer-bar">
      <div className="timer-bar-main timer-clock">
        <span className="timer-pulse" />
        <div className="timer-copy">
          <strong>{active.title}</strong>
          <div className="timer-metrics">
            <div className="timer-metric">
              <small>Elapsed</small>
              <b className="timer-digits">{formatDuration(elapsedSec)}</b>
            </div>
            <div className="timer-metric">
              <small>{overtime ? 'Overtime' : 'Remaining'}</small>
              <b className={`timer-digits ${overtime ? 'timer-over' : 'timer-left'}`}>
                {formatDuration(remainSec)}
              </b>
            </div>
            <div className="timer-metric">
              <small>Estimate</small>
              <b>{estimateMinutes}m</b>
            </div>
          </div>
          <div className="timer-progress">
            <i style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>
      <div className="timer-bar-actions">
        <button type="button" className="soft-btn" onClick={() => stopTimer(active.id)}>
          Stop
        </button>
        <button type="button" className="primary-btn" onClick={() => stopTimer(active.id, true)}>
          Stop & Complete
        </button>
      </div>
    </div>
  )
}
