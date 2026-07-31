import React from 'react'
import { useApp } from '../context/AppContext'

export default function Dashboard(){
  const { data, startTimer, stopTimer } = useApp()
  if (!data) return <div>Loading...</div>

  const pending = data.tasks.filter(t=>t.status==='pending' && !t.deletedAt)
  const completedToday = data.tasks.filter(t=>t.status==='completed' && t.completedAt && new Date(t.completedAt).toDateString() === new Date().toDateString())
  const activeTimer = data.tasks.find(t=>t.timerStartedAt)

  return (
    <div>
      <h1>Dashboard</h1>
      <div style={{display:'flex',gap:12}}>
        <div style={{flex:1,background:'rgba(255,255,255,0.02)',padding:12,borderRadius:8}}>
          <div className="small">Pending</div>
          <h3>{pending.length}</h3>
        </div>
        <div style={{flex:1,background:'rgba(255,255,255,0.02)',padding:12,borderRadius:8}}>
          <div className="small">Completed Today</div>
          <h3>{completedToday.length}</h3>
        </div>
        <div style={{flex:2,background:'rgba(255,255,255,0.02)',padding:12,borderRadius:8}}>
          <div className="small">Active Timer</div>
          {activeTimer ? (
            <div>
              <div style={{fontWeight:700}}>{activeTimer.title}</div>
              <div className="small">Started at {new Date(activeTimer.timerStartedAt!).toLocaleTimeString()}</div>
              <div style={{marginTop:8}}>
                <button className="button" onClick={()=>stopTimer(activeTimer.id)}>Stop</button>
                <button className="button" onClick={()=>stopTimer(activeTimer.id, true)} style={{marginLeft:8}}>Stop & Complete</button>
              </div>
            </div>
          ) : (
            <div className="small">No active timer</div>
          )}
        </div>
      </div>

      <section style={{marginTop:18}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <h2>Pending Tasks</h2>
        </div>
        <div className="tasks-list">
          {pending.map(t=> (
            <div key={t.id} className="task">
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <div>
                  <div style={{fontWeight:700}}>{t.title}</div>
                  <div className="small">{t.description}</div>
                </div>
                <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end'}}>
                  <div className="small">{t.priority}</div>
                  <div style={{marginTop:8}}>
                    <button className="button" onClick={()=>startTimer(t.id, t.timerEstimateMinutes ?? 25)}>Start</button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
