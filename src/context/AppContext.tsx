import React, { createContext, useContext, useEffect, useState } from 'react'
import { DevLogData, Task, Board, Tag } from '../types'
import * as storage from '../storage/local'
import { fetchTasksFromGit, createEmptyFile, pushTasksToGit } from '../api/github'

const ctx = createContext<any>(null)

const EMPTY_SCHEMA = ((): DevLogData => ({
  version: 1,
  updatedAt: new Date().toISOString(),
  boards: [
    { id: 'board_work', name: 'Work', color: '#0f766e', position: 0 },
    { id: 'board_personal', name: 'Personal', color: '#0ea5a4', position: 1 }
  ],
  tags: [
    { id: 'tag_bug', name: 'bug', color: '#dc2626' },
    { id: 'tag_feature', name: 'feature', color: '#0ea5a4' }
  ],
  tasks: [
    {
      id: `task_${Date.now()}`,
      title: 'Welcome to DevLog',
      description: 'This is a seeded task. Edit or delete it.',
      boardId: 'board_work',
      tagIds: ['tag_feature'],
      status: 'pending',
      priority: 'medium',
      type: 'feature',
      workDate: null,
      estimatedHours: null,
      actualHours: null,
      gitCommit: '',
      branch: '',
      remarks: '',
      isFavorite: false,
      isPinned: false,
      timerStartedAt: null,
      timerEstimateMinutes: null,
      completedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null
    }
  ]
}))

export const AppProvider = ({ children }: any) => {
  const [token, setToken] = useState<string | null>(storage.getToken())
  const [data, setData] = useState<DevLogData | null>(storage.loadLocalData())
  const [sha, setSha] = useState<string | null>(storage.getSha())
  const [dirty, setDirtyLocal] = useState<boolean>(storage.isDirty())
  const [loading, setLoading] = useState(false)
  const [dataLoaded, setDataLoaded] = useState(false)

  useEffect(() => {
    if (token) {
      // auto-fetch on mount after login
      (async () => {
        await fetchRemote()
      })()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  function setDirty(v: boolean){
    setDirtyLocal(v)
    storage.setDirty(v)
  }

  async function loginWithToken(t: string){
    setLoading(true)
    try{
      // Attempt to fetch file
      const res: any = await fetchTasksFromGit(t)
      if (res.notFound){
        // create empty file with seed
        const seed = EMPTY_SCHEMA()
        const created = await createEmptyFile(t, seed)
        storage.setToken(t)
        setToken(t)
        storage.saveLocalData(seed)
        storage.setSha(created.content.sha)
        setData(seed)
        setSha(created.content.sha)
        setDirty(false)
        storage.setLastSynced(new Date().toISOString())
        setDataLoaded(true)
      } else {
        storage.setToken(t)
        setToken(t)
        storage.saveLocalData(res.data)
        storage.setSha(res.sha)
        setData(res.data)
        setSha(res.sha)
        setDirty(false)
        storage.setLastSynced(new Date().toISOString())
        setDataLoaded(true)
      }
    }catch(err:any){
      console.error(err)
      throw err
    }finally{ setLoading(false) }
  }

  async function fetchRemote(force = false){
    if (!token) return
    setLoading(true)
    try{
      const res: any = await fetchTasksFromGit(token)
      if (res.notFound){
        // create empty
        const seed = EMPTY_SCHEMA()
        const created = await createEmptyFile(token, seed)
        storage.saveLocalData(seed)
        storage.setSha(created.content.sha)
        setData(seed)
        setSha(created.content.sha)
        setDirty(false)
        storage.setLastSynced(new Date().toISOString())
        setDataLoaded(true)
        return
      }
      if (dirty && !force){
        // leave decision to caller
        setLoading(false)
        return { conflict: true }
      }
      storage.saveLocalData(res.data)
      storage.setSha(res.sha)
      setData(res.data)
      setSha(res.sha)
      setDirty(false)
      storage.setLastSynced(new Date().toISOString())
      setDataLoaded(true)
      return { ok: true }
    }catch(err:any){
      console.error(err)
      throw err
    }finally{ setLoading(false) }
  }

  async function pushLocal(){
    if (!token || !data) throw new Error('missing')
    setLoading(true)
    try{
      const res = await pushTasksToGit(token, data, sha || undefined)
      // res.content.sha
      storage.setSha(res.content.sha)
      setSha(res.content.sha)
      setDirty(false)
      storage.setLastSynced(new Date().toISOString())
      return { ok: true }
    }catch(err:any){
      if (err.message === 'sha_mismatch') return { sha_mismatch: true }
      console.error(err)
      throw err
    }finally{ setLoading(false) }
  }

  function logout(){
    storage.clearToken()
    setToken(null)
  }

  function updateData(next: DevLogData){
    storage.saveLocalData(next)
    setData(next)
    setDirty(true)
  }

  // helper: start/stop timer on a task
  function startTimer(taskId: string, estimateMinutes?: number){
    if (!data) return
    const now = new Date().toISOString()
    const next = { ...data, tasks: data.tasks.map(t => t.id === taskId ? { ...t, timerStartedAt: now, timerEstimateMinutes: estimateMinutes ?? t.timerEstimateMinutes, updatedAt: now } : { ...t, timerStartedAt: null }) }
    updateData(next)
  }

  function stopTimer(taskId: string, stopAndComplete = false){
    if (!data) return
    const now = new Date().toISOString()
    const next = { ...data, tasks: data.tasks.map(t => {
      if (t.id !== taskId) return t
      if (!t.timerStartedAt) return t
      const elapsedMs = Date.now() - new Date(t.timerStartedAt).getTime()
      const elapsedHours = Math.round((elapsedMs / (1000*60*60)) * 100) / 100
      const actual = (t.actualHours || 0) + elapsedHours
      return { ...t, timerStartedAt: null, actualHours: actual, updatedAt: now, status: stopAndComplete ? 'completed' : t.status, completedAt: stopAndComplete ? now : t.completedAt }
    }) }
    updateData(next)
  }

  // Task operations
  function addTask(partial: Partial<Task> & { title: string }){
    if (!data) return
    const now = new Date().toISOString()
    const task: Task = {
      id: `task_${Date.now()}`,
      title: partial.title,
      description: partial.description || '',
      boardId: partial.boardId ?? null,
      tagIds: partial.tagIds ?? [],
      status: partial.status ?? 'pending',
      priority: partial.priority ?? 'medium',
      type: partial.type ?? 'other',
      workDate: partial.workDate ?? null,
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
      deletedAt: null
    }
    const next = { ...data, tasks: [task, ...data.tasks] }
    updateData(next)
    return task
  }

  function editTask(id: string, changes: Partial<Task>){
    if (!data) return
    const now = new Date().toISOString()
    const next = { ...data, tasks: data.tasks.map(t => t.id === id ? { ...t, ...changes, updatedAt: now } : t) }
    updateData(next)
  }

  function softDeleteTask(id: string){
    if (!data) return
    const now = new Date().toISOString()
    const next = { ...data, tasks: data.tasks.map(t => t.id === id ? { ...t, deletedAt: now, updatedAt: now } : t) }
    updateData(next)
  }

  function completeTask(id: string, commit?: string, actualHours?: number){
    if (!data) return
    const now = new Date().toISOString()
    const next = { ...data, tasks: data.tasks.map(t => t.id === id ? { ...t, status: 'completed', gitCommit: commit ?? t.gitCommit, actualHours: actualHours ?? t.actualHours, completedAt: now, updatedAt: now } : t) }
    updateData(next)
  }

  // Boards & Tags CRUD
  function addBoard(partial: Partial<Board> & { name: string }){
    if (!data) return
    const id = `board_${Date.now()}`
    const board: Board = { id, name: partial.name, color: partial.color ?? '#0f766e', position: data.boards.length }
    const next = { ...data, boards: [...data.boards, board] }
    updateData(next)
    return board
  }

  function editBoard(id: string, changes: Partial<Board>){
    if (!data) return
    const next = { ...data, boards: data.boards.map(b=> b.id===id ? { ...b, ...changes } : b) }
    updateData(next)
  }

  function deleteBoard(id: string){
    if (!data) return
    const next = { ...data, boards: data.boards.filter(b=>b.id!==id), tasks: data.tasks.map(t=> t.boardId===id ? { ...t, boardId: null } : t) }
    updateData(next)
  }

  function addTag(partial: Partial<Tag> & { name: string }){
    if (!data) return
    const id = `tag_${Date.now()}`
    const tag: Tag = { id, name: partial.name, color: partial.color ?? '#64748b' }
    const next = { ...data, tags: [...data.tags, tag] }
    updateData(next)
    return tag
  }

  function editTag(id: string, changes: Partial<Tag>){
    if (!data) return
    const next = { ...data, tags: data.tags.map(t=> t.id===id ? { ...t, ...changes } : t) }
    updateData(next)
  }

  function deleteTag(id: string){
    if (!data) return
    const next = { ...data, tags: data.tags.filter(t=>t.id!==id), tasks: data.tasks.map(tsk=> ({ ...tsk, tagIds: tsk.tagIds.filter(x=>x!==id) })) }
    updateData(next)
  }

  return (
    <ctx.Provider value={{
      token, tokenExists: !!token, loginWithToken, logout,
      data, updateData, fetchRemote, pushLocal,
      dirty, setDirty, loading, dataLoaded,
      startTimer, stopTimer, sha,
      addTask, editTask, softDeleteTask, completeTask,
      addBoard, editBoard, deleteBoard,
      addTag, editTag, deleteTag
    }}>
      {children}
    </ctx.Provider>
  )
}

export function useApp(){
  return useContext(ctx)
}
