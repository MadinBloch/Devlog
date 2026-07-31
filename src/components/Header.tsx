import React from 'react'
import { useApp } from '../context/AppContext'
import * as storage from '../storage/local'

export default function Header(){
  const { fetchRemote, pushLocal, dirty, data, logout } = useApp()

  async function handleFetch(){
    if (dirty){
      if (!confirm('Unsaved local changes will be overwritten. Continue?')) return
    }
    try{
      const r = await fetchRemote(true)
      if (r && r.conflict){
        alert('Remote changed. Fetch skipped because local is dirty.')
      }
    }catch(e:any){
      alert('Fetch failed: '+e.message)
    }
  }

  async function handlePush(){
    if (!dirty){
      if (!confirm('No local changes. Force push anyway?')) return
    }
    try{
      const r = await pushLocal()
      if (r && r.sha_mismatch){
        alert('Remote changed — Fetch first')
      }
    }catch(e:any){
      alert('Push failed: '+e.message)
    }
  }

  return (
    <header className="header">
      <div style={{display:'flex',alignItems:'center'}}>
        <div style={{fontWeight:700,marginRight:12}}>DevLog</div>
        <div className="small">{data ? `${data.tasks.filter(t=>t.status==='pending' && !t.deletedAt).length} pending` : ''}</div>
      </div>
      <div style={{display:'flex',alignItems:'center'}}>
        <button className="button" onClick={()=>window.dispatchEvent(new CustomEvent('devlog:new-task'))}>Quick Add</button>
        <div className="small" style={{marginRight:12}}>{storage.getLastSynced() || 'never synced'}</div>
        {dirty && <div className="small" style={{color:'#ffb4a2',marginRight:8}}>Unsaved changes</div>}
        <button className="button" onClick={handleFetch}>Fetch ↓</button>
        <button className="button" onClick={handlePush}>Sync ↑</button>
        <button className="button" onClick={()=>{ if (confirm('Logout?')) logout() }} style={{marginLeft:12}}>Logout</button>
      </div>
    </header>
  )
}
