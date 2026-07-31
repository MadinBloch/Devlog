import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { DevLogData, Task, Board, Tag } from '../types'
import * as storage from '../storage/local'
import { fetchTasksFromGit, createEmptyFile, pushTasksToGit } from '../api/github'
import { toast } from '../utils/toast'
import { pendingTasks, completedTasks } from '../utils/helpers'
import { getLaravelSeed } from '../data/seed'

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
  addTask: (partial: Partial<Task> & { title: string }) => Task | undefined
  editTask: (id: string, changes: Partial<Task>) => void
  softDeleteTask: (id: string) => void
  completeTask: (id: string, opts?: { commit?: string; notes?: string; actualHours?: number }) => void
  reopenTask: (id: string) => void
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
  importLaravelData: () => void
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
    const stamped = { ...next, updatedAt: new Date().toISOString() }
    storage.saveLocalData(stamped)
    setData(stamped)
    setDirty(true)
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

  function addTask(partial: Partial<Task> & { title: string }) {
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
      completedAt: null,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    }
    updateData({ ...data, tasks: [task, ...data.tasks] })
    toast('Task added', 'success')
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

  function completeTask(id: string, opts?: { commit?: string; notes?: string; actualHours?: number }) {
    if (!data) return
    const now = new Date().toISOString()
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
              updatedAt: now,
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

  const pendingCount = useMemo(() => (data ? pendingTasks(data.tasks).length : 0), [data])
  const completedCount = useMemo(() => (data ? completedTasks(data.tasks).length : 0), [data])

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
    importLaravelData,
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
