import { DevLogData } from '../types'
import { normalizeData } from '../utils/normalize'

const DATA_KEY = 'devlog_data'
const SHA_KEY = 'devlog_sha'
const DIRTY_KEY = 'devlog_dirty'
const LAST_SYNC_KEY = 'devlog_last_synced'
const THEME_KEY = 'devlog_theme'
const SHEET_CFG_KEY = 'devlog_sheet_config'

export type SheetConfig = {
  spreadsheetUrl: string
  spreadsheetId: string
  sheetName: string
  webAppUrl: string
  lastUploadAt: string | null
  /** Headers loaded from sheet row 1 */
  headers: string[]
  /** Default for Assigned To–like columns */
  defaultAssignedTo: string
  /** Default STATUS when creating a new dynamic row */
  defaultStatus: string
}

export function defaultSheetConfig(): SheetConfig {
  return {
    spreadsheetUrl: '',
    spreadsheetId: '',
    sheetName: 'Sheet1',
    webAppUrl: '',
    lastUploadAt: null,
    headers: [],
    defaultAssignedTo: 'Madin',
    defaultStatus: 'To Do',
  }
}

export function loadSheetConfig(): SheetConfig {
  const raw = localStorage.getItem(SHEET_CFG_KEY)
  if (!raw) return defaultSheetConfig()
  try {
    return { ...defaultSheetConfig(), ...JSON.parse(raw) }
  } catch {
    return defaultSheetConfig()
  }
}

export function saveSheetConfig(cfg: SheetConfig) {
  localStorage.setItem(SHEET_CFG_KEY, JSON.stringify(cfg))
}

export function loadLocalData(): DevLogData | null {
  const raw = localStorage.getItem(DATA_KEY)
  if (!raw) return null
  try {
    return normalizeData(JSON.parse(raw) as DevLogData)
  } catch {
    return null
  }
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
