import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { DevLogData, Task, Board, Tag, Note, SheetEntry } from '../types'
import * as storage from '../storage/local'
import type { SheetConfig } from '../storage/local'
import { fetchTasksFromGit, createEmptyFile, pushTasksToGit } from '../api/github'
import {
  parseSpreadsheetId,
  fetchSheetHeaders,
  appendSheetRows,
  valuesToRow,
  valuesToRowMap,
  mapTaskToSheetValues,
  sanitizeSheetHeaders,
} from '../api/sheets'
import { toast } from '../utils/toast'
import { pendingTasks, completedTasks } from '../utils/helpers'
import { getLaravelSeed } from '../data/seed'
import { normalizeData, sheetEntriesPendingUpload } from '../utils/normalize'

type AppCtx = {
  token: string | null
  data: DevLogData | null
  dirty: boolean
  loading: boolean
  theme: 'light' | 'dark'
  search: string
  setSearch: (v: string) => void
  setTheme: (t: 'light' | 'dark') => void
  loginWithToken: (t: string) => Promise<void>
  logout: () => void
  fetchRemote: (force?: boolean) => Promise<{ ok?: boolean; conflict?: boolean } | void>
  pushLocal: () => Promise<{ ok?: boolean; sha_mismatch?: boolean } | void>
  addTask: (
    partial: Partial<Task> & { title: string },
    opts?: { queueForSheet?: boolean; uploadNow?: boolean }
  ) => Task | undefined
  editTask: (id: string, changes: Partial<Task>) => void
  softDeleteTask: (id: string) => void
  completeTask: (id: string, opts?: { commit?: string; notes?: string; actualHours?: number; completedAt?: string }) => void
  reopenTask: (id: string) => void
  duplicateTask: (id: string) => void
  toggleFavorite: (id: string) => void
  togglePin: (id: string) => void
  startTimer: (taskId: string, estimateMinutes?: number) => void
  stopTimer: (taskId: string, stopAndComplete?: boolean) => void
  addBoard: (partial: Partial<Board> & { name: string }) => Board | undefined
  editBoard: (id: string, changes: Partial<Board>) => void
  deleteBoard: (id: string) => void
  addTag: (partial: Partial<Tag> & { name: string }) => Tag | undefined
  editTag: (id: string, changes: Partial<Tag>) => void
  deleteTag: (id: string) => void
  addNote: (partial?: Partial<Note> & { title?: string; body?: string }) => Note | undefined
  editNote: (id: string, changes: Partial<Note>) => void
  softDeleteNote: (id: string) => void
  toggleNotePin: (id: string) => void
  importLaravelData: () => void
  sheetConfig: SheetConfig
  saveSheetConfig: (cfg: Partial<SheetConfig> & { spreadsheetUrl?: string }) => SheetConfig
  loadSheetColumns: () => Promise<string[]>
  addSheetEntry: (values: Record<string, string>) => SheetEntry | undefined
  editSheetEntry: (id: string, values: Record<string, string>) => void
  softDeleteSheetEntry: (id: string) => void
  uploadToSheet: (
    snapshot?: DevLogData,
    onlyIds?: string[],
    opts?: { quiet?: boolean }
  ) => Promise<{ ok?: boolean; appended?: number } | void>
  sheetPendingCount: number
  pendingCount: number
  completedCount: number
}

const ctx = createContext<AppCtx | null>(null)

function emptySchema(): DevLogData {
  return getLaravelSeed()
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(storage.getToken())
  const [data, setData] = useState<DevLogData | null>(storage.loadLocalData())
  const [sha, setSha] = useState<string | null>(storage.getSha())
  const [dirty, setDirtyLocal] = useState(storage.isDirty())
  const [loading, setLoading] = useState(false)
  const [theme, setThemeState] = useState<'light' | 'dark'>(storage.getTheme())
  const [search, setSearch] = useState('')
  const [sheetConfig, setSheetConfig] = useState<SheetConfig>(() => {
    const cfg = storage.loadSheetConfig()
    if (cfg.headers?.length) {
      return { ...cfg, headers: sanitizeSheetHeaders(cfg.headers) }
    }
    return cfg
  })

  useEffect(() => {
    document.documentElement.classList.toggle('theme-dark', theme === 'dark')
    document.body.classList.toggle('theme-dark', theme === 'dark')
  }, [theme])

  useEffect(() => {
    if (token) void fetchRemote()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  function setDirty(v: boolean) {
    setDirtyLocal(v)
    storage.setDirty(v)
  }

  function setTheme(t: 'light' | 'dark') {
    setThemeState(t)
    storage.setTheme(t)
  }

  function updateData(next: DevLogData) {
    const stamped = normalizeData({ ...next, updatedAt: new Date().toISOString() })
    storage.saveLocalData(stamped)
    setData(stamped)
    setDirty(true)
    return stamped
  }

  async function loginWithToken(t: string) {
    setLoading(true)
    try {
      const res = await fetchTasksFromGit(t)
      if ('notFound' in res && res.notFound) {
        const seed = emptySchema()
        const created = await createEmptyFile(t, seed)
        storage.setToken(t)
        setToken(t)
        storage.saveLocalData(seed)
        storage.setSha(created.content.sha)
        setData(seed)
        setSha(created.content.sha)
        setDirty(false)
        storage.setLastSynced(new Date().toISOString())
        toast(`Created tasks.json with Laravel export (${seed.tasks.length} tasks)`, 'success')
      } else if ('data' in res) {
        storage.setToken(t)
        setToken(t)
        storage.saveLocalData(res.data)
        storage.setSha(res.sha)
        setData(res.data)
        setSha(res.sha)
        setDirty(false)
        storage.setLastSynced(new Date().toISOString())
        toast('Fetched latest from GitHub', 'success')
      }
    } finally {
      setLoading(false)
    }
  }

  async function fetchRemote(force = false) {
    if (!token) return
    if (dirty && !force) return { conflict: true }
    setLoading(true)
    try {
      const res = await fetchTasksFromGit(token)
      if ('notFound' in res && res.notFound) {
        const seed = emptySchema()
        const created = await createEmptyFile(token, seed)
        storage.saveLocalData(seed)
        storage.setSha(created.content.sha)
        setData(seed)
        setSha(created.content.sha)
        setDirty(false)
        storage.setLastSynced(new Date().toISOString())
        toast(`Created remote with Laravel export (${seed.tasks.length} tasks)`, 'success')
        return { ok: true }
      }
      if ('data' in res) {
        storage.saveLocalData(res.data)
        storage.setSha(res.sha)
        setData(res.data)
        setSha(res.sha)
        setDirty(false)
        storage.setLastSynced(new Date().toISOString())
        toast('Fetched latest from GitHub', 'success')
        return { ok: true }
      }
    } catch (err: any) {
      toast(err.message || 'Fetch failed', 'error')
      throw err
    } finally {
      setLoading(false)
    }
  }

  async function pushLocal() {
    if (!token || !data) throw new Error('missing')
    setLoading(true)
    try {
      const res = await pushTasksToGit(token, data, sha || undefined)
      storage.setSha(res.content.sha)
      setSha(res.content.sha)
      setDirty(false)
      storage.setLastSynced(new Date().toISOString())
      toast('Synced to GitHub', 'success')
      return { ok: true }
    } catch (err: any) {
      if (err.message === 'sha_mismatch') {
        toast('Remote changed — Fetch first', 'error')
        return { sha_mismatch: true }
      }
      toast(err.message || 'Sync failed', 'error')
      throw err
    } finally {
      setLoading(false)
    }
  }

  function logout() {
    storage.clearToken()
    setToken(null)
  }

  function addTask(
    partial: Partial<Task> & { title: string },
    opts?: { queueForSheet?: boolean; uploadNow?: boolean }
  ) {
    if (!data) return
    const now = new Date().toISOString()
    const task: Task = {
      id: `task_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      title: partial.title,
      description: partial.description || '',
      boardId: partial.boardId ?? data.boards[0]?.id ?? null,
      tagIds: partial.tagIds ?? [],
      status: partial.status ?? 'pending',
      priority: partial.priority ?? 'medium',
      type: partial.type ?? 'feature',
      workDate: partial.workDate ?? now.slice(0, 10),
      estimatedHours: partial.estimatedHours ?? null,
      actualHours: partial.actualHours ?? null,
      gitCommit: partial.gitCommit ?? '',
      branch: partial.branch ?? '',
      remarks: partial.remarks ?? '',
      isFavorite: partial.isFavorite ?? false,
      isPinned: partial.isPinned ?? false,
      timerStartedAt: null,
      timerEstimateMinutes: partial.timerEstimateMinutes ?? null,
      completedAt: (partial.status ?? 'pending') === 'completed' ? (partial.completedAt ?? now) : null,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      sheetUploadedAt: null,
    }

    const headers = sheetConfig.headers || []
    const canSheet = headers.length > 0 && !!sheetConfig.spreadsheetId
    const queueForSheet = !!opts?.queueForSheet && canSheet
    let sheetEntries = data.sheetEntries || []
    let queuedEntryId: string | null = null

    if (queueForSheet) {
      const values = mapTaskToSheetValues(task, headers, {
        assignedTo: sheetConfig.defaultAssignedTo || 'Madin',
        statusTodo: sheetConfig.defaultStatus || 'To Do',
        statusDone: 'Done',
      })
      queuedEntryId = `sentry_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
      const entry: SheetEntry = {
        id: queuedEntryId,
        values,
        uploadedAt: null,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      }
      sheetEntries = [entry, ...sheetEntries]
    }

    const next = updateData({ ...data, tasks: [task, ...data.tasks], sheetEntries })

    if (queueForSheet && opts?.uploadNow && queuedEntryId) {
      void uploadToSheet(next, [queuedEntryId], { quiet: true })
        .then((res) => {
          if (res && 'appended' in res) {
            toast('Task added · uploaded to Sheet', 'success')
          }
        })
        .catch(() => {
          toast('Task added · Sheet upload failed (row still pending)', 'error')
        })
    } else if (queueForSheet) {
      toast('Task added · queued for Sheet upload', 'success')
    } else {
      toast('Task added', 'success')
    }
    return task
  }

  function editTask(id: string, changes: Partial<Task>) {
    if (!data) return
    const now = new Date().toISOString()
    updateData({
      ...data,
      tasks: data.tasks.map((t) => (t.id === id ? { ...t, ...changes, updatedAt: now } : t)),
    })
  }

  function softDeleteTask(id: string) {
    if (!data) return
    const now = new Date().toISOString()
    updateData({
      ...data,
      tasks: data.tasks.map((t) => (t.id === id ? { ...t, deletedAt: now, timerStartedAt: null, updatedAt: now } : t)),
    })
    toast('Task deleted', 'info')
  }

  function completeTask(id: string, opts?: { commit?: string; notes?: string; actualHours?: number; completedAt?: string }) {
    if (!data) return
    const now = opts?.completedAt || new Date().toISOString()
    updateData({
      ...data,
      tasks: data.tasks.map((t) =>
        t.id === id
          ? {
              ...t,
              status: 'completed',
              gitCommit: opts?.commit ?? t.gitCommit,
              remarks: opts?.notes !== undefined ? opts.notes : t.remarks,
              actualHours: opts?.actualHours ?? t.actualHours,
              completedAt: now,
              timerStartedAt: null,
              updatedAt: new Date().toISOString(),
            }
          : t
      ),
    })
    toast('Task completed', 'success')
  }

  function reopenTask(id: string) {
    if (!data) return
    const now = new Date().toISOString()
    updateData({
      ...data,
      tasks: data.tasks.map((t) =>
        t.id === id
          ? { ...t, status: 'pending', completedAt: null, updatedAt: now }
          : t
      ),
    })
    toast('Task reopened', 'success')
  }

  function duplicateTask(id: string) {
    if (!data) return
    const src = data.tasks.find((t) => t.id === id)
    if (!src) return
    const now = new Date().toISOString()
    const copy: Task = {
      ...src,
      id: `task_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      title: `${src.title} (copy)`,
      status: 'pending',
      completedAt: null,
      timerStartedAt: null,
      actualHours: null,
      gitCommit: '',
      isFavorite: false,
      isPinned: false,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      workDate: now.slice(0, 10),
      sheetUploadedAt: null,
    }
    updateData({ ...data, tasks: [copy, ...data.tasks] })
    toast('Task duplicated', 'success')
  }

  function importLaravelData() {
    const seed = getLaravelSeed()
    updateData(seed)
    toast(`Imported ${seed.tasks.length} tasks from Laravel SQLite`, 'success')
  }

  function toggleFavorite(id: string) {
    if (!data) return
    const t = data.tasks.find((x) => x.id === id)
    if (!t) return
    editTask(id, { isFavorite: !t.isFavorite })
  }

  function togglePin(id: string) {
    if (!data) return
    const t = data.tasks.find((x) => x.id === id)
    if (!t) return
    editTask(id, { isPinned: !t.isPinned })
  }

  function startTimer(taskId: string, estimateMinutes?: number) {
    if (!data) return
    const now = new Date().toISOString()
    updateData({
      ...data,
      tasks: data.tasks.map((t) =>
        t.id === taskId
          ? { ...t, timerStartedAt: now, timerEstimateMinutes: estimateMinutes ?? t.timerEstimateMinutes ?? 30, updatedAt: now }
          : { ...t, timerStartedAt: null }
      ),
    })
  }

  function stopTimer(taskId: string, stopAndComplete = false) {
    if (!data) return
    const now = new Date().toISOString()
    updateData({
      ...data,
      tasks: data.tasks.map((t) => {
        if (t.id !== taskId || !t.timerStartedAt) return t
        const elapsedHours = Math.round(((Date.now() - new Date(t.timerStartedAt).getTime()) / 3600000) * 100) / 100
        return {
          ...t,
          timerStartedAt: null,
          actualHours: (t.actualHours || 0) + elapsedHours,
          updatedAt: now,
          status: stopAndComplete ? 'completed' : t.status,
          completedAt: stopAndComplete ? now : t.completedAt,
        }
      }),
    })
  }

  function addBoard(partial: Partial<Board> & { name: string }) {
    if (!data) return
    const board: Board = {
      id: `board_${Date.now()}`,
      name: partial.name,
      color: partial.color ?? '#6366f1',
      position: data.boards.length,
    }
    updateData({ ...data, boards: [...data.boards, board] })
    return board
  }

  function editBoard(id: string, changes: Partial<Board>) {
    if (!data) return
    updateData({ ...data, boards: data.boards.map((b) => (b.id === id ? { ...b, ...changes } : b)) })
  }

  function deleteBoard(id: string) {
    if (!data) return
    updateData({
      ...data,
      boards: data.boards.filter((b) => b.id !== id),
      tasks: data.tasks.map((t) => (t.boardId === id ? { ...t, boardId: null } : t)),
    })
  }

  function addTag(partial: Partial<Tag> & { name: string }) {
    if (!data) return
    const tag: Tag = { id: `tag_${Date.now()}`, name: partial.name, color: partial.color ?? '#64748b' }
    updateData({ ...data, tags: [...data.tags, tag] })
    return tag
  }

  function editTag(id: string, changes: Partial<Tag>) {
    if (!data) return
    updateData({ ...data, tags: data.tags.map((t) => (t.id === id ? { ...t, ...changes } : t)) })
  }

  function deleteTag(id: string) {
    if (!data) return
    updateData({
      ...data,
      tags: data.tags.filter((t) => t.id !== id),
      tasks: data.tasks.map((tsk) => ({ ...tsk, tagIds: tsk.tagIds.filter((x) => x !== id) })),
    })
  }

  function addNote(partial?: Partial<Note> & { title?: string; body?: string }) {
    if (!data) return
    const now = new Date().toISOString()
    const note: Note = {
      id: `note_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      title: (partial?.title || '').trim(),
      body: (partial?.body || '').trim(),
      color: partial?.color || 'default',
      isPinned: partial?.isPinned ?? false,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    }
    updateData({ ...data, notes: [note, ...(data.notes || [])] })
    toast('Note added', 'success')
    return note
  }

  function editNote(id: string, changes: Partial<Note>) {
    if (!data) return
    const now = new Date().toISOString()
    updateData({
      ...data,
      notes: (data.notes || []).map((n) => (n.id === id ? { ...n, ...changes, updatedAt: now } : n)),
    })
  }

  function softDeleteNote(id: string) {
    if (!data) return
    const now = new Date().toISOString()
    updateData({
      ...data,
      notes: (data.notes || []).map((n) => (n.id === id ? { ...n, deletedAt: now, updatedAt: now } : n)),
    })
    toast('Note deleted', 'info')
  }

  function toggleNotePin(id: string) {
    if (!data) return
    const n = (data.notes || []).find((x) => x.id === id)
    if (!n) return
    editNote(id, { isPinned: !n.isPinned })
  }

  function saveSheetConfig(partial: Partial<SheetConfig> & { spreadsheetUrl?: string }, quiet = false) {
    const nextUrl = partial.spreadsheetUrl ?? sheetConfig.spreadsheetUrl
    const parsedId = parseSpreadsheetId(nextUrl) || partial.spreadsheetId || sheetConfig.spreadsheetId
    const headers =
      partial.headers !== undefined
        ? sanitizeSheetHeaders(partial.headers)
        : sheetConfig.headers
    const next: SheetConfig = {
      ...sheetConfig,
      ...partial,
      headers,
      spreadsheetUrl: nextUrl,
      spreadsheetId: parsedId || '',
    }
    storage.saveSheetConfig(next)
    setSheetConfig(next)
    if (!quiet) toast('Google Sheet settings saved', 'success')
    return next
  }

  async function loadSheetColumns() {
    if (!sheetConfig.webAppUrl.trim()) {
      toast('Add Apps Script Web App URL first', 'error')
      throw new Error('missing webAppUrl')
    }
    if (!sheetConfig.spreadsheetId) {
      toast('Paste a valid Google Sheet link first', 'error')
      throw new Error('missing spreadsheetId')
    }
    setLoading(true)
    try {
      const headers = await fetchSheetHeaders({
        webAppUrl: sheetConfig.webAppUrl,
        spreadsheetId: sheetConfig.spreadsheetId,
        sheetName: sheetConfig.sheetName || 'Sheet1',
      })
      saveSheetConfig({ headers }, true)
      toast(`Loaded ${headers.length} columns from Sheet`, 'success')
      return headers
    } catch (err: any) {
      toast(err.message || 'Failed to load columns', 'error')
      throw err
    } finally {
      setLoading(false)
    }
  }

  function addSheetEntry(values: Record<string, string>) {
    if (!data) return
    const now = new Date().toISOString()
    const entry: SheetEntry = {
      id: `sentry_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      values: { ...values },
      uploadedAt: null,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    }
    updateData({
      ...data,
      sheetEntries: [entry, ...(data.sheetEntries || [])],
    })
    toast('Sheet row saved (pending upload)', 'success')
    return entry
  }

  function editSheetEntry(id: string, values: Record<string, string>) {
    if (!data) return
    const now = new Date().toISOString()
    updateData({
      ...data,
      sheetEntries: (data.sheetEntries || []).map((e) =>
        e.id === id ? { ...e, values: { ...values }, updatedAt: now, uploadedAt: null } : e
      ),
    })
  }

  function softDeleteSheetEntry(id: string) {
    if (!data) return
    const now = new Date().toISOString()
    updateData({
      ...data,
      sheetEntries: (data.sheetEntries || []).map((e) =>
        e.id === id ? { ...e, deletedAt: now, updatedAt: now } : e
      ),
    })
    toast('Sheet row removed', 'info')
  }

  async function uploadToSheet(
    snapshot?: DevLogData,
    onlyIds?: string[],
    opts?: { quiet?: boolean }
  ) {
    const source = snapshot || data
    if (!source) return
    if (!sheetConfig.webAppUrl.trim()) {
      toast('Add Apps Script Web App URL in Settings → Google Sheet', 'error')
      return
    }
    if (!sheetConfig.spreadsheetId) {
      toast('Paste a valid Google Sheet link in Settings', 'error')
      return
    }

    let pending = sheetEntriesPendingUpload(source.sheetEntries)
    if (onlyIds?.length) {
      const idSet = new Set(onlyIds)
      pending = pending.filter((e) => idSet.has(e.id))
    }
    if (!pending.length) {
      if (!opts?.quiet) toast('No pending sheet rows to upload', 'info')
      return { ok: true, appended: 0 }
    }

    setLoading(true)
    try {
      // Always re-read Sheet row-1 so column order matches the real spreadsheet
      const headers = await fetchSheetHeaders({
        webAppUrl: sheetConfig.webAppUrl,
        spreadsheetId: sheetConfig.spreadsheetId,
        sheetName: sheetConfig.sheetName || 'Sheet1',
      })
      saveSheetConfig({ headers }, true)

      const rowMaps = pending.map((e) => valuesToRowMap(headers, e.values))
      const rows = pending.map((e) => valuesToRow(headers, e.values))
      const res = await appendSheetRows({
        webAppUrl: sheetConfig.webAppUrl,
        spreadsheetId: sheetConfig.spreadsheetId,
        sheetName: sheetConfig.sheetName || 'Sheet1',
        headers,
        rows,
        rowMaps,
        skipDuplicates: false,
      })

      const now = new Date().toISOString()
      const uploadedIds = new Set(pending.map((e) => e.id))
      updateData({
        ...source,
        sheetEntries: (source.sheetEntries || []).map((e) =>
          uploadedIds.has(e.id) ? { ...e, uploadedAt: now, updatedAt: now } : e
        ),
      })

      const cfg = {
        ...sheetConfig,
        headers,
        lastUploadAt: now,
      }
      storage.saveSheetConfig(cfg)
      setSheetConfig(cfg)

      if (!opts?.quiet) toast(`Uploaded ${res.appended} row(s) to Sheet`, 'success')
      return { ok: true, appended: res.appended }
    } catch (err: any) {
      if (!opts?.quiet) toast(err.message || 'Sheet upload failed', 'error')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const pendingCount = useMemo(() => (data ? pendingTasks(data.tasks).length : 0), [data])
  const completedCount = useMemo(() => (data ? completedTasks(data.tasks).length : 0), [data])
  const sheetPendingCount = useMemo(
    () => (data ? sheetEntriesPendingUpload(data.sheetEntries).length : 0),
    [data]
  )

  const value: AppCtx = {
    token,
    data,
    dirty,
    loading,
    theme,
    search,
    setSearch,
    setTheme,
    loginWithToken,
    logout,
    fetchRemote,
    pushLocal,
    addTask,
    editTask,
    softDeleteTask,
    completeTask,
    reopenTask,
    duplicateTask,
    toggleFavorite,
    togglePin,
    startTimer,
    stopTimer,
    addBoard,
    editBoard,
    deleteBoard,
    addTag,
    editTag,
    deleteTag,
    addNote,
    editNote,
    softDeleteNote,
    toggleNotePin,
    importLaravelData,
    sheetConfig,
    saveSheetConfig,
    loadSheetColumns,
    addSheetEntry,
    editSheetEntry,
    softDeleteSheetEntry,
    uploadToSheet,
    sheetPendingCount,
    pendingCount,
    completedCount,
  }

  return <ctx.Provider value={value}>{children}</ctx.Provider>
}

export function useApp() {
  const v = useContext(ctx)
  if (!v) throw new Error('useApp outside provider')
  return v
}
