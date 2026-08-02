import React, { useEffect, useState } from 'react'

type Toast = { id: string; message: string; type?: 'info' | 'success' | 'error' }

export default function Toasts() {
  const [toasts, setToasts] = useState<Toast[]>([])

  useEffect(() => {
    function handler(e: Event) {
      const detail = (e as CustomEvent).detail || {}
      const t: Toast = { id: String(Date.now()) + Math.random(), message: detail.message || '', type: detail.type || 'info' }
      setToasts((s) => [t, ...s].slice(0, 4))
      setTimeout(() => setToasts((s) => s.filter((x) => x.id !== t.id)), 3500)
    }
    window.addEventListener('devlog:toast', handler)
    return () => window.removeEventListener('devlog:toast', handler)
  }, [])

  if (!toasts.length) return null

  return (
    <div className="toast-stack">
      {toasts.map((t) => (
        <div key={t.id} className={`toast-item ${t.type || 'info'}`}>
          {t.message}
        </div>
      ))}
    </div>
  )
}
