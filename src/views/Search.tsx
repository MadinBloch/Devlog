import React, { useMemo } from 'react'
import { useApp } from '../context/AppContext'
import { Task } from '../types'
import TaskRow from '../components/TaskRow'
import { activeTasks } from '../utils/helpers'

export default function Search({
  onEdit,
  onComplete,
}: {
  onEdit: (t: Task) => void
  onComplete: (t: Task) => void
}) {
  const { data, search, setSearch } = useApp()

  const results = useMemo(() => {
    if (!data || !search.trim()) return []
    const q = search.toLowerCase()
    return activeTasks(data.tasks).filter((t) =>
      [t.title, t.description, t.remarks, t.gitCommit, t.branch].join(' ').toLowerCase().includes(q)
    )
  }, [data, search])

  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">Find</div>
          <h1>Search</h1>
          <p>Search titles, notes, commits, and branches.</p>
        </div>
      </div>
      <div className="report-tools">
        <label className="global-search" style={{ width: '100%', maxWidth: 560 }}>
          <span>⌕</span>
          <input data-search value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search…" autoFocus />
        </label>
      </div>
      <div className="queue-list">
        <div className="card queue-board">
          <div className="queue-board-head">
            <h2>Results</h2>
            <span className="queue-count">{results.length}</span>
          </div>
          <div className="queue-rows">
            {!search.trim() && <div className="empty" style={{ padding: 20 }}>Type to search.</div>}
            {search.trim() && results.length === 0 && <div className="empty" style={{ padding: 20 }}>No matches.</div>}
            {results.map((t) => (
              <TaskRow key={t.id} task={t} onEdit={onEdit} onComplete={onComplete} showDoneMeta={t.status === 'completed'} />
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
