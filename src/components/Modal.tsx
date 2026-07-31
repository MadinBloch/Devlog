import React from 'react'

export default function Modal({ children, title, onClose }: { children: React.ReactNode; title?: string; onClose?: ()=>void }){
  return (
    <div style={{position:'fixed',inset:0,display:'flex',alignItems:'center',justifyContent:'center',zIndex:60}}>
      <div style={{position:'absolute',inset:0,background:'rgba(0,0,0,0.4)'}} onClick={onClose}></div>
      <div style={{background:'var(--panel)',padding:16,borderRadius:10,minWidth:360,boxShadow:'0 10px 30px rgba(0,0,0,0.6)'}}>
        {title && <h3 style={{marginTop:0}}>{title}</h3>}
        <div>{children}</div>
      </div>
    </div>
  )
}
