import React, { useState } from 'react'
import { useApp } from '../context/AppContext'

export default function Boards(){
  const { data, addBoard, editBoard, deleteBoard } = useApp()
  const [name, setName] = useState('')
  const [color, setColor] = useState('#0f766e')

  function create(){
    if (!name.trim()) return alert('Name required')
    addBoard({ name, color })
    setName('')
  }

  return (
    <div>
      <h1>Boards</h1>
      <p className="small">Manage boards used to group tasks.</p>
      <div style={{marginTop:12,display:'flex',gap:8}}>
        <input placeholder="Board name" value={name} onChange={e=>setName(e.target.value)} />
        <input type="color" value={color} onChange={e=>setColor(e.target.value)} style={{width:48,height:34}} />
        <button className="button" onClick={create}>Create</button>
      </div>

      <div style={{marginTop:12}}>
        {data?.boards.map(b=> (
          <div key={b.id} style={{padding:8,background:'rgba(255,255,255,0.02)',borderRadius:8,marginBottom:8,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div>
              <div style={{fontWeight:700}}>{b.name}</div>
              <div className="small">{b.color}</div>
            </div>
            <div>
              <button className="button" onClick={()=>{
                const newName = prompt('Name', b.name)
                if (newName) editBoard(b.id, { name: newName })
              }}>Edit</button>
              <button className="button" onClick={()=>{ if (confirm('Delete board? Tasks will be unassigned.')) deleteBoard(b.id) }} style={{marginLeft:8}}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
