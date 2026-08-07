import React, { useState } from 'react'
import { useApp } from '../context/AppContext'
import * as storage from '../storage/local'
import { getRepoConfig } from '../api/github'
import { seedStats } from '../data/seed'

export default function Settings() {
  const {
    data,
    addTag,
    editTag,
    deleteTag,
    fetchRemote,
    pushLocal,
    dirty,
    theme,
    setTheme,
    importLaravelData,
  } = useApp()
  const [newTagName, setNewTagName] = useState('')
  const cfg = getRepoConfig()
  const stats = seedStats()

  function downloadBackup() {
    const raw = localStorage.getItem('devlog_data') || '{}'
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([raw], { type: 'application/json' }))
    a.download = `devlog_backup_${new Date().toISOString().slice(0, 10)}.json`
    a.click()
  }

  function doImport() {
    if (
      !confirm(
        `Replace current local data with Laravel SQLite export?\n\n${stats.tasks} tasks · ${stats.boards} boards · ${stats.pending} pending · ${stats.completed} completed\n\nThen click Sync to push to GitHub.`
      )
    ) {
      return
    }
    importLaravelData()
  }

  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">Preferences</div>
          <h1>Settings</h1>
          <p>Sync, import Laravel data, theme, tags, and backup.</p>
        </div>
      </div>

      <div className="settings-block highlight-block">
        <h3>Import from Laravel SQLite</h3>
        <p style={{ color: 'var(--muted)', fontSize: 13, margin: '0 0 10px', lineHeight: 1.5 }}>
          Loads the exported snapshot from your Laravel <code>database.sqlite</code>
          ({stats.tasks} tasks, {stats.boards} boards). This replaces local data and marks Unsaved —
          click <strong>↑ Sync</strong> to upload to GitHub.
        </p>
        <div className="settings-row">
          <button type="button" className="primary-btn" onClick={doImport}>
            Import Laravel data
          </button>
        </div>
      </div>

      <div className="settings-block">
        <h3>GitHub</h3>
        <p className="mono">
          {cfg.owner}/{cfg.repo} · {cfg.path}
        </p>
        <p className="mono">
          Local: {data?.tasks.filter((t) => !t.deletedAt).length ?? 0} tasks ·{' '}
          {data?.notes?.filter((n) => !n.deletedAt).length ?? 0} notes · Last synced:{' '}
          {storage.getLastSynced() || 'never'} {dirty ? '(unsaved)' : ''}
        </p>
        <div className="settings-row">
          <button type="button" className="soft-btn" onClick={() => fetchRemote(true)}>
            ↓ Fetch
          </button>
          <button type="button" className="soft-btn" onClick={() => pushLocal()}>
            ↑ Sync
          </button>
          <button type="button" className="soft-btn" onClick={downloadBackup}>
            Download backup JSON
          </button>
        </div>
      </div>

      <div className="settings-block">
        <h3>Theme</h3>
        <div className="settings-row">
          <button type="button" className={`chip-btn ${theme === 'light' ? 'active' : ''}`} onClick={() => setTheme('light')}>
            Light
          </button>
          <button type="button" className={`chip-btn ${theme === 'dark' ? 'active' : ''}`} onClick={() => setTheme('dark')}>
            Dark
          </button>
        </div>
      </div>

      <div className="settings-block">
        <h3>Tags</h3>
        <div className="settings-row">
          <input placeholder="New tag" value={newTagName} onChange={(e) => setNewTagName(e.target.value)} />
          <button
            type="button"
            className="primary-btn"
            onClick={() => {
              if (!newTagName.trim()) return
              addTag({ name: newTagName.trim() })
              setNewTagName('')
            }}
          >
            Create
          </button>
        </div>
        <div style={{ marginTop: 14, display: 'grid', gap: 8 }}>
          {data?.tags.length === 0 && <div className="empty">No tags yet.</div>}
          {data?.tags.map((t) => (
            <div key={t.id} className="focus-task" style={{ borderTop: '1px solid var(--line)' }}>
              <span className="board-dot" style={{ background: t.color }} />
              <div className="task-main">
                <strong>{t.name}</strong>
              </div>
              <button
                type="button"
                className="edit-task"
                onClick={() => {
                  const n = prompt('Name', t.name)
                  if (n) editTag(t.id, { name: n })
                }}
              >
                Edit
              </button>
              <button type="button" className="delete-task" onClick={() => confirm('Delete tag?') && deleteTag(t.id)}>
                Delete
              </button>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
