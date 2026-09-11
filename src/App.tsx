import React, { useEffect, useState } from 'react'
import { useApp } from './context/AppContext'
import Login from './views/Login'
import Header from './components/Header'
import Sidebar from './components/Sidebar'
import TimerBar from './components/TimerBar'
import TaskModal from './components/TaskModal'
import CompleteModal from './components/CompleteModal'
import TimerModal from './components/TimerModal'
import Toasts from './components/Toasts'
import Dashboard from './views/Dashboard'
import Today from './views/Today'
import Pending from './views/Pending'
import Completed from './views/Completed'
import Reports from './views/Reports'
import Boards from './views/Boards'
import Notes from './views/Notes'
import SheetForm from './views/SheetForm'
import Search from './views/Search'
import Settings from './views/Settings'
import useKeyboardShortcuts from './hooks/useKeyboardShortcuts'
import { Task } from './types'

export default function App() {
  const { token, search } = useApp()
  const [view, setView] = useState('dashboard')
  const [taskModalOpen, setTaskModalOpen] = useState(false)
  const [editing, setEditing] = useState<Task | null>(null)
  const [completing, setCompleting] = useState<Task | null>(null)
  const [timerOpen, setTimerOpen] = useState(false)
  const [navOpen, setNavOpen] = useState(false)

  function openNew() {
    setEditing(null)
    setTaskModalOpen(true)
  }

  function openEdit(t: Task) {
    setEditing(t)
    setTaskModalOpen(true)
  }

  useEffect(() => {
    const handler = () => openNew()
    window.addEventListener('devlog:new-task', handler)
    return () => window.removeEventListener('devlog:new-task', handler)
  }, [])

  useEffect(() => {
    if (search.trim() && view !== 'search') setView('search')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  useKeyboardShortcuts(openNew, () => setView('search'))

  if (!token) return <Login />

  return (
    <div className="workos">
      <Sidebar view={view} setView={setView} open={navOpen} onClose={() => setNavOpen(false)} />
      <main className="main">
        <Header
          onNewTask={openNew}
          onOpenTimer={() => setTimerOpen(true)}
          onOpenSearch={() => setView('search')}
          onToggleNav={() => setNavOpen((v) => !v)}
        />
        <TimerBar />
        {view === 'dashboard' && (
          <Dashboard onEdit={openEdit} onComplete={setCompleting} onNew={openNew} setView={setView} />
        )}
        {view === 'today' && <Today onEdit={openEdit} onComplete={setCompleting} />}
        {view === 'pending' && <Pending onEdit={openEdit} onComplete={setCompleting} />}
        {view === 'completed' && <Completed onEdit={openEdit} onComplete={setCompleting} />}
        {view === 'reports' && <Reports />}
        {view === 'boards' && <Boards />}
        {view === 'notes' && <Notes />}
        {view === 'sheet' && <SheetForm />}
        {view === 'search' && <Search onEdit={openEdit} onComplete={setCompleting} />}
        {view === 'settings' && <Settings />}
      </main>
      <TaskModal
        open={taskModalOpen}
        task={editing}
        onClose={() => {
          setTaskModalOpen(false)
          setEditing(null)
        }}
      />
      <CompleteModal task={completing} onClose={() => setCompleting(null)} />
      <TimerModal open={timerOpen} onClose={() => setTimerOpen(false)} />
      <Toasts />
    </div>
  )
}
