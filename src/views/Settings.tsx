import React, { useState } from 'react'
import { useApp } from '../context/AppContext'
import * as storage from '../storage/local'
import { getRepoConfig } from '../api/github'
import { seedStats } from '../data/seed'
import { APPS_SCRIPT_SOURCE, parseSpreadsheetId, testSheetWebApp } from '../api/sheets'
import { toast } from '../utils/toast'

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
    sheetConfig,
    saveSheetConfig,
    uploadToSheet,
    loadSheetColumns,
    sheetPendingCount,
    loading,
  } = useApp()
  const [newTagName, setNewTagName] = useState('')
  const [sheetUrl, setSheetUrl] = useState(sheetConfig.spreadsheetUrl)
  const [sheetName, setSheetName] = useState(sheetConfig.sheetName)
  const [webAppUrl, setWebAppUrl] = useState(sheetConfig.webAppUrl)
  const [showScript, setShowScript] = useState(false)
  const cfg = getRepoConfig()
  const stats = seedStats()
  const parsedId = parseSpreadsheetId(sheetUrl)

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

  function saveSheet() {
    if (sheetUrl.trim() && !parseSpreadsheetId(sheetUrl)) {
      toast('Invalid Google Sheet link', 'error')
      return
    }
    saveSheetConfig({
      spreadsheetUrl: sheetUrl.trim(),
      sheetName: sheetName.trim() || 'Sheet1',
      webAppUrl: webAppUrl.trim(),
    })
  }

  async function copyScript() {
    try {
      await navigator.clipboard.writeText(APPS_SCRIPT_SOURCE)
      toast('Apps Script copied', 'success')
    } catch {
      toast('Copy failed — select and copy manually', 'error')
    }
  }

  async function handleTestWebApp() {
    if (!webAppUrl.trim()) {
      toast('Paste Web App URL first', 'error')
      return
    }
    try {
      const res = await testSheetWebApp(webAppUrl)
      toast(`Connected: ${res.message}`, 'success')
    } catch (err: any) {
      toast(err.message || 'Test failed', 'error')
    }
  }

  async function handleLoadColumns() {
    // ensure latest URL fields saved first
    saveSheetConfig(
      {
        spreadsheetUrl: sheetUrl.trim(),
        sheetName: sheetName.trim() || 'Sheet1',
        webAppUrl: webAppUrl.trim(),
      },
      true
    )
    try {
      await loadSheetColumns()
    } catch {
      /* toasted */
    }
  }

  async function handleUpload() {
    const n = sheetPendingCount
    if (!n) {
      toast('No pending sheet rows — add from Sheet Form', 'info')
      return
    }
    if (!confirm(`Upload ${n} row(s) to Google Sheet (append at the end)?`)) return
    try {
      await uploadToSheet()
    } catch {
      /* toasted */
    }
  }

  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">Preferences</div>
          <h1>Settings</h1>
          <p>Sync, Google Sheet (dynamic form), import, theme, tags, and backup.</p>
        </div>
      </div>

      <div className="settings-block highlight-block">
        <h3>Google Sheet</h3>
        <p style={{ color: 'var(--muted)', fontSize: 13, margin: '0 0 12px', lineHeight: 1.5 }}>
          Connect your <strong>existing team spreadsheet</strong>. DevLog reads row-1 headers and builds a
          dynamic form (<strong>Sheet Form</strong>). Upload appends rows at the bottom in your columns
          (e.g. n, Assigned To, End Date, STATUS, Remark). Update Apps Script if you used an older version.
        </p>

        <label className="sheet-field">
          Spreadsheet link
          <input
            value={sheetUrl}
            onChange={(e) => setSheetUrl(e.target.value)}
            placeholder="https://docs.google.com/spreadsheets/d/...."
          />
        </label>
        {sheetUrl.trim() && (
          <p className="mono" style={{ marginTop: 6 }}>
            ID: {parsedId || '⚠️ could not parse — check URL'}
          </p>
        )}

        <label className="sheet-field">
          Tab / sheet name
          <input
            value={sheetName}
            onChange={(e) => setSheetName(e.target.value)}
            placeholder="Sheet1"
          />
        </label>

        <label className="sheet-field">
          Apps Script Web App URL
          <input
            value={webAppUrl}
            onChange={(e) => setWebAppUrl(e.target.value)}
            placeholder="https://script.google.com/macros/s/.../exec"
          />
        </label>

        <div className="settings-row" style={{ marginTop: 12 }}>
          <button type="button" className="primary-btn" onClick={saveSheet}>
            Save Sheet settings
          </button>
          <button type="button" className="soft-btn" onClick={() => setShowScript((v) => !v)}>
            {showScript ? 'Hide' : 'Show'} setup script
          </button>
          <button type="button" className="soft-btn" onClick={handleTestWebApp}>
            Test Web App
          </button>
          <button type="button" className="soft-btn" onClick={handleLoadColumns} disabled={loading}>
            ↓ Load columns
          </button>
          <button
            type="button"
            className={`soft-btn ${sheetPendingCount ? 'sync-hot' : ''}`}
            onClick={handleUpload}
            disabled={loading}
          >
            ↑ Upload {sheetPendingCount > 0 ? `(${sheetPendingCount})` : ''}
          </button>
          {sheetConfig.spreadsheetUrl && (
            <a
              className="soft-btn"
              href={sheetConfig.spreadsheetUrl}
              target="_blank"
              rel="noreferrer"
              style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}
            >
              Open Sheet ↗
            </a>
          )}
        </div>

        <p className="mono" style={{ marginTop: 10 }}>
          Columns: {sheetConfig.headers?.length ? sheetConfig.headers.join(' | ') : 'not loaded'} ·
          Pending: {sheetPendingCount} · Last upload:{' '}
          {sheetConfig.lastUploadAt
            ? new Date(sheetConfig.lastUploadAt).toLocaleString()
            : 'never'}
        </p>

        {showScript && (
          <div className="sheet-script-box">
            <div className="settings-row" style={{ marginBottom: 8 }}>
              <strong style={{ fontSize: 13 }}>Setup (once)</strong>
              <button type="button" className="soft-btn" onClick={copyScript}>
                Copy script
              </button>
            </div>
            <ol className="sheet-steps">
              <li>Open your existing Google Sheet</li>
              <li>
                <strong>Extensions → Apps Script</strong> → paste the script → Save
              </li>
              <li>
                <strong>Deploy → New deployment → Web app</strong>
                <br />
                Execute as: <em>Me</em> · Who has access: <em>Anyone</em>
                <br />
                (Not “Anyone with Google account” — that causes 401/403)
              </li>
              <li>Copy the Web App URL here and Save</li>
              <li>
                Open the <code>/exec</code> URL once in Chrome → click <strong>Allow</strong> if asked
              </li>
              <li>Click <strong>Test Web App</strong>, then <strong>Load columns</strong></li>
              <li>Open sidebar <strong>Sheet Form</strong> to fill rows → Upload</li>
            </ol>
            <textarea className="sheet-script" readOnly value={APPS_SCRIPT_SOURCE} rows={12} />
          </div>
        )}
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
