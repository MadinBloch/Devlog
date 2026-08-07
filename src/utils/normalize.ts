import { DevLogData, Note } from '../types'

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

  return {
    ...raw,
    boards: raw.boards || [],
    tags: raw.tags || [],
    tasks: raw.tasks || [],
    notes,
  }
}

export function activeNotes(notes: Note[] | undefined | null) {
  return (notes || []).filter((n) => !n.deletedAt)
}
