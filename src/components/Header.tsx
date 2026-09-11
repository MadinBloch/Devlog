import React from 'react'
import { useApp } from '../context/AppContext'
import * as storage from '../storage/local'

export default function Header({
  onNewTask,
  onOpenTimer,
  onOpenSearch,
  onToggleNav,
}: {
  onNewTask: () => void
  onOpenTimer: () => void
  onOpenSearch?: () => void
  onToggleNav?: () => void
}) {
  const { fetchRemote, pushLocal, dirty, loading, search, setSearch, logout, uploadToSheet, sheetPendingCount, sheetConfig } =
    useApp()

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

  async function handleSheetUpload() {
    if (!sheetConfig.webAppUrl) {
      alert('Open Settings → Google Sheet, paste Sheet link + Apps Script URL, then use Sheet Form.')
      return
    }
    if (!sheetConfig.headers?.length) {
      alert('Open Sheet Form → Load columns first (reads your Sheet headers).')
      return
    }
    const n = sheetPendingCount
    if (!n) {
      alert('No pending sheet rows. Add rows in Sheet Form, then Upload.')
      return
    }
    if (!confirm(`Upload ${n} row(s) to Google Sheet?`)) return
    try {
      await uploadToSheet()
    } catch {
      /* toasted */
    }
  }

  const last = storage.getLastSynced()
  const lastLabel = last
    ? new Date(last).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : 'never'

  return (
    <header>
      <button type="button" className="mobile-brand" onClick={onToggleNav} title="Menu">
        D
      </button>
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
        <span className={`sync-badge ${dirty ? 'dirty' : ''}`} title={last ? new Date(last).toLocaleString() : ''}>
          {dirty ? '● Unsaved' : '✓ Synced'}
          <span className="sync-time">{lastLabel}</span>
        </span>
        <button type="button" className="soft-btn" onClick={handleFetch} disabled={loading} title="Pull from GitHub">
          ↓ Fetch
        </button>
        <button
          type="button"
          className={`soft-btn ${dirty ? 'sync-hot' : ''}`}
          onClick={handlePush}
          disabled={loading}
          title="Push to GitHub"
        >
          ↑ Sync
        </button>
        <button
          type="button"
          className={`soft-btn ${sheetPendingCount ? 'sync-hot' : ''}`}
          onClick={handleSheetUpload}
          disabled={loading}
          title="Append new tasks to Google Sheet"
        >
          ↑ Sheet{sheetPendingCount > 0 ? ` ${sheetPendingCount}` : ''}
        </button>
        <button type="button" className="soft-btn header-timer-btn" onClick={onOpenTimer}>
          ⏱ Timer
        </button>
        <button type="button" className="new-btn" onClick={onNewTask}>
          + New task
        </button>
        <button type="button" className="soft-btn logout-btn" onClick={() => confirm('Logout?') && logout()}>
          Logout
        </button>
      </div>
    </header>
  )
}
