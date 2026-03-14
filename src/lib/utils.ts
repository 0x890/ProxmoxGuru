type ClassValue = string | number | boolean | undefined | null | ClassValue[] | Record<string, unknown>

function clsxImpl(...args: ClassValue[]): string {
  const classes: string[] = []
  for (const arg of args) {
    if (!arg && arg !== 0) continue
    if (typeof arg === 'string' || typeof arg === 'number') {
      classes.push(String(arg))
    } else if (Array.isArray(arg)) {
      const inner = clsxImpl(...arg)
      if (inner) classes.push(inner)
    } else if (typeof arg === 'object') {
      for (const [key, val] of Object.entries(arg as Record<string, unknown>)) {
        if (val) classes.push(key)
      }
    }
  }
  return classes.join(' ')
}

export function cn(...inputs: ClassValue[]): string {
  return clsxImpl(...inputs)
}

export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}

export function formatUptime(seconds: number): string {
  if (!seconds || seconds < 0) return 'N/A'
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  if (days > 0) return `${days}d ${hours}h`
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes}m`
}

export function formatCPU(cpu: number): string {
  return `${(cpu * 100).toFixed(1)}%`
}

export function formatPercent(value: number, max: number): number {
  if (!max || max === 0) return 0
  return Math.min((value / max) * 100, 100)
}

export function getStatusColor(status: string): string {
  switch (status?.toLowerCase()) {
    case 'running':
    case 'online':
    case 'ok':
    case 'available':
      return '#22C55E'
    case 'stopped':
    case 'offline':
      return '#6B7280'
    case 'paused':
    case 'suspended':
    case 'warning':
      return '#F59E0B'
    case 'error':
    case 'failed':
      return '#EF4444'
    default:
      return '#9899A8'
  }
}

export function getUsageColor(percentage: number): string {
  if (percentage < 60) return '#22C55E'
  if (percentage < 85) return '#F59E0B'
  return '#EF4444'
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export function fuzzyMatch(needle: string, haystack: string): boolean {
  const n = needle.toLowerCase()
  const h = haystack.toLowerCase()
  if (h.includes(n)) return true
  let ni = 0
  for (let hi = 0; hi < h.length && ni < n.length; hi++) {
    if (h[hi] === n[ni]) ni++
  }
  return ni === n.length
}

export function formatTimestamp(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleString()
}

export function timeAgo(timestamp: number): string {
  const now = Date.now() / 1000
  const diff = now - timestamp
  if (diff < 60) return `${Math.floor(diff)}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

export function debounce<T extends (...args: unknown[]) => unknown>(fn: T, delay: number): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>
  return (...args: Parameters<T>) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }
}
