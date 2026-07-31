import React from 'react'
import { useApp } from '../context/AppContext'
import * as storage from '../storage/local'

export default function Header({
  onNewTask,
  onOpenTimer,
  onOpenSearch,
}: {
  onNewTask: () => void
  onOpenTimer: () => void
  onOpenSearch?: () => void
}) {
  const { fetchRemote, pushLocal, dirty, loading, search, setSearch, logout } = useApp()

  async function handleFetch() {
    if (dirty && !confirm('Unsaved local changes will be overwritten. Continue?')) return
    try {
      await fetchRemote(true)
    } catch {
      /* toasted */
    }
  }

  async function handlePush() {
    if (!dirty && !confirm('No local changes. Force push anyway?')) return
    try {
      await pushLocal()
    } catch {
      /* toasted */
    }
  }

  const last = storage.getLastSynced()
  const lastLabel = last ? new Date(last).toLocaleString() : 'never'

  return (
    <header>
      <div className="mobile-brand">D</div>
      <label className="global-search">
        <span>⌕</span>
        <input
          data-search
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onFocus={() => onOpenSearch?.()}
          placeholder="Search tasks, commits, and notes"
        />
        <kbd>/</kbd>
      </label>
      {loading && <span className="loading-dot" />}
      <div className="header-sync">
        <span className={`sync-badge ${dirty ? 'dirty' : ''}`}>
          {dirty ? '● Unsaved' : '✓ Synced'} · {lastLabel}
        </span>
        <button type="button" className="soft-btn" onClick={handleFetch} disabled={loading}>
          ↓ Fetch
        </button>
        <button type="button" className="soft-btn" onClick={handlePush} disabled={loading}>
          ↑ Sync
        </button>
        <button type="button" className="soft-btn header-timer-btn" onClick={onOpenTimer}>
          ⏱ Timer
        </button>
        <button type="button" className="new-btn" onClick={onNewTask}>
          + New task
        </button>
        <button type="button" className="soft-btn" onClick={() => confirm('Logout?') && logout()}>
          Logout
        </button>
      </div>
    </header>
  )
}
