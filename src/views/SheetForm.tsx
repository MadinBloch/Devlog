import React, { useEffect, useMemo, useState } from 'react'
import { useApp } from '../context/AppContext'
import { getValueForHeader, sanitizeSheetHeaders, suggestDefaultForHeader } from '../api/sheets'
import { sheetEntriesPendingUpload } from '../utils/normalize'
import { toast } from '../utils/toast'
import type { SheetEntry } from '../types'

function emptyForm(headers: string[], defaults: { assignedTo: string; status: string }) {
  const today = new Date().toISOString().slice(0, 10)
  const values: Record<string, string> = {}
  for (const h of headers) {
    values[h] = suggestDefaultForHeader(h, {
      assignedTo: defaults.assignedTo,
      status: defaults.status,
      today,
    })
  }
  return values
}

function isLongField(header: string) {
  return /^(remarks?|notes?|comments?|description)$/i.test(header.trim())
}

export default function SheetForm() {
  const {
    data,
    sheetConfig,
    loading,
    loadSheetColumns,
    addSheetEntry,
    editSheetEntry,
    softDeleteSheetEntry,
    uploadToSheet,
    sheetPendingCount,
    saveSheetConfig,
  } = useApp()

  const headers = useMemo(
    () => sanitizeSheetHeaders(sheetConfig.headers || []),
    [sheetConfig.headers]
  )

  const [form, setForm] = useState<Record<string, string>>({})
  const [assignedTo, setAssignedTo] = useState(sheetConfig.defaultAssignedTo || 'Madin')
  const [defaultStatus, setDefaultStatus] = useState(sheetConfig.defaultStatus || 'To Do')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValues, setEditValues] = useState<Record<string, string>>({})

  useEffect(() => {
    const raw = sheetConfig.headers || []
    const clean = sanitizeSheetHeaders(raw)
    if (raw.length && clean.join('|') !== raw.join('|')) {
      saveSheetConfig({ headers: clean }, true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    setAssignedTo(sheetConfig.defaultAssignedTo || 'Madin')
    setDefaultStatus(sheetConfig.defaultStatus || 'To Do')
  }, [sheetConfig.defaultAssignedTo, sheetConfig.defaultStatus])

  useEffect(() => {
    if (!headers.length) {
      setForm({})
      return
    }
    setForm(
      emptyForm(headers, {
        assignedTo: sheetConfig.defaultAssignedTo || 'Madin',
        status: sheetConfig.defaultStatus || 'To Do',
      })
    )
  }, [headers.join('|'), sheetConfig.defaultAssignedTo, sheetConfig.defaultStatus])

  const pending = useMemo(
    () => sheetEntriesPendingUpload(data?.sheetEntries),
    [data?.sheetEntries]
  )
  const uploaded = useMemo(
    () => (data?.sheetEntries || []).filter((e) => !e.deletedAt && e.uploadedAt).slice(0, 20),
    [data?.sheetEntries]
  )

  const connected = !!(sheetConfig.webAppUrl && sheetConfig.spreadsheetId)

  async function handleLoadColumns() {
    try {
      await loadSheetColumns()
    } catch {
      /* toasted */
    }
  }

  function handleSaveDefaults() {
    saveSheetConfig({
      defaultAssignedTo: assignedTo.trim(),
      defaultStatus: defaultStatus.trim() || 'To Do',
      headers,
    })
  }

  function resetForm() {
    setForm(
      emptyForm(headers, {
        assignedTo: sheetConfig.defaultAssignedTo || assignedTo,
        status: sheetConfig.defaultStatus || defaultStatus,
      })
    )
  }

  function handleAdd() {
    if (!headers.length) {
      toast('Load columns from your Sheet first', 'error')
      return
    }
    const hasAny = headers.some((h) => (form[h] || '').trim())
    if (!hasAny) {
      toast('Fill at least one field', 'error')
      return
    }
    const values: Record<string, string> = {}
    for (const h of headers) values[h] = (form[h] || '').trim()
    addSheetEntry(values)
    resetForm()
  }

  async function handleUpload() {
    if (!sheetPendingCount) {
      toast('No pending rows', 'info')
      return
    }
    if (!confirm(`Upload ${sheetPendingCount} row(s) to Google Sheet?`)) return
    try {
      await uploadToSheet()
    } catch {
      /* toasted */
    }
  }

  function startEdit(entry: SheetEntry) {
    const values: Record<string, string> = {}
    for (const h of headers) values[h] = getValueForHeader(entry.values, h)
    setEditingId(entry.id)
    setEditValues(values)
  }

  function saveEdit() {
    if (!editingId) return
    const values: Record<string, string> = {}
    for (const h of headers) values[h] = (editValues[h] || '').trim()
    editSheetEntry(editingId, values)
    setEditingId(null)
    setEditValues({})
    toast('Row updated', 'success')
  }

  function cancelEdit() {
    setEditingId(null)
    setEditValues({})
  }

  function cellInput(header: string, value: string, onChange: (v: string) => void) {
    if (isLongField(header)) {
      return (
        <textarea
          className="sheet-td-input"
          rows={2}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={header}
        />
      )
    }
    return (
      <input
        className="sheet-td-input"
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={header}
      />
    )
  }

  return (
    <div className="sheet-page">
      <div className="page-heading sheet-heading">
        <div>
          <div className="eyebrow">Team sheet</div>
          <h1>Sheet Form</h1>
          <p>Add rows here, then upload to your Google Sheet.</p>
        </div>
        {sheetPendingCount > 0 && (
          <span className="sheet-badge">{sheetPendingCount} pending upload</span>
        )}
      </div>

      {!connected && (
        <div className="settings-block">
          <h3>Connect Sheet first</h3>
          <p className="sheet-help">
            Go to <strong>Settings → Google Sheet</strong>, paste spreadsheet link + Apps Script Web App
            URL, Save, then come back here.
          </p>
        </div>
      )}

      {connected && (
        <div className="settings-block sheet-panel">
          <div className="sheet-panel-top">
            <div className="sheet-defaults">
              <label className="sheet-inline-field">
                Assigned To
                <input value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} />
              </label>
              <label className="sheet-inline-field">
                Status
                <input
                  value={defaultStatus}
                  onChange={(e) => setDefaultStatus(e.target.value)}
                  placeholder="To Do"
                />
              </label>
            </div>
            <div className="sheet-btn-group">
              <button type="button" className="soft-btn" onClick={handleSaveDefaults}>
                Save defaults
              </button>
              <button type="button" className="soft-btn" onClick={handleLoadColumns} disabled={loading}>
                Refresh columns
              </button>
              {sheetConfig.spreadsheetUrl && (
                <a
                  className="soft-btn"
                  href={sheetConfig.spreadsheetUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open Sheet ↗
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {connected && !headers.length && (
        <div className="settings-block">
          <p className="sheet-help" style={{ margin: 0 }}>
            Click <strong>Refresh columns</strong> to load your Sheet headers.
          </p>
        </div>
      )}

      {headers.length > 0 && (
        <div className="settings-block sheet-panel">
          <div className="sheet-table-head">
            <div>
              <h3>Rows</h3>
              <p className="sheet-submeta">
                {pending.length} pending · {uploaded.length} uploaded
              </p>
            </div>
          </div>

          <div className="sheet-table-wrap">
            <table className="sheet-table">
              <thead>
                <tr>
                  {headers.map((h) => (
                    <th key={h}>{h}</th>
                  ))}
                  <th className="sheet-th-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr className="sheet-row-new">
                  {headers.map((h) => (
                    <td key={h}>{cellInput(h, form[h] || '', (v) => setForm((f) => ({ ...f, [h]: v })))}</td>
                  ))}
                  <td className="sheet-td-actions">
                    <button type="button" className="primary-btn sheet-row-btn" onClick={handleAdd}>
                      + Add
                    </button>
                  </td>
                </tr>

                {pending.map((e) => (
                  <tr key={e.id}>
                    {headers.map((h) => (
                      <td key={h}>
                        {editingId === e.id
                          ? cellInput(h, editValues[h] || '', (v) =>
                              setEditValues((f) => ({ ...f, [h]: v }))
                            )
                          : (
                              <span className="sheet-cell-text">
                                {getValueForHeader(e.values, h) || '—'}
                              </span>
                            )}
                      </td>
                    ))}
                    <td className="sheet-td-actions">
                      {editingId === e.id ? (
                        <div className="sheet-row-btns">
                          <button type="button" className="primary-btn sheet-row-btn" onClick={saveEdit}>
                            Save
                          </button>
                          <button type="button" className="soft-btn sheet-row-btn" onClick={cancelEdit}>
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="sheet-row-btns">
                          <button type="button" className="soft-btn sheet-row-btn" onClick={() => startEdit(e)}>
                            Edit
                          </button>
                          <button
                            type="button"
                            className="soft-btn sheet-row-btn sheet-danger-btn"
                            onClick={() => softDeleteSheetEntry(e.id)}
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}

                {!pending.length && (
                  <tr>
                    <td colSpan={headers.length + 1} className="sheet-empty-cell">
                      No pending rows yet — fill the top row and click + Add.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="sheet-footer-bar">
            <button type="button" className="soft-btn" onClick={resetForm}>
              Clear form
            </button>
            <button
              type="button"
              className="primary-btn"
              onClick={handleUpload}
              disabled={!sheetPendingCount || loading}
            >
              ↑ Upload to Sheet{sheetPendingCount > 0 ? ` (${sheetPendingCount})` : ''}
            </button>
          </div>
        </div>
      )}

      {uploaded.length > 0 && headers.length > 0 && (
        <div className="settings-block sheet-panel">
          <div className="sheet-table-head">
            <h3>Recently uploaded</h3>
          </div>
          <div className="sheet-table-wrap">
            <table className="sheet-table sheet-table-muted">
              <thead>
                <tr>
                  {headers.map((h) => (
                    <th key={h}>{h}</th>
                  ))}
                  <th>When</th>
                </tr>
              </thead>
              <tbody>
                {uploaded.map((e) => (
                  <tr key={e.id}>
                    {headers.map((h) => (
                      <td key={h}>
                        <span className="sheet-cell-text">
                          {getValueForHeader(e.values, h) || '—'}
                        </span>
                      </td>
                    ))}
                    <td className="sheet-when">
                      {e.uploadedAt ? new Date(e.uploadedAt).toLocaleString() : ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
