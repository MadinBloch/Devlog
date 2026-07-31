import React, { useState } from 'react'
import { useApp } from '../context/AppContext'

export default function Reports(){
  const { data } = useApp()
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0,10))

  function tasksCompletedOn(d: string){
    return data?.tasks.filter(t=> t.status==='completed' && t.completedAt && t.completedAt.slice(0,10) === d) || []
  }

  function exportTxt(){
    const tasks = tasksCompletedOn(date)
    const lines = [`DevLog report for ${date}`, `Completed: ${tasks.length}`, '']
    tasks.forEach(t=> lines.push(`${t.title} — ${t.actualHours||''}h — ${t.gitCommit||''}`))
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `devlog_report_${date}.txt`; a.click()
  }

  function exportCsv(){
    const tasks = tasksCompletedOn(date)
    const rows = [['id','title','completedAt','actualHours','priority','type']]
    tasks.forEach(t=> rows.push([t.id, t.title, t.completedAt||'', String(t.actualHours||''), t.priority, t.type]))
    const csv = rows.map(r=>r.map(c=>`"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `devlog_report_${date}.csv`; a.click()
  }

  const tasks = tasksCompletedOn(date)
  const hoursByType: Record<string, number> = {}
  const hoursByPriority: Record<string, number> = {}
  tasks.forEach(t=>{
    const h = t.actualHours || 0
    hoursByType[t.type] = (hoursByType[t.type] || 0) + h
    hoursByPriority[t.priority] = (hoursByPriority[t.priority] || 0) + h
  })

  return (
    <div>
      <h1>Reports</h1>
      <p className="small">Daily report and exports.</p>
      <div style={{marginTop:12,display:'flex',gap:8,alignItems:'center'}}>
        <input type="date" value={date} onChange={e=>setDate(e.target.value)} />
        <button className="button" onClick={exportTxt}>Export TXT</button>
        <button className="button" onClick={exportCsv}>Export CSV</button>
      </div>

      <div style={{marginTop:12}}>
        <h3>Completed ({tasks.length})</h3>
        {tasks.map(t=> (
          <div key={t.id} style={{padding:8,background:'rgba(255,255,255,0.02)',borderRadius:8,marginBottom:8}}>
            <div style={{fontWeight:700}}>{t.title}</div>
            <div className="small">{t.completedAt} — {t.actualHours || ''}h</div>
          </div>
        ))}
      </div>

      <div style={{marginTop:12}}>
        <h4>Hours by Type</h4>
        {Object.entries(hoursByType).map(([k,v])=> <div key={k} className="small">{k}: {v}h</div>)}
      </div>

      <div style={{marginTop:12}}>
        <h4>Hours by Priority</h4>
        {Object.entries(hoursByPriority).map(([k,v])=> <div key={k} className="small">{k}: {v}h</div>)}
      </div>
    </div>
  )
}
