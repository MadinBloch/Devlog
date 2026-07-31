export function toast(message: string, type: 'info' | 'success' | 'error' = 'info') {
  window.dispatchEvent(new CustomEvent('devlog:toast', { detail: { message, type } }))
}
