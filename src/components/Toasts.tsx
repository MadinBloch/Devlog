import React, { useEffect, useState } from 'react'

type Toast = { id: string; message: string; type?: 'info'|'success'|'error' }

export default function Toasts(){
  const [toasts, setToasts] = useState<Toast[]>([])

  useEffect(()=>{
    function handler(e: any){
      const detail = e.detail || {}
      const t: Toast = { id: String(Date.now()), message: detail.message || '', type: detail.type || 'info' }
      setToasts(s => [t, ...s])
      setTimeout(()=> setToasts(s => s.filter(x=>x.id !== t.id)), 4000)
    }
    window.addEventListener('devlog:toast', handler as EventListener)
    return ()=> window.removeEventListener('devlog:toast', handler as EventListener)
  },[])

  if (!toasts.length) return null

  return (
    <div style={{position:'fixed',right:16,top:16,zIndex:1000,display:'flex',flexDirection:'column',gap:8}}>
      {toasts.map(t=> (
        <div key={t.id} style={{background: t.type==='error' ? '#392b2b' : '#052e2e',color:'white',padding:'8px 12px',borderRadius:8,boxShadow:'0 6px 18px rgba(0,0,0,0.5)'}}>
          {t.message}
        </div>
      ))}
    </div>
  )
}
