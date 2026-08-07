import React, { useEffect, useState } from 'react'
import { Copy, Pin, Trash2, Palette, Check } from 'lucide-react'
import { useApp } from '@/context/AppContext'
import { toast } from '@/utils/toast'
import { NOTE_COLORS, noteSurface, noteAccent } from '@/utils/noteColors'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

export default function NoteModal({
  noteId,
  onClose,
}: {
  noteId: string | null
  onClose: () => void
}) {
  const { data, editNote, softDeleteNote, toggleNotePin, theme } = useApp()
  const note = data?.notes.find((n) => n.id === noteId && !n.deletedAt) || null

  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [color, setColor] = useState('default')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!note) return
    setTitle(note.title)
    setBody(note.body)
    setColor(note.color || 'default')
    setConfirmDelete(false)
    setCopied(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [noteId])

  const open = !!noteId && !!note
  const bg = noteSurface(color, theme)
  const accent = noteAccent(color)
  const fg = theme === 'light' ? '#202124' : '#e8eaed'

  function persist(extra?: { title?: string; body?: string; color?: string }) {
    if (!note) return
    editNote(note.id, {
      title: (extra?.title ?? title).trim(),
      body: (extra?.body ?? body).trim(),
      color: extra?.color ?? color,
    })
  }

  function handleOpenChange(next: boolean) {
    if (!next) {
      persist()
      onClose()
    }
  }

  function handleDelete() {
    if (!note) return
    softDeleteNote(note.id)
    setConfirmDelete(false)
    onClose()
  }

  async function handleCopy() {
    const text = [title.trim(), body.trim()].filter(Boolean).join('\n\n')
    if (!text) return
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      toast('Copied', 'success')
      setTimeout(() => setCopied(false), 1200)
    } catch {
      toast('Copy failed', 'error')
    }
  }

  if (!note) {
    return (
      <Dialog open={false} onOpenChange={handleOpenChange}>
        <DialogContent className="hidden" />
      </Dialog>
    )
  }

  const edited = note.updatedAt
    ? new Date(note.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    : ''

  return (
    <TooltipProvider delayDuration={150}>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="keep-modal overflow-hidden" style={{ background: bg, color: fg }}>
          <DialogTitle className="sr-only">Edit note</DialogTitle>
          <DialogDescription className="sr-only">Edit note content</DialogDescription>

          <div className="keep-modal-accent" style={{ background: accent }} />

          <div className="flex items-start gap-2 px-5 pt-4">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title"
              className="keep-modal-title min-w-0 flex-1 border-0 bg-transparent outline-none placeholder:opacity-40"
              style={{ color: fg }}
              autoFocus
            />
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className={cn('keep-icon-btn', note.isPinned && 'is-pin-on')}
                  onClick={() => toggleNotePin(note.id)}
                >
                  <Pin className={cn('h-[18px] w-[18px]', note.isPinned && 'fill-current')} />
                </button>
              </TooltipTrigger>
              <TooltipContent>{note.isPinned ? 'Unpin' : 'Pin'}</TooltipContent>
            </Tooltip>
          </div>

          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Take a note…"
            rows={12}
            className="keep-modal-body mx-0 max-h-[52vh] min-h-[220px] w-full resize-none border-0 bg-transparent px-5 py-3 outline-none placeholder:opacity-35"
            style={{ color: fg }}
          />

          <div className="keep-modal-footer">
            <div className="flex items-center gap-1">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button type="button" className="keep-icon-btn keep-icon-palette" title="Background color">
                    <Palette className="h-[18px] w-[18px]" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-[236px] rounded-xl p-2">
                  <DropdownMenuLabel className="text-[11px]">Background color</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <div className="grid grid-cols-5 gap-2 p-1">
                    {NOTE_COLORS.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        title={c.label}
                        className={cn(
                          'h-8 w-8 rounded-full border-2 transition-transform hover:scale-110',
                          color === c.id ? 'border-[#a8c7fa] scale-110' : 'border-transparent'
                        )}
                        style={{ background: theme === 'dark' ? c.dark : c.light }}
                        onClick={() => {
                          setColor(c.id)
                          persist({ color: c.id })
                        }}
                      />
                    ))}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              <Tooltip>
                <TooltipTrigger asChild>
                  <button type="button" className="keep-icon-btn keep-icon-copy" onClick={handleCopy}>
                    {copied ? <Check className="h-[18px] w-[18px]" /> : <Copy className="h-[18px] w-[18px]" />}
                  </button>
                </TooltipTrigger>
                <TooltipContent>{copied ? 'Copied' : 'Copy'}</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="keep-icon-btn keep-icon-danger"
                    onClick={() => setConfirmDelete(true)}
                  >
                    <Trash2 className="h-[18px] w-[18px]" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Delete</TooltipContent>
              </Tooltip>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-[11px] opacity-50">Edited {edited}</span>
              <button type="button" className="keep-close-btn" onClick={() => handleOpenChange(false)}>
                Close
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete note?</AlertDialogTitle>
            <AlertDialogDescription>
              “{title || 'Untitled'}” will be removed. Sync to update GitHub.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:opacity-90"
              onClick={handleDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </TooltipProvider>
  )
}
