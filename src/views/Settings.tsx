import React, { useState } from 'react'
import * as storage from '../storage/local'
import { useApp } from '../context/AppContext'

export default function Settings(){
  const { data, addTag, editTag, deleteTag } = useApp()
  const [newTagName, setNewTagName] = useState('')

  function downloadBackup(){
    const raw = localStorage.getItem('devlog_data') || '{}'
    const blob = new Blob([raw], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `devlog_backup_${new Date().toISOString()}.json`; a.click()
  }

  function createTag(){
    if (!newTagName.trim()) return
    addTag({ name: newTagName.trim() })
    setNewTagName('')
  }

  return (
    <div>
      <h1>Settings</h1>
      <div style={{marginTop:12}}>
        <div className="small">Theme: {storage.getTheme()}</div>
        <button className="button" onClick={()=>{ storage.setTheme(storage.getTheme()==='dark' ? 'light':'dark'); window.location.reload() }}>Toggle Theme</button>
      </div>
      <div style={{marginTop:12}}>
        <button className="button" onClick={downloadBackup}>Download Backup</button>
      </div>

      <section style={{marginTop:18}}>
        <h3>Tags</h3>
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          <input placeholder="New tag" value={newTagName} onChange={e=>setNewTagName(e.target.value)} />
          <button className="button" onClick={createTag}>Create Tag</button>
        </div>
        <div style={{marginTop:12}}>
          {data?.tags.map(t=> (
            <div key={t.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:8,background:'rgba(255,255,255,0.02)',borderRadius:8,marginBottom:8}}>
              <div>
                <div style={{fontWeight:700}}>{t.name}</div>
                <div className="small">{t.color}</div>
              </div>
              <div>
                <button className="button" onClick={()=>{
                  const n = prompt('Name', t.name)
                  if (n) editTag(t.id, { name: n })
                }}>Edit</button>
                <button className="button" onClick={()=>{ if (confirm('Delete tag?')) deleteTag(t.id) }} style={{marginLeft:8}}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
