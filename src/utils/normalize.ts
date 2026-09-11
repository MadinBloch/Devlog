import { DevLogData, Note, Task, SheetEntry } from '../types'

export function normalizeData(raw: DevLogData): DevLogData {
  const notes: Note[] = Array.isArray(raw.notes)
    ? raw.notes.map((n) => ({
        id: n.id,
        title: n.title || '',
        body: n.body || '',
        color: n.color || 'default',
        isPinned: !!n.isPinned,
        createdAt: n.createdAt || new Date().toISOString(),
        updatedAt: n.updatedAt || n.createdAt || new Date().toISOString(),
        deletedAt: n.deletedAt ?? null,
      }))
    : []

  const tasks: Task[] = (raw.tasks || []).map((t) => ({
    ...t,
    sheetUploadedAt: t.sheetUploadedAt ?? null,
  }))

  const sheetEntries: SheetEntry[] = Array.isArray(raw.sheetEntries)
    ? raw.sheetEntries.map((e) => ({
        id: e.id,
        values: e.values && typeof e.values === 'object' ? e.values : {},
        uploadedAt: e.uploadedAt ?? null,
        createdAt: e.createdAt || new Date().toISOString(),
        updatedAt: e.updatedAt || e.createdAt || new Date().toISOString(),
        deletedAt: e.deletedAt ?? null,
      }))
    : []

  return {
    ...raw,
    boards: raw.boards || [],
    tags: raw.tags || [],
    tasks,
    notes,
    sheetEntries,
  }
}

export function activeNotes(notes: Note[] | undefined | null) {
  return (notes || []).filter((n) => !n.deletedAt)
}

export function tasksPendingSheetUpload(tasks: Task[] | undefined | null) {
  return (tasks || []).filter((t) => !t.deletedAt && !t.sheetUploadedAt)
}

export function sheetEntriesPendingUpload(entries: SheetEntry[] | undefined | null) {
  return (entries || []).filter((e) => !e.deletedAt && !e.uploadedAt)
}
