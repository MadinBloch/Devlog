import React, { useState } from 'react'
import { useApp } from './context/AppContext'
import Login from './views/Login'
import Header from './components/Header'
import Dashboard from './views/Dashboard'
import Sidebar from './components/Sidebar'
import TaskModal from './components/TaskModal'
import TimerBar from './components/TimerBar'
import Reports from './views/Reports'
import Boards from './views/Boards'
import Search from './views/Search'
import Settings from './views/Settings'
import Toasts from './components/Toasts'
import useKeyboardShortcuts from './hooks/useKeyboardShortcuts'

export default function App() {
  const { token } = useApp()
  const [view, setView] = useState('dashboard')
  const [taskModalOpen, setTaskModalOpen] = useState(false)

  React.useEffect(()=>{
    const handler = ()=>setTaskModalOpen(true)
    window.addEventListener('devlog:new-task', handler as EventListener)
    return ()=>window.removeEventListener('devlog:new-task', handler as EventListener)
  },[])

  useKeyboardShortcuts(()=>setTaskModalOpen(true))

  if (!token) return <Login />

  return (
    <div className="app-root">
      <Sidebar view={view} setView={setView} />
      <div style={{flex:1,display:'flex',flexDirection:'column'}}>
        <Header />
        <TimerBar />
        <Toasts />
        <main className="main">
          {view === 'dashboard' && <Dashboard />}
          {view === 'reports' && <Reports />}
          {view === 'boards' && <Boards />}
          {view === 'search' && <Search />}
          {view === 'settings' && <Settings />}
        </main>
      </div>
      <TaskModal open={taskModalOpen} onClose={()=>setTaskModalOpen(false)} />
    </div>
  )
}
