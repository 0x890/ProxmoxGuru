import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  Bell,
  ChevronDown,
  Circle,
  CheckCircle2,
  AlertTriangle,
  LogOut,
  Plus,
  RefreshCw,
  Server,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUIStore } from '@/store/uiStore'
import { useServerStore } from '@/store/serverStore'
import { useClusterStatus } from '@/hooks/useProxmox'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Button } from '@/components/ui/Button'

function Clock() {
  const [time, setTime] = useState(new Date())
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  return (
    <span className="font-mono text-xs text-text-tertiary tabular-nums">
      {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
    </span>
  )
}

function NotificationsDropdown({ onClose }: { onClose: () => void }) {
  const notifications = useUIStore((s) => s.notifications)
  const markAllRead = useUIStore((s) => s.markAllNotificationsRead)
  const clearAll = useUIStore((s) => s.clearNotifications)

  return (
    <motion.div
      className="absolute right-0 top-full mt-2 w-80 rounded-xl border border-border bg-surface shadow-glass-lg z-50"
      initial={{ opacity: 0, y: -8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.96 }}
      transition={{ duration: 0.15 }}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <span className="text-sm font-semibold text-text-primary">Notifications</span>
        <div className="flex gap-1">
          <Button variant="ghost" size="xs" onClick={markAllRead}>Mark all read</Button>
          <Button variant="ghost" size="xs" onClick={clearAll}>Clear</Button>
        </div>
      </div>
      <div className="max-h-80 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center py-10 text-text-tertiary">
            <CheckCircle2 size={24} className="mb-2 opacity-40" />
            <p className="text-sm">All caught up!</p>
          </div>
        ) : (
          notifications.slice(0, 20).map((n) => (
            <div
              key={n.id}
              className={cn(
                'flex items-start gap-3 px-4 py-3 border-b border-border last:border-0',
                !n.read && 'bg-primary/5'
              )}
            >
              <div className="mt-0.5 shrink-0">
                {n.type === 'success' && <CheckCircle2 size={14} className="text-success" />}
                {n.type === 'warning' && <AlertTriangle size={14} className="text-warning" />}
                {n.type === 'error' && <Circle size={14} className="text-danger" />}
                {n.type === 'info' && <Circle size={14} className="text-primary" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-text-primary">{n.title}</p>
                <p className="text-xs text-text-tertiary mt-0.5 truncate">{n.message}</p>
                <p className="text-2xs text-text-muted mt-1">
                  {n.timestamp.toLocaleTimeString()}
                </p>
              </div>
              {!n.read && (
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1 shrink-0" />
              )}
            </div>
          ))
        )}
      </div>
    </motion.div>
  )
}

function ServerDropdown({ onClose }: { onClose: () => void }) {
  const servers = useServerStore((s) => s.servers)
  const activeServerId = useServerStore((s) => s.activeServerId)
  const connectToServer = useServerStore((s) => s.connectToServer)
  const disconnectFromServer = useServerStore((s) => s.disconnectFromServer)
  const navigate = useNavigate()

  return (
    <motion.div
      className="absolute right-0 top-full mt-2 w-64 rounded-xl border border-border bg-surface shadow-glass-lg z-50"
      initial={{ opacity: 0, y: -8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.96 }}
      transition={{ duration: 0.15 }}
    >
      <div className="px-4 py-3 border-b border-border">
        <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">Servers</p>
      </div>
      <div className="py-1">
        {servers.map((server) => (
          <button
            key={server.id}
            onClick={() => {
              if (server.id === activeServerId) return
              connectToServer(server.id)
              onClose()
            }}
            className={cn(
              'w-full flex items-center gap-3 px-4 py-2.5 hover:bg-surface-hover transition-colors text-left',
              server.id === activeServerId && 'bg-primary/10'
            )}
          >
            <Server size={14} className={server.id === activeServerId ? 'text-primary' : 'text-text-tertiary'} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-primary truncate">{server.name}</p>
              <p className="text-xs text-text-tertiary truncate">{server.host}:{server.port}</p>
            </div>
            {server.id === activeServerId && (
              <div className="w-2 h-2 rounded-full bg-success shrink-0" />
            )}
          </button>
        ))}
      </div>
      <div className="border-t border-border py-1">
        <button
          onClick={() => { navigate('/settings'); onClose() }}
          className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-surface-hover transition-colors text-left"
        >
          <Plus size={14} className="text-text-tertiary" />
          <span className="text-sm text-text-secondary">Add server</span>
        </button>
        {activeServerId && (
          <button
            onClick={() => {
              disconnectFromServer(activeServerId)
              onClose()
            }}
            className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-surface-hover transition-colors text-left"
          >
            <LogOut size={14} className="text-danger" />
            <span className="text-sm text-danger">Disconnect</span>
          </button>
        )}
      </div>
    </motion.div>
  )
}

export default function TopBar() {
  const openCommandPalette = useUIStore((s) => s.openCommandPalette)
  const unreadCount = useUIStore((s) => s.unreadCount)
  const activeServer = useServerStore((s) => s.getActiveServer())
  const activeServerId = useServerStore((s) => s.activeServerId)
  const connectionStatus = useServerStore((s) => s.connectionStatus)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showServerDropdown, setShowServerDropdown] = useState(false)

  const { data: clusterStatus } = useClusterStatus(activeServerId)
  const clusterName = clusterStatus?.find((s) => s.type === 'cluster')?.name

  const unread = unreadCount()

  return (
    <header className="h-14 border-b border-border bg-surface flex items-center px-4 gap-3 shrink-0 relative z-10 drag-region">
      {/* Cluster info */}
      <div className="flex items-center gap-2 min-w-0 no-drag">
        {clusterName && (
          <span className="text-xs font-medium text-text-tertiary hidden sm:block">{clusterName}</span>
        )}
        {activeServer && (
          <StatusBadge
            status={connectionStatus === 'connected' ? 'online' : connectionStatus === 'connecting' ? 'warning' : 'offline'}
            label={activeServer.name}
            size="sm"
          />
        )}
      </div>

      <div className="flex-1" />

      {/* Clock */}
      <span className="no-drag"><Clock /></span>

      {/* Search / Command Palette */}
      <button
        onClick={openCommandPalette}
        className="no-drag flex items-center gap-2 h-8 px-3 rounded-lg border border-border bg-surface-secondary text-text-tertiary text-xs hover:border-border-bright hover:text-text-secondary transition-all group"
      >
        <Search size={13} />
        <span className="hidden sm:block">Search...</span>
        <kbd className="hidden sm:flex items-center gap-0.5 text-2xs bg-surface-tertiary border border-border rounded px-1 py-0.5 font-mono group-hover:border-border-bright transition-colors ml-1">
          <span>⌘</span><span>K</span>
        </kbd>
      </button>

      {/* Notifications */}
      <div className="relative no-drag">
        <button
          onClick={() => { setShowNotifications(!showNotifications); setShowServerDropdown(false) }}
          className="relative w-8 h-8 flex items-center justify-center rounded-lg text-text-tertiary hover:text-text-primary hover:bg-surface-hover transition-colors"
        >
          <Bell size={16} />
          {unread > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-danger flex items-center justify-center text-2xs text-white font-bold"
            >
              {unread > 9 ? '9+' : unread}
            </motion.span>
          )}
        </button>
        <AnimatePresence>
          {showNotifications && (
            <NotificationsDropdown onClose={() => setShowNotifications(false)} />
          )}
        </AnimatePresence>
      </div>

      {/* Refresh */}
      <button className="no-drag w-8 h-8 flex items-center justify-center rounded-lg text-text-tertiary hover:text-text-primary hover:bg-surface-hover transition-colors">
        <RefreshCw size={15} />
      </button>

      {/* Server selector */}
      <div className="relative no-drag">
        <button
          onClick={() => { setShowServerDropdown(!showServerDropdown); setShowNotifications(false) }}
          className="flex items-center gap-1.5 h-8 px-2.5 rounded-lg border border-border bg-surface-secondary text-text-secondary text-xs hover:border-border-bright hover:text-text-primary transition-all"
        >
          <Server size={13} />
          <span className="hidden sm:block max-w-24 truncate">
            {activeServer?.name ?? 'Connect...'}
          </span>
          <ChevronDown size={12} className="text-text-tertiary" />
        </button>
        <AnimatePresence>
          {showServerDropdown && (
            <ServerDropdown onClose={() => setShowServerDropdown(false)} />
          )}
        </AnimatePresence>
      </div>

      {/* Click outside to close */}
      {(showNotifications || showServerDropdown) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => { setShowNotifications(false); setShowServerDropdown(false) }}
        />
      )}
    </header>
  )
}
