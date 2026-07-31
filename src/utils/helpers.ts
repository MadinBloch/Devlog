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

function localYmd(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function todayISO() {
  return localYmd(new Date())
}

/** Display dates as "dd mm yyyy" (e.g. 31 07 2026). */
export function formatDisplayDate(value?: string | null): string {
  if (!value) return ''
  const raw = value.trim()
  // YYYY-MM-DD or ISO datetime
  const m = raw.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (m) return `${m[3]} ${m[2]} ${m[1]}`
  const d = new Date(raw)
  if (Number.isNaN(d.getTime())) return raw
  return `${pad(d.getDate())} ${pad(d.getMonth() + 1)} ${d.getFullYear()}`
}

export function formatDisplayDateTime(value?: string | null): string {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return formatDisplayDate(value)
  return `${formatDisplayDate(value)} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** Laravel-style date presets (week starts Monday). */
export function datePreset(preset: 'today' | 'week' | 'month'): [string, string] {
  const now = new Date()
  const today = localYmd(now)
  if (preset === 'today') return [today, today]

  if (preset === 'week') {
    const start = new Date(now)
    const day = (start.getDay() + 6) % 7
    start.setDate(start.getDate() - day)
    const end = new Date(start)
    end.setDate(start.getDate() + 6)
    return [localYmd(start), localYmd(end)]
  }

  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  return [localYmd(start), localYmd(end)]
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

export function toggleListValue<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((x) => x !== value) : [...list, value]
}

export function downloadText(content: string, filename: string) {
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([content], { type: 'text/plain;charset=utf-8' }))
  a.download = filename
  a.click()
}
