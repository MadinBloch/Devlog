import React, { useEffect, useState } from 'react'
import Modal from './Modal'
import { Task } from '../types'
import { useApp } from '../context/AppContext'

export default function TaskModal({ open, onClose, task }: { open: boolean; onClose: ()=>void; task?: Task }){
  const app = useApp()
  const { addTask, editTask, data } = app
  const [title, setTitle] = useState(task?.title || '')
  const [description, setDescription] = useState(task?.description || '')
  const [boardId, setBoardId] = useState<string | null>(task?.boardId ?? null)
  const [priority, setPriority] = useState(task?.priority ?? 'medium')
  const [type, setType] = useState(task?.type ?? 'other')
  const [tagIds, setTagIds] = useState<string[]>(task?.tagIds ?? [])
  const [estimatedHours, setEstimatedHours] = useState<string>(task?.estimatedHours?.toString() ?? '')
  const [timerEstimateMinutes, setTimerEstimateMinutes] = useState<string>(task?.timerEstimateMinutes?.toString() ?? '')
  const [branch, setBranch] = useState(task?.branch ?? '')
  const [remarks, setRemarks] = useState(task?.remarks ?? '')

  useEffect(()=>{
    setTitle(task?.title || '')
    setDescription(task?.description || '')
    setBoardId(task?.boardId ?? null)
    setPriority(task?.priority ?? 'medium')
    setType(task?.type ?? 'other')
    setTagIds(task?.tagIds ?? [])
    setEstimatedHours(task?.estimatedHours?.toString() ?? '')
    setTimerEstimateMinutes(task?.timerEstimateMinutes?.toString() ?? '')
    setBranch(task?.branch ?? '')
    setRemarks(task?.remarks ?? '')
  }, [task, open])

  if (!open) return null

  function toggleTag(id: string){
    setTagIds(p => p.includes(id) ? p.filter(x=>x!==id) : [...p, id])
  }

  function save(){
    if (!title.trim()) return alert('Title required')
    const partial: any = {
      title, description, boardId, priority, type, tagIds,
      estimatedHours: estimatedHours ? Number(estimatedHours) : null,
      timerEstimateMinutes: timerEstimateMinutes ? Number(timerEstimateMinutes) : null,
      branch, remarks
    }
    if (task) editTask(task.id, partial)
    else addTask(partial)
    onClose()
  }

  return (
    <Modal title={task ? 'Edit Task' : 'New Task'} onClose={onClose}>
      <div style={{display:'grid',gap:8,minWidth:420}}>
        <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Title" />
        <textarea value={description} onChange={e=>setDescription(e.target.value)} placeholder="Description" rows={4} />

        <div style={{display:'flex',gap:8}}>
          <select value={boardId ?? ''} onChange={e=>setBoardId(e.target.value||null)}>
            <option value="">No board</option>
            {data?.boards.map(b=> <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
          <select value={priority} onChange={e=>setPriority(e.target.value)}>
            <option value="critical">critical</option>
            <option value="high">high</option>
            <option value="medium">medium</option>
            <option value="low">low</option>
          </select>
          <select value={type} onChange={e=>setType(e.target.value)}>
            <option value="feature">feature</option>
            <option value="bug">bug</option>
            <option value="major_change">major_change</option>
            <option value="minor_change">minor_change</option>
            <option value="meeting">meeting</option>
            <option value="api">api</option>
            <option value="ui">ui</option>
            <option value="database">database</option>
            <option value="other">other</option>
          </select>
        </div>

        <div>
          <div className="small">Tags</div>
          <div style={{display:'flex',gap:8,flexWrap:'wrap',marginTop:6}}>
            {data?.tags.map(t=> (
              <div key={t.id} onClick={()=>toggleTag(t.id)} style={{padding:'6px 8px',borderRadius:8,background: tagIds.includes(t.id) ? 'rgba(15,118,110,0.9)' : 'rgba(255,255,255,0.02)',cursor:'pointer'}}>{t.name}</div>
            ))}
          </div>
        </div>

        <div style={{display:'flex',gap:8}}>
          <input placeholder="Estimated hours" value={estimatedHours} onChange={e=>setEstimatedHours(e.target.value)} />
          <input placeholder="Timer estimate (min)" value={timerEstimateMinutes} onChange={e=>setTimerEstimateMinutes(e.target.value)} />
        </div>

        <input placeholder="Branch" value={branch} onChange={e=>setBranch(e.target.value)} />
        <input placeholder="Remarks" value={remarks} onChange={e=>setRemarks(e.target.value)} />

        <div style={{display:'flex',justifyContent:'flex-end',marginTop:8}}>
          <button className="button" onClick={onClose}>Cancel</button>
          <button className="button" onClick={save} style={{marginLeft:8}}>Save</button>
        </div>
      </div>
    </Modal>
  )
}
