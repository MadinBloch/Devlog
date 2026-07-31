import { useEffect } from 'react'
import { useApp } from '../context/AppContext'

export default function useKeyboardShortcuts(openNewTask: ()=>void){
  const app = useApp()

  useEffect(()=>{
    function handler(e: KeyboardEvent){
      const key = e.key
      if (key === 'n' && !e.metaKey && !e.ctrlKey && !e.altKey){
        e.preventDefault()
        openNewTask()
      }
      if (key === '/' ){ // focus search - not implemented
        e.preventDefault()
        const el = document.querySelector('input[data-search]') as HTMLInputElement | null
        if (el) el.focus()
      }
      if ((e.ctrlKey || e.metaKey) && key.toLowerCase() === 's'){
        e.preventDefault()
        app.pushLocal()
      }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && key.toLowerCase() === 'f'){
        e.preventDefault()
        app.fetchRemote(true)
      }
    }
    window.addEventListener('keydown', handler)
    return ()=>window.removeEventListener('keydown', handler)
  },[app, openNewTask])
}
