export const NOTE_COLORS = [
  { id: 'default', label: 'Default', light: '#ffffff', dark: '#202124' },
  { id: 'coral', label: 'Coral', light: '#faafa8', dark: '#5c2b29' },
  { id: 'peach', label: 'Peach', light: '#f39f76', dark: '#614a19' },
  { id: 'sand', label: 'Sand', light: '#fff8b8', dark: '#635d19' },
  { id: 'mint', label: 'Mint', light: '#e2f6d3', dark: '#345920' },
  { id: 'sage', label: 'Sage', light: '#b4ddd3', dark: '#16504b' },
  { id: 'fog', label: 'Fog', light: '#d4e4ed', dark: '#2d555e' },
  { id: 'dusk', label: 'Dusk', light: '#aecbfa', dark: '#1e3a5f' },
  { id: 'bloom', label: 'Bloom', light: '#d7aefb', dark: '#42275a' },
  { id: 'clay', label: 'Clay', light: '#fdcfe8', dark: '#5b2245' },
] as const

export function noteSurface(color: string, theme: 'light' | 'dark') {
  const found = NOTE_COLORS.find((c) => c.id === color)
  if (!found) return theme === 'dark' ? '#202124' : '#ffffff'
  return theme === 'dark' ? found.dark : found.light
}

export function noteAccent(color: string) {
  const map: Record<string, string> = {
    default: '#a8c7fa',
    coral: '#f28b82',
    peach: '#fb923c',
    sand: '#fdd663',
    mint: '#81c995',
    sage: '#78d9b6',
    fog: '#7dd3fc',
    dusk: '#8ab4f8',
    bloom: '#c58af9',
    clay: '#ff8bcb',
  }
  return map[color] || map.default
}
