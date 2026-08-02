import { DevLogData } from '../types'

const DATA_KEY = 'devlog_data'
const SHA_KEY = 'devlog_sha'
const DIRTY_KEY = 'devlog_dirty'
const LAST_SYNC_KEY = 'devlog_last_synced'
const THEME_KEY = 'devlog_theme'

export function loadLocalData(): DevLogData | null {
  const raw = localStorage.getItem(DATA_KEY)
  if (!raw) return null
  try { return JSON.parse(raw) as DevLogData } catch { return null }
}

export function saveLocalData(data: DevLogData) {
  localStorage.setItem(DATA_KEY, JSON.stringify(data, null, 2))
}

export function setSha(sha: string | null){
  if (sha) localStorage.setItem(SHA_KEY, sha)
  else localStorage.removeItem(SHA_KEY)
}
export function getSha(){
  return localStorage.getItem(SHA_KEY)
}

export function setDirty(v: boolean){
  localStorage.setItem(DIRTY_KEY, v ? 'true' : 'false')
}
export function isDirty(){
  return localStorage.getItem(DIRTY_KEY) === 'true'
}

export function setLastSynced(iso: string){
  localStorage.setItem(LAST_SYNC_KEY, iso)
}
export function getLastSynced(){
  return localStorage.getItem(LAST_SYNC_KEY)
}

export function setTheme(t: 'light' | 'dark'){
  localStorage.setItem(THEME_KEY, t)
}
export function getTheme(){
  return (localStorage.getItem(THEME_KEY) as 'light'|'dark') || 'dark'
}

export function clearLocalAll(){
  localStorage.removeItem(DATA_KEY)
  localStorage.removeItem(SHA_KEY)
  localStorage.removeItem(DIRTY_KEY)
  localStorage.removeItem(LAST_SYNC_KEY)
}

export function getToken(){
  return sessionStorage.getItem('devlog_token')
}
export function setToken(token: string){
  sessionStorage.setItem('devlog_token', token)
}
export function clearToken(){
  sessionStorage.removeItem('devlog_token')
}
