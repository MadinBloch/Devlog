import React, { useState } from 'react'
import { useApp } from '../context/AppContext'
import * as storage from '../storage/local'

export default function Login(){
  const [tokenInput, setTokenInput] = useState(storage.getToken() || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const app = useApp()

  async function doLogin(){
    setError(null)
    setLoading(true)
    try{
      await app.loginWithToken(tokenInput.trim())
    }catch(err:any){
      console.error(err)
      setError('Invalid token or no repo access')
    }finally{ setLoading(false) }
  }

  return (
    <div className="login-container">
      <div className="login-box">
        <h2>DevLog — Login</h2>
        <p className="small">Paste a GitHub Personal Access Token (fine-grained, contents read/write for your private repo).</p>
        <div style={{marginTop:12}}>
          <input className="token-input" value={tokenInput} onChange={e=>setTokenInput(e.target.value)} placeholder="ghp_... or fine-grained token" />
          <button className="button" onClick={doLogin} disabled={loading} style={{marginLeft:8}}>Login</button>
        </div>
        {error && <div style={{color:'#ff7b7b',marginTop:8}}>{error}</div>}
        <div style={{marginTop:12}} className="small">Token stored in sessionStorage only. This app writes to the repository path configured in env.</div>
      </div>
    </div>
  )
}
