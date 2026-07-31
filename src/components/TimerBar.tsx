import React, { useEffect, useState } from 'react'
import { useApp } from '../context/AppContext'

export default function TimerBar(){
  const { data, stopTimer } = useApp()
  const [now, setNow] = useState(Date.now())

  useEffect(()=>{
    const id = setInterval(()=>setNow(Date.now()),1000)
    return ()=>clearInterval(id)
  },[])

  const active = data?.tasks.find(t=>t.timerStartedAt && !t.deletedAt)
  if (!active) return null

  const started = new Date(active.timerStartedAt!).getTime()
  const elapsedMs = now - started
  const elapsedMin = Math.floor(elapsedMs / 60000)

  return (
    <div style={{background:'rgba(0,0,0,0.2)',padding:8,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
      <div>
        <strong>{active.title}</strong>
        <div style={{fontSize:12,color:'var(--muted)'}}>Started at {new Date(active.timerStartedAt!).toLocaleTimeString()} — {elapsedMin} min</div>
      </div>
      <div>
        <button className="button" onClick={()=>stopTimer(active.id)}>Stop</button>
        <button className="button" onClick={()=>stopTimer(active.id, true)} style={{marginLeft:8}}>Stop & Complete</button>
      </div>
    </div>
  )
}
