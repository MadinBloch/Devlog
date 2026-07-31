import React, { useState } from 'react'
import { useApp } from '../context/AppContext'

export default function Boards() {
  const { data, addBoard, editBoard, deleteBoard } = useApp()
  const [name, setName] = useState('')
  const [color, setColor] = useState('#6366f1')

  function create() {
    if (!name.trim()) return
    addBoard({ name: name.trim(), color })
    setName('')
  }

  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">Organize</div>
          <h1>Boards</h1>
          <p>Group tasks by board.</p>
        </div>
      </div>
      <div className="settings-block">
        <div className="settings-row">
          <input placeholder="Board name" value={name} onChange={(e) => setName(e.target.value)} />
          <input type="color" value={color} onChange={(e) => setColor(e.target.value)} style={{ width: 48, height: 36 }} />
          <button type="button" className="primary-btn" onClick={create}>
            Create
          </button>
        </div>
      </div>
      <div className="pending-grid">
        {data?.boards.map((b) => (
          <div key={b.id} className="card">
            <div className="card-title">
              <h2>
                <span className="board-dot" style={{ background: b.color, width: 10, height: 10 }} /> {b.name}
              </h2>
            </div>
            <p className="mono">{b.color}</p>
            <div className="heading-actions" style={{ marginTop: 12 }}>
              <button
                type="button"
                className="soft-btn"
                onClick={() => {
                  const n = prompt('Name', b.name)
                  if (n) editBoard(b.id, { name: n })
                }}
              >
                Edit
              </button>
              <button
                type="button"
                className="soft-btn"
                onClick={() => confirm('Delete board? Tasks will be unassigned.') && deleteBoard(b.id)}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
