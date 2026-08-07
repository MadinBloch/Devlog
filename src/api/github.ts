import { DevLogData } from '../types'
import { normalizeData } from '../utils/normalize'

const OWNER = import.meta.env.VITE_GITHUB_OWNER as string
const REPO = import.meta.env.VITE_GITHUB_REPO as string
const FILE_PATH = (import.meta.env.VITE_GITHUB_FILE_PATH as string) || 'data/tasks.json'

function apiUrl(path: string) {
  return `https://api.github.com/repos/${OWNER}/${REPO}/contents/${path}`
}

function headers(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'Content-Type': 'application/json',
  }
}

function encodeBase64(text: string): string {
  const bytes = new TextEncoder().encode(text)
  let binary = ''
  bytes.forEach((b) => { binary += String.fromCharCode(b) })
  return btoa(binary)
}

function decodeBase64(b64: string): string {
  const binary = atob(b64.replace(/\n/g, ''))
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

export function getRepoConfig() {
  return { owner: OWNER, repo: REPO, path: FILE_PATH }
}

export async function fetchTasksFromGit(token: string) {
  const res = await fetch(apiUrl(FILE_PATH), { headers: headers(token) })
  if (res.status === 404) return { notFound: true as const }
  if (!res.ok) throw new Error(`GitHub fetch failed: ${res.status}`)
  const json = await res.json()
  const data: DevLogData = normalizeData(JSON.parse(decodeBase64(json.content)))
  return { data, sha: json.sha as string }
}

export async function createEmptyFile(token: string, seed: DevLogData) {
  const content = encodeBase64(JSON.stringify(seed, null, 2))
  const res = await fetch(apiUrl(FILE_PATH), {
    method: 'PUT',
    headers: headers(token),
    body: JSON.stringify({ message: 'chore: create devlog data', content }),
  })
  if (!res.ok) throw new Error(`GitHub create failed: ${res.status}`)
  return res.json()
}

export async function pushTasksToGit(token: string, data: DevLogData, sha?: string) {
  const payload = { ...data, updatedAt: new Date().toISOString() }
  const content = encodeBase64(JSON.stringify(payload, null, 2))
  const body: Record<string, string> = {
    message: `chore: sync DevLog ${new Date().toISOString()}`,
    content,
  }
  if (sha) body.sha = sha

  const res = await fetch(apiUrl(FILE_PATH), {
    method: 'PUT',
    headers: headers(token),
    body: JSON.stringify(body),
  })
  if (res.status === 409) throw new Error('sha_mismatch')
  if (!res.ok) throw new Error(`GitHub push failed: ${res.status}`)
  return res.json()
}
