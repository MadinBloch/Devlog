import React from 'react'
import { useApp } from '../context/AppContext'

const NAV: { id: string; label: string; symbol: string }[] = [
  { id: 'dashboard', label: 'Dashboard', symbol: '▦' },
  { id: 'today', label: "Today's Work", symbol: '◉' },
  { id: 'pending', label: 'Pending', symbol: '◷' },
  { id: 'completed', label: 'Completed', symbol: '✓' },
  { id: 'reports', label: 'Reports', symbol: '▤' },
  { id: 'boards', label: 'Boards', symbol: '▣' },
  { id: 'notes', label: 'Notes', symbol: '✎' },
  { id: 'search', label: 'Search', symbol: '⌕' },
  { id: 'settings', label: 'Settings', symbol: '⚙' },
]

export default function Sidebar({
  view,
  setView,
  open,
  onClose,
}: {
  view: string
  setView: (v: string) => void
  open?: boolean
  onClose?: () => void
}) {
  const { pendingCount, completedCount, theme, setTheme } = useApp()

  return (
    <>
      {open && <div className="sidebar-backdrop" onClick={onClose} />}
      <aside className={`sidebar ${open ? 'is-open' : ''}`}>
        <div className="brand">
          <span className="brand-mark">D</span>
          <span>DevLog</span>
        </div>
        <p className="workspace-label">PERSONAL WORKSPACE</p>
        <nav>
          {NAV.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`nav-item ${view === item.id ? 'active' : ''}`}
              onClick={() => {
                setView(item.id)
                onClose?.()
              }}
            >
              <span className="nav-symbol">{item.symbol}</span>
              {item.label}
              {item.id === 'pending' && pendingCount > 0 && <b>{pendingCount}</b>}
              {item.id === 'completed' && completedCount > 0 && <b>{completedCount}</b>}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <button
            type="button"
            className="theme-toggle"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            <span>◐</span>
            <span>{theme === 'dark' ? 'Dark mode' : 'Light mode'}</span>
          </button>
          <div className="profile">
            <span className="avatar">M</span>
            <span>
              <strong>Madin</strong>
              <small>Kesari ERP developer</small>
            </span>
          </div>
        </div>
      </aside>
    </>
  )
}
