import { DevLogData } from '../types'

const OWNER = import.meta.env.VITE_GITHUB_OWNER
const REPO = import.meta.env.VITE_GITHUB_REPO
const FILE_PATH = import.meta.env.VITE_GITHUB_FILE_PATH || 'data/tasks.json'

function apiUrl(path: string){
  return `https://api.github.com/repos/${OWNER}/${REPO}/contents/${path}`
}

export async function fetchTasksFromGit(token: string){
  const res = await fetch(apiUrl(FILE_PATH), { headers: { Authorization: `token ${token}` } })
  if (res.status === 404) {
    return { notFound: true }
  }
  if (!res.ok) throw new Error(`GitHub fetch failed: ${res.status}`)
  const json = await res.json()
  const content = atob(json.content.replace(/\n/g, ''))
  const data: DevLogData = JSON.parse(content)
  return { data, sha: json.sha }
}

export async function createEmptyFile(token: string, seed: DevLogData){
  const content = btoa(JSON.stringify(seed, null, 2))
  const res = await fetch(apiUrl(FILE_PATH), {
    method: 'PUT',
    headers: { Authorization: `token ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: 'chore: create devlog data', content })
  })
  if (!res.ok) throw new Error(`GitHub create failed: ${res.status}`)
  const json = await res.json()
  return json
}

export async function pushTasksToGit(token: string, data: DevLogData, sha?: string){
  const content = btoa(JSON.stringify(data, null, 2))
  const body: any = { message: `chore: sync DevLog ${new Date().toISOString()}`, content }
  if (sha) body.sha = sha
  const res = await fetch(apiUrl(FILE_PATH), {
    method: 'PUT',
    headers: { Authorization: `token ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
  if (res.status === 409) {
    throw new Error('sha_mismatch')
  }
  if (!res.ok) throw new Error(`GitHub push failed: ${res.status}`)
  const json = await res.json()
  return json
}
