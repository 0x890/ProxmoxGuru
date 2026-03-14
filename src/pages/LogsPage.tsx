import { useState, useMemo, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ScrollText, RefreshCw, Search, ChevronDown } from 'lucide-react'
import { useServerStore } from '@/store/serverStore'
import { useUIStore } from '@/store/uiStore'
import { useNodes, useLogs } from '@/hooks/useProxmox'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import type { SyslogEntry } from '@/types/proxmox'

type LogLevel = 'all' | 'info' | 'warning' | 'error'

function detectLevel(msg: string): LogLevel {
  const lower = msg.toLowerCase()
  if (lower.includes('error') || lower.includes('err') || lower.includes('fail') || lower.includes('crit')) return 'error'
  if (lower.includes('warn') || lower.includes('warning')) return 'warning'
  return 'info'
}

const levelColors: Record<LogLevel, string> = {
  all: 'text-text-secondary',
  info: 'text-text-secondary',
  warning: 'text-warning',
  error: 'text-danger',
}

const levelBg: Record<string, string> = {
  info: '',
  warning: 'bg-warning/5',
  error: 'bg-danger/5',
}

function LogLine({ entry }: { entry: SyslogEntry & { level: LogLevel } }) {
  return (
    <div className={cn('flex items-start gap-3 px-3 py-1 hover:bg-surface-hover transition-colors', levelBg[entry.level])}>
      <span className="text-2xs text-text-muted font-mono w-12 shrink-0 mt-0.5 text-right">{entry.n}</span>
      <span className={cn('text-xs font-mono leading-relaxed break-all', levelColors[entry.level])}>
        {entry.t}
      </span>
    </div>
  )
}

export default function LogsPage() {
  const activeServerId = useServerStore((s) => s.activeServerId)
  const selectedNode = useUIStore((s) => s.selectedNode)
  const setSelectedNode = useUIStore((s) => s.setSelectedNode)

  const { data: nodes } = useNodes(activeServerId)
  const nodeNames = useMemo(() => nodes?.map((n) => n.node) ?? [], [nodes])
  const activeNode = selectedNode ?? nodeNames[0] ?? null

  const { data: logs, isLoading, refetch } = useLogs(activeServerId, activeNode)

  const [search, setSearch] = useState('')
  const [levelFilter, setLevelFilter] = useState<LogLevel>('all')
  const [autoScroll, setAutoScroll] = useState(true)
  const scrollRef = useRef<HTMLDivElement>(null)

  const processedLogs = useMemo((): (SyslogEntry & { level: LogLevel })[] => {
    if (!logs) return []
    return logs.map((entry) => ({
      ...entry,
      level: detectLevel(entry.t ?? ''),
    }))
  }, [logs])

  const filtered = useMemo(() => {
    let result = processedLogs
    if (levelFilter !== 'all') {
      result = result.filter((l) => l.level === levelFilter)
    }
    if (search) {
      const q = search.toLowerCase()
      result = result.filter((l) => l.t?.toLowerCase().includes(q))
    }
    return result
  }, [processedLogs, levelFilter, search])

  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [filtered, autoScroll])

  const counts = useMemo(() => ({
    info: processedLogs.filter((l) => l.level === 'info').length,
    warning: processedLogs.filter((l) => l.level === 'warning').length,
    error: processedLogs.filter((l) => l.level === 'error').length,
  }), [processedLogs])

  return (
    <div className="p-6 flex flex-col h-full">
      <motion.div
        className="flex items-center justify-between mb-4"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div>
          <h1 className="text-2xl font-bold font-display text-text-primary flex items-center gap-2">
            <ScrollText size={22} className="text-primary" /> Logs
          </h1>
          <p className="text-sm text-text-secondary mt-0.5">
            {filtered.length} of {processedLogs.length} entries
          </p>
        </div>
        <div className="flex items-center gap-2">
          {nodeNames.length > 1 && (
            <select
              className="input w-32 h-8 text-xs"
              value={activeNode ?? ''}
              onChange={(e) => setSelectedNode(e.target.value)}
            >
              {nodeNames.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          )}
          <Button variant="secondary" size="sm" icon={<RefreshCw size={14} />} onClick={() => refetch()}>
            Refresh
          </Button>
        </div>
      </motion.div>

      {/* Controls */}
      <div className="flex items-center gap-3 mb-3">
        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter logs..."
            className="input pl-8 h-8 text-xs"
          />
        </div>

        {/* Level filter */}
        <div className="flex gap-1">
          {([
            { id: 'all' as const, label: 'All', count: processedLogs.length, color: undefined },
            { id: 'info' as const, label: 'Info', count: counts.info, color: 'text-text-secondary' },
            { id: 'warning' as const, label: 'Warn', count: counts.warning, color: 'text-warning' },
            { id: 'error' as const, label: 'Error', count: counts.error, color: 'text-danger' },
          ]).map(({ id, label, count, color }) => (
            <button
              key={id}
              onClick={() => setLevelFilter(id)}
              className={cn(
                'px-2.5 py-1 rounded-lg text-xs font-medium transition-all border',
                levelFilter === id
                  ? 'bg-surface-tertiary border-border-bright text-text-primary'
                  : 'border-transparent text-text-tertiary hover:text-text-secondary',
                color
              )}
            >
              {label} <span className="opacity-60">({count})</span>
            </button>
          ))}
        </div>

        {/* Auto-scroll toggle */}
        <label className="flex items-center gap-1.5 cursor-pointer ml-auto">
          <div
            onClick={() => setAutoScroll(!autoScroll)}
            className={cn(
              'w-8 h-4 rounded-full transition-colors relative',
              autoScroll ? 'bg-primary' : 'bg-surface-tertiary border border-border'
            )}
          >
            <div className={cn(
              'absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform shadow-sm',
              autoScroll ? 'translate-x-4' : 'translate-x-0.5'
            )} />
          </div>
          <span className="text-xs text-text-tertiary">Auto-scroll</span>
        </label>
      </div>

      {/* Log viewer */}
      <div
        ref={scrollRef}
        className="flex-1 min-h-0 rounded-xl border border-border bg-surface overflow-y-auto font-mono text-xs"
        onScroll={(e) => {
          const el = e.currentTarget
          const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 50
          setAutoScroll(atBottom)
        }}
      >
        {isLoading ? (
          <div className="flex items-center justify-center py-20 text-text-tertiary">
            <RefreshCw size={18} className="animate-spin mr-2" />
            Loading logs...
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-text-tertiary">
            <ScrollText size={32} className="mb-2 opacity-30" />
            <p className="text-sm">No log entries match your filters</p>
          </div>
        ) : (
          <div className="divide-y divide-border/30">
            {filtered.map((entry) => (
              <LogLine key={entry.n} entry={entry} />
            ))}
          </div>
        )}
      </div>

      {/* Scroll to bottom btn */}
      {!autoScroll && (
        <motion.button
          className="absolute bottom-8 right-8 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary text-white text-xs font-medium shadow-glow-blue"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          onClick={() => {
            setAutoScroll(true)
            scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
          }}
        >
          <ChevronDown size={12} />
          Scroll to bottom
        </motion.button>
      )}
    </div>
  )
}
