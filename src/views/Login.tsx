import React, { useState } from 'react'
import { useApp } from '../context/AppContext'
import { getRepoConfig } from '../api/github'

export default function Login() {
  const [tokenInput, setTokenInput] = useState('')
  const [error, setError] = useState<string | null>(null)
  const { loginWithToken, loading } = useApp()
  const cfg = getRepoConfig()

  async function doLogin() {
    setError(null)
    try {
      await loginWithToken(tokenInput.trim())
    } catch {
      setError('Invalid token or no repo access')
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="eyebrow">DevLog</div>
        <h1>Sign in with GitHub</h1>
        <p>
          Paste a fine-grained PAT with Contents read/write on{' '}
          <strong>
            {cfg.owner}/{cfg.repo}
          </strong>{' '}
          ({cfg.path}).
        </p>
        <input
          type="password"
          value={tokenInput}
          onChange={(e) => setTokenInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && doLogin()}
          placeholder="github_pat_… or ghp_…"
        />
        <button type="button" className="primary-btn" onClick={doLogin} disabled={loading || !tokenInput.trim()}>
          {loading ? 'Connecting…' : 'Login'}
        </button>
        {error && <p className="error" style={{ marginTop: 10 }}>{error}</p>}
        <p style={{ marginTop: 14, fontSize: 11 }}>Token stays in sessionStorage only. Edits sync when you press Sync.</p>
      </div>
    </div>
  )
}
