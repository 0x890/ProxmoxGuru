import { useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
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
  ChevronLeft,
  ChevronRight,
  Zap,
  Wifi,
  WifiOff,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUIStore } from '@/store/uiStore'
import { useServerStore } from '@/store/serverStore'

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/nodes', label: 'Nodes', icon: Server },
  { path: '/vms', label: 'Virtual Machines', icon: MonitorSpeaker },
  { path: '/containers', label: 'Containers', icon: Box },
  { path: '/storage', label: 'Storage', icon: Database },
  { path: '/networking', label: 'Networking', icon: Network },
  { path: '/backups', label: 'Backups', icon: Archive },
  { path: '/tasks', label: 'Tasks', icon: ListTodo },
  { path: '/logs', label: 'Logs', icon: ScrollText },
]

const bottomItems = [
  { path: '/settings', label: 'Settings', icon: Settings },
]

const isMac = typeof window !== 'undefined' && window.platform === 'darwin'

export default function Sidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const collapsed = useUIStore((s) => s.sidebarCollapsed)
  const toggleSidebar = useUIStore((s) => s.toggleSidebar)
  const activeServer = useServerStore((s) => s.getActiveServer())
  const connectionStatus = useServerStore((s) => s.connectionStatus)

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  return (
    <motion.aside
      className="relative flex flex-col h-full bg-surface border-r border-border z-20"
      animate={{ width: collapsed ? 56 : 220 }}
      transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
    >
      {/* macOS traffic-light spacer — draggable, clears the 3 window buttons */}
      {isMac && (
        <div
          className="drag-region shrink-0 border-b border-border"
          style={{ height: 52 }}
        />
      )}

      {/* Logo */}
      <div className={cn(
        'flex items-center px-3 border-b border-border shrink-0 no-drag',
        isMac ? 'h-12' : 'h-14'
      )}>
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-purple flex items-center justify-center shrink-0 shadow-glow-blue">
            <Zap size={15} className="text-white" />
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.15 }}
                className="overflow-hidden"
              >
                <span className="font-display font-bold text-base text-text-primary whitespace-nowrap">
                  Proxmox<span className="text-gradient">Guru</span>
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-2 px-2 space-y-0.5 scrollbar-hide">
        {navItems.map(({ path, label, icon: Icon }) => {
          const active = isActive(path)
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={cn(
                'nav-item w-full relative group',
                active && 'active'
              )}
              title={collapsed ? label : undefined}
            >
              {active && (
                <motion.div
                  layoutId="activeNav"
                  className="absolute inset-0 rounded-lg bg-primary/10"
                  style={{ boxShadow: 'inset 0 0 0 1px rgba(77, 163, 255, 0.2)' }}
                  transition={{ duration: 0.2 }}
                />
              )}
              <span className="relative z-10 shrink-0">
                <Icon size={16} />
              </span>
              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -4 }}
                    transition={{ duration: 0.12 }}
                    className="relative z-10 whitespace-nowrap overflow-hidden text-ellipsis"
                  >
                    {label}
                  </motion.span>
                )}
              </AnimatePresence>

              {/* Tooltip when collapsed */}
              {collapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-surface-tertiary border border-border rounded-md text-xs text-text-primary whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 shadow-glass">
                  {label}
                </div>
              )}
            </button>
          )
        })}
      </nav>

      {/* Divider */}
      <div className="mx-3 h-px bg-border shrink-0" />

      {/* Bottom items */}
      <div className="py-2 px-2 space-y-0.5">
        {bottomItems.map(({ path, label, icon: Icon }) => (
          <button
            key={path}
            onClick={() => navigate(path)}
            className={cn('nav-item w-full relative group', isActive(path) && 'active')}
            title={collapsed ? label : undefined}
          >
            <Icon size={16} className="shrink-0" />
            <AnimatePresence>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.12 }}
                  className="whitespace-nowrap"
                >
                  {label}
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        ))}

        {/* Server status */}
        <div className={cn('flex items-center gap-2 px-3 py-2 rounded-lg overflow-hidden', !collapsed && 'mt-1')}>
          <span className="shrink-0">
            {connectionStatus === 'connected'
              ? <Wifi size={14} className="text-success" />
              : <WifiOff size={14} className="text-text-tertiary" />
            }
          </span>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="min-w-0 overflow-hidden"
              >
                <p className="text-xs font-medium text-text-secondary truncate">
                  {activeServer?.name ?? 'Not connected'}
                </p>
                <p className="text-2xs text-text-tertiary capitalize">{connectionStatus}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={toggleSidebar}
        className="absolute -right-3 top-16 w-6 h-6 rounded-full bg-surface border border-border flex items-center justify-center text-text-tertiary hover:text-text-primary hover:border-border-bright transition-all z-30 shadow-card"
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>
    </motion.aside>
  )
}
