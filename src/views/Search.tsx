import React, { useState } from 'react'
import { useApp } from '../context/AppContext'

export default function Search(){
  const { data } = useApp()
  const [q, setQ] = useState('')
  const results = q ? data?.tasks.filter(t=> (t.title+t.description+t.remarks+t.gitCommit+t.branch).toLowerCase().includes(q.toLowerCase())) : []
  return (
    <div>
      <h1>Search</h1>
      <input data-search className="token-input" placeholder="Search tasks..." value={q} onChange={e=>setQ(e.target.value)} />
      <div style={{marginTop:12}}>
        {results?.map(r=> (
          <div key={r.id} style={{padding:8,background:'rgba(255,255,255,0.02)',borderRadius:8,marginBottom:8}}>
            <div style={{fontWeight:700}}>{r.title}</div>
            <div className="small">{r.description}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
