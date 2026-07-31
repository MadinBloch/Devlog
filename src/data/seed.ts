import type { DevLogData } from '../types'
import seed from './laravel-seed.json'

export function getLaravelSeed(): DevLogData {
  const data = seed as DevLogData
  return {
    ...data,
    version: data.version || 1,
    updatedAt: new Date().toISOString(),
    boards: data.boards || [],
    tags: data.tags || [],
    tasks: (data.tasks || []).map((t) => ({
      ...t,
      description: t.description || '',
      tagIds: t.tagIds || [],
      gitCommit: t.gitCommit || '',
      branch: t.branch || '',
      remarks: t.remarks || '',
      isFavorite: !!t.isFavorite,
      isPinned: !!t.isPinned,
      timerStartedAt: null,
      deletedAt: t.deletedAt ?? null,
    })),
  }
}

export function seedStats() {
  const data = getLaravelSeed()
  return {
    boards: data.boards.length,
    tags: data.tags.length,
    tasks: data.tasks.length,
    pending: data.tasks.filter((t) => t.status === 'pending' && !t.deletedAt).length,
    completed: data.tasks.filter((t) => t.status === 'completed' && !t.deletedAt).length,
  }
}
