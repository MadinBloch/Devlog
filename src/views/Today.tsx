import React, { useMemo } from 'react'
import { useApp } from '../context/AppContext'
import { Task } from '../types'
import TaskRow from '../components/TaskRow'
import { pendingTasks, todayISO } from '../utils/helpers'

export default function Today({
  onEdit,
  onComplete,
}: {
  onEdit: (t: Task) => void
  onComplete: (t: Task) => void
}) {
  const { data } = useApp()
  const today = todayISO()

  const tasks = useMemo(() => {
    if (!data) return []
    return pendingTasks(data.tasks).filter((t) => t.workDate === today || !t.workDate)
  }, [data, today])

  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">Focus</div>
          <h1>Today&apos;s Work</h1>
          <p>Tasks dated {today} (and undated pending items).</p>
        </div>
      </div>
      <div className="queue-list">
        <div className="card queue-board">
          <div className="queue-board-head">
            <h2>Today</h2>
            <span className="queue-count">{tasks.length}</span>
          </div>
          <div className="queue-rows">
            {tasks.length === 0 && <div className="empty" style={{ padding: 20 }}>Nothing for today.</div>}
            {tasks.map((t) => (
              <TaskRow key={t.id} task={t} onEdit={onEdit} onComplete={onComplete} />
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
