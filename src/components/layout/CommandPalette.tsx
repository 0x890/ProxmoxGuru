import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  LayoutDashboard,
  Server,
  MonitorSpeaker,
  Box,
  Database,
  Network,
  Archive,
  ListTodo,
  ScrollText,
  Settings,
  Play,
  Square,
  Power,
  Zap,
  ArrowRight,
} from 'lucide-react'
import { useUIStore } from '@/store/uiStore'
import { useServerStore } from '@/store/serverStore'
import { useNodes, useAllVMs } from '@/hooks/useProxmox'
import { fuzzyMatch } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface CommandItem {
  id: string
  label: string
  description?: string
  icon: React.ReactNode
  category: string
  action: () => void
  keywords?: string[]
}

export default function CommandPalette() {
  const open = useUIStore((s) => s.commandPaletteOpen)
  const close = useUIStore((s) => s.closeCommandPalette)
  const navigate = useNavigate()
  const activeServerId = useServerStore((s) => s.activeServerId)

  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const { data: nodes } = useNodes(activeServerId)
  const nodeNames = nodes?.map((n) => n.node) ?? []
  const { data: vms } = useAllVMs(activeServerId, nodeNames)

  const navCommands: CommandItem[] = [
    { id: 'nav-dashboard', label: 'Dashboard', description: 'Go to dashboard', icon: <LayoutDashboard size={16} />, category: 'Navigation', action: () => navigate('/'), keywords: ['home'] },
    { id: 'nav-nodes', label: 'Nodes', description: 'View all nodes', icon: <Server size={16} />, category: 'Navigation', action: () => navigate('/nodes') },
    { id: 'nav-vms', label: 'Virtual Machines', description: 'Manage VMs', icon: <MonitorSpeaker size={16} />, category: 'Navigation', action: () => navigate('/vms'), keywords: ['vm', 'qemu'] },
    { id: 'nav-containers', label: 'Containers', description: 'Manage LXC containers', icon: <Box size={16} />, category: 'Navigation', action: () => navigate('/containers'), keywords: ['lxc', 'ct'] },
    { id: 'nav-storage', label: 'Storage', description: 'View storage pools', icon: <Database size={16} />, category: 'Navigation', action: () => navigate('/storage'), keywords: ['disk', 'zfs'] },
    { id: 'nav-networking', label: 'Networking', description: 'Network interfaces', icon: <Network size={16} />, category: 'Navigation', action: () => navigate('/networking'), keywords: ['bridge', 'vlan', 'eth'] },
    { id: 'nav-backups', label: 'Backups', description: 'Backup management', icon: <Archive size={16} />, category: 'Navigation', action: () => navigate('/backups') },
    { id: 'nav-tasks', label: 'Tasks', description: 'Task monitor', icon: <ListTodo size={16} />, category: 'Navigation', action: () => navigate('/tasks') },
    { id: 'nav-logs', label: 'Logs', description: 'System logs', icon: <ScrollText size={16} />, category: 'Navigation', action: () => navigate('/logs'), keywords: ['syslog'] },
    { id: 'nav-settings', label: 'Settings', description: 'App settings', icon: <Settings size={16} />, category: 'Navigation', action: () => navigate('/settings') },
  ]

  const vmCommands: CommandItem[] = useMemo(() => {
    if (!vms) return []
    return vms.flatMap((vm) => [
      {
        id: `vm-start-${vm.vmid}`,
        label: `Start VM ${vm.name ?? vm.vmid}`,
        description: `Node: ${vm.node} • VMID: ${vm.vmid}`,
        icon: <Play size={16} className="text-success" />,
        category: 'VM Actions',
        action: () => {
          navigate('/vms')
          close()
        },
        keywords: [String(vm.vmid), vm.name ?? '', 'start', 'run'],
      },
      {
        id: `vm-stop-${vm.vmid}`,
        label: `Stop VM ${vm.name ?? vm.vmid}`,
        description: `Node: ${vm.node} • VMID: ${vm.vmid}`,
        icon: <Square size={16} className="text-danger" />,
        category: 'VM Actions',
        action: () => {
          navigate('/vms')
          close()
        },
        keywords: [String(vm.vmid), vm.name ?? '', 'stop', 'halt'],
      },
    ])
  }, [vms, navigate, close])

  const serverCommands: CommandItem[] = [
    {
      id: 'server-connect',
      label: 'Connect to Server',
      description: 'Add or connect a Proxmox server',
      icon: <Zap size={16} className="text-primary" />,
      category: 'Server',
      action: () => navigate('/settings'),
      keywords: ['connect', 'server', 'add'],
    },
  ]

  const allCommands = [...navCommands, ...vmCommands, ...serverCommands]

  const filtered = useMemo(() => {
    if (!query) return allCommands.slice(0, 12)
    return allCommands.filter(
      (cmd) =>
        fuzzyMatch(query, cmd.label) ||
        (cmd.description && fuzzyMatch(query, cmd.description)) ||
        cmd.keywords?.some((kw) => fuzzyMatch(query, kw))
    ).slice(0, 12)
  }, [query, allCommands])

  // Group by category
  const grouped = useMemo(() => {
    const map = new Map<string, CommandItem[]>()
    for (const item of filtered) {
      if (!map.has(item.category)) map.set(item.category, [])
      map.get(item.category)!.push(item)
    }
    return map
  }, [filtered])

  useEffect(() => {
    if (open) {
      setQuery('')
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      const item = filtered[selectedIndex]
      if (item) {
        item.action()
        close()
      }
    } else if (e.key === 'Escape') {
      close()
    }
  }

  let flatIndex = 0

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[60] flex items-start justify-center pt-[15vh]">
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
          />

          {/* Palette */}
          <motion.div
            className="relative w-full max-w-xl bg-surface border border-border rounded-2xl shadow-glass-lg overflow-hidden"
            initial={{ opacity: 0, y: -20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.96 }}
            transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
            onKeyDown={handleKey}
          >
            {/* Search input */}
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border">
              <Search size={18} className="text-text-tertiary shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search commands, VMs, pages..."
                className="flex-1 bg-transparent text-text-primary placeholder-text-tertiary text-sm outline-none"
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="text-xs text-text-tertiary hover:text-text-secondary px-1.5 py-0.5 rounded border border-border"
                >
                  Clear
                </button>
              )}
              <kbd className="flex items-center text-2xs text-text-tertiary bg-surface-tertiary border border-border rounded px-1.5 py-0.5 font-mono">
                esc
              </kbd>
            </div>

            {/* Results */}
            <div className="max-h-80 overflow-y-auto py-2">
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center py-10 text-text-tertiary">
                  <Search size={24} className="mb-2 opacity-30" />
                  <p className="text-sm">No results for &quot;{query}&quot;</p>
                </div>
              ) : (
                Array.from(grouped.entries()).map(([category, items]) => (
                  <div key={category}>
                    <div className="px-4 py-1.5">
                      <span className="text-2xs font-semibold text-text-muted uppercase tracking-wider">
                        {category}
                      </span>
                    </div>
                    {items.map((item) => {
                      const idx = flatIndex++
                      const isSelected = idx === selectedIndex
                      return (
                        <button
                          key={item.id}
                          className={cn(
                            'w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors',
                            isSelected ? 'bg-primary/10' : 'hover:bg-surface-hover'
                          )}
                          onClick={() => { item.action(); close() }}
                          onMouseEnter={() => setSelectedIndex(idx)}
                        >
                          <span className={cn('shrink-0', isSelected ? 'text-primary' : 'text-text-tertiary')}>
                            {item.icon}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className={cn('text-sm font-medium', isSelected ? 'text-primary' : 'text-text-primary')}>
                              {item.label}
                            </p>
                            {item.description && (
                              <p className="text-xs text-text-tertiary truncate">{item.description}</p>
                            )}
                          </div>
                          {isSelected && (
                            <ArrowRight size={14} className="text-primary shrink-0" />
                          )}
                        </button>
                      )
                    })}
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center gap-4 px-4 py-2.5 border-t border-border bg-surface-secondary">
              <div className="flex items-center gap-1.5 text-2xs text-text-muted">
                <kbd className="bg-surface-tertiary border border-border rounded px-1 py-0.5 font-mono">↑↓</kbd>
                <span>navigate</span>
              </div>
              <div className="flex items-center gap-1.5 text-2xs text-text-muted">
                <kbd className="bg-surface-tertiary border border-border rounded px-1 py-0.5 font-mono">↵</kbd>
                <span>select</span>
              </div>
              <div className="flex items-center gap-1.5 text-2xs text-text-muted">
                <kbd className="bg-surface-tertiary border border-border rounded px-1 py-0.5 font-mono">esc</kbd>
                <span>close</span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
