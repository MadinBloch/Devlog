import { Task, Priority, TaskType } from '../types'

export const TYPE_LABELS: Record<TaskType, string> = {
  major_change: 'Major',
  minor_change: 'Minor',
  feature: 'Feature',
  bug: 'Bug',
  meeting: 'Meeting',
  api: 'API',
  ui: 'UI',
  database: 'Database',
  other: 'Other',
}

export const PRIORITY_LABELS: Record<Priority, string> = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

export function activeTasks(tasks: Task[]) {
  return tasks.filter((t) => !t.deletedAt)
}

export function pendingTasks(tasks: Task[]) {
  return activeTasks(tasks)
    .filter((t) => t.status === 'pending')
    .sort((a, b) => {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1
      if (a.isFavorite !== b.isFavorite) return a.isFavorite ? -1 : 1
      const order = { critical: 0, high: 1, medium: 2, low: 3 }
      const pd = (order[a.priority] ?? 9) - (order[b.priority] ?? 9)
      if (pd !== 0) return pd
      return (b.updatedAt || '').localeCompare(a.updatedAt || '')
    })
}

export function completedTasks(tasks: Task[]) {
  return activeTasks(tasks)
    .filter((t) => t.status === 'completed')
    .sort((a, b) => (b.completedAt || '').localeCompare(a.completedAt || ''))
}

export function pad(n: number) {
  return String(n).padStart(2, '0')
}

export function formatDuration(totalSec: number) {
  const abs = Math.abs(Math.floor(totalSec))
  const h = Math.floor(abs / 3600)
  const m = Math.floor((abs % 3600) / 60)
  const s = abs % 60
  return `${pad(h)}:${pad(m)}:${pad(s)}`
}

export function boardColor(boards: { id: string; color: string }[], boardId: string | null) {
  return boards.find((b) => b.id === boardId)?.color || '#94a3b8'
}

export function boardName(boards: { id: string; name: string }[], boardId: string | null) {
  return boards.find((b) => b.id === boardId)?.name || 'No board'
}
