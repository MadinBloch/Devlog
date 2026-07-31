import { useEffect } from 'react'
import { useApp } from '../context/AppContext'

export default function useKeyboardShortcuts(openNewTask: () => void, openSearch?: () => void) {
  const app = useApp()

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null
      const typing = !!(
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      )
      const key = e.key

      if (!typing && key === 'n' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault()
        openNewTask()
      }

      if (!typing && key === '/') {
        e.preventDefault()
        openSearch?.()
        requestAnimationFrame(() => {
          const el = document.querySelector('input[data-search]') as HTMLInputElement | null
          el?.focus()
        })
      }

      if ((e.ctrlKey || e.metaKey) && key.toLowerCase() === 's') {
        e.preventDefault()
        void app.pushLocal()
      }

      if ((e.ctrlKey || e.metaKey) && e.shiftKey && key.toLowerCase() === 'f') {
        e.preventDefault()
        if (app.dirty && !confirm('Unsaved local changes will be overwritten. Continue?')) return
        void app.fetchRemote(true)
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [app, openNewTask, openSearch])
}
