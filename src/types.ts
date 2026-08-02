export type Priority = 'critical' | 'high' | 'medium' | 'low'
export type TaskType = 'major_change' | 'minor_change' | 'feature' | 'bug' | 'meeting' | 'api' | 'ui' | 'database' | 'other'

export interface Board { id: string; name: string; color: string; position: number }
export interface Tag { id: string; name: string; color: string }

export interface Task {
  id: string
  title: string
  description: string
  boardId: string | null
  tagIds: string[]
  status: 'pending' | 'completed'
  priority: Priority
  type: TaskType
  workDate: string | null
  estimatedHours: number | null
  actualHours: number | null
  gitCommit: string
  branch: string
  remarks: string
  isFavorite: boolean
  isPinned: boolean
  timerStartedAt: string | null
  timerEstimateMinutes: number | null
  completedAt: string | null
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

export interface DevLogData {
  version: number
  updatedAt: string
  boards: Board[]
  tags: Tag[]
  tasks: Task[]
  importedFrom?: string
  importedAt?: string
}
