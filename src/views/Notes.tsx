import React, { useMemo, useRef, useState } from 'react'
import { Search, Pin, Trash2, Copy, Check, X, Plus } from 'lucide-react'
import { useApp } from '@/context/AppContext'
import { Note } from '@/types'
import { activeNotes } from '@/utils/normalize'
import { toast } from '@/utils/toast'
import { noteSurface } from '@/utils/noteColors'
import NoteModal from '@/components/NoteModal'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

export default function Notes() {
  const { data, addNote, toggleNotePin, softDeleteNote, theme, search } = useApp()
  const [composerOpen, setComposerOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [localQuery, setLocalQuery] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const bodyRef = useRef<HTMLTextAreaElement>(null)

  const query = (localQuery || search).trim().toLowerCase()

  const notes = useMemo(() => {
    let list = activeNotes(data?.notes)
    if (query) {
      list = list.filter(
        (n) => n.title.toLowerCase().includes(query) || n.body.toLowerCase().includes(query)
      )
    }
    return [...list].sort((a, b) => {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    })
  }, [data?.notes, query])

  const pinned = notes.filter((n) => n.isPinned)
  const others = notes.filter((n) => !n.isPinned)
  const deleteTarget = data?.notes.find((n) => n.id === deleteId)

  function resetComposer() {
    setTitle('')
    setBody('')
    setComposerOpen(false)
  }

  function saveComposer() {
    const t = title.trim()
    const b = body.trim()
    if (!t && !b) {
      resetComposer()
      return
    }
    addNote({ title: t, body: b })
    resetComposer()
  }

  async function copyNote(n: Note) {
    const text = [n.title, n.body].filter(Boolean).join('\n\n')
    if (!text) return
    try {
      await navigator.clipboard.writeText(text)
      setCopiedId(n.id)
      toast('Copied', 'success')
      setTimeout(() => setCopiedId(null), 1200)
    } catch {
      toast('Copy failed', 'error')
    }
  }

  function confirmDelete() {
    if (!deleteId) return
    softDeleteNote(deleteId)
    setDeleteId(null)
  }

  function renderCard(n: Note, index: number) {
    const bg = noteSurface(n.color || 'default', theme)
    const fg = theme === 'light' ? '#202124' : '#e8eaed'

    return (
      <article
        key={n.id}
        className="keep-note animate-note-rise"
        style={{
          background: bg,
          color: fg,
          animationDelay: `${Math.min(index * 40, 240)}ms`,
        }}
        onClick={() => setEditingId(n.id)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            setEditingId(n.id)
          }
        }}
      >
        <button
          type="button"
          className={cn('keep-note-pin keep-icon-btn', n.isPinned && 'is-on')}
          title={n.isPinned ? 'Unpin' : 'Pin'}
          onClick={(e) => {
            e.stopPropagation()
            toggleNotePin(n.id)
          }}
        >
          <Pin className={cn('h-4 w-4', n.isPinned && 'fill-current')} />
        </button>

        {n.title ? <h3 className="keep-note-title">{n.title}</h3> : null}
        {n.body ? <pre className="keep-note-body">{n.body}</pre> : null}
        {!n.title && !n.body ? <p className="keep-note-empty">Empty note</p> : null}

        <div className="keep-note-toolbar" onClick={(e) => e.stopPropagation()}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button type="button" className="keep-icon-btn" onClick={() => copyNote(n)}>
                {copiedId === n.id ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </button>
            </TooltipTrigger>
            <TooltipContent>Copy</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                className="keep-icon-btn keep-icon-danger"
                onClick={() => setDeleteId(n.id)}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Delete</TooltipContent>
          </Tooltip>
        </div>
      </article>
    )
  }

  return (
    <TooltipProvider delayDuration={150}>
      <div className="keep-page">
        <header className="keep-header">
          <h1>Notes</h1>
          <p>{notes.length} note{notes.length === 1 ? '' : 's'} · synced with GitHub</p>
        </header>

        <div className="keep-search-wrap">
          <label className="keep-search">
            <Search className="h-4 w-4 opacity-60" />
            <input
              value={localQuery}
              onChange={(e) => setLocalQuery(e.target.value)}
              placeholder="Search"
              aria-label="Search notes"
            />
            {localQuery ? (
              <button type="button" className="keep-search-clear" onClick={() => setLocalQuery('')}>
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </label>
        </div>

        <div className="keep-composer-wrap">
          {!composerOpen ? (
            <button type="button" className="keep-composer-idle" onClick={() => setComposerOpen(true)}>
              <span>Take a note…</span>
              <Plus className="h-4 w-4 opacity-50" />
            </button>
          ) : (
            <div className="keep-composer animate-composer-expand">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Title"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    bodyRef.current?.focus()
                  }
                }}
              />
              <textarea
                ref={bodyRef}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Take a note…"
                rows={5}
              />
              <div className="keep-composer-actions">
                <button type="button" className="keep-text-btn" onClick={resetComposer}>
                  Cancel
                </button>
                <button type="button" className="keep-text-btn keep-text-btn-strong" onClick={saveComposer}>
                  Close
                </button>
              </div>
            </div>
          )}
        </div>

        {notes.length === 0 ? (
          <div className="keep-empty animate-fade-in">
            <p>{query ? 'No matching notes' : 'Notes you add appear here'}</p>
          </div>
        ) : (
          <div className="keep-sections">
            {pinned.length > 0 && (
              <section>
                <h2 className="keep-section-label">Pinned</h2>
                <div className="keep-masonry">{pinned.map((n, i) => renderCard(n, i))}</div>
              </section>
            )}
            {others.length > 0 && (
              <section>
                {pinned.length > 0 && <h2 className="keep-section-label">Others</h2>}
                <div className="keep-masonry">
                  {others.map((n, i) => renderCard(n, pinned.length + i))}
                </div>
              </section>
            )}
          </div>
        )}

        <NoteModal noteId={editingId} onClose={() => setEditingId(null)} />

        <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete note?</AlertDialogTitle>
              <AlertDialogDescription>
                Remove “{deleteTarget?.title || 'Untitled'}”. Sync to update GitHub.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:opacity-90"
                onClick={confirmDelete}
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  )
}
