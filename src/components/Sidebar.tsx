import React from 'react'

export default function Sidebar({ view, setView }: { view: string; setView: (v:string)=>void }){
  const items = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'today', label: "Today's Work" },
    { id: 'pending', label: 'Pending' },
    { id: 'completed', label: 'Completed' },
    { id: 'boards', label: 'Boards' },
    { id: 'reports', label: 'Reports' },
    { id: 'search', label: 'Search' },
    { id: 'settings', label: 'Settings' }
  ]

  return (
    <aside style={{width:220,background:'var(--panel)',padding:12,borderRight:'1px solid rgba(255,255,255,0.02)'}}>
      <div style={{fontWeight:700,marginBottom:12}}>Navigation</div>
      {items.map(it=> (
        <div key={it.id} onClick={()=>setView(it.id)} style={{padding:'8px 10px',borderRadius:6,background: view===it.id ? 'rgba(255,255,255,0.02)' : 'transparent',cursor:'pointer',marginBottom:6}}>{it.label}</div>
      ))}
    </aside>
  )
}
