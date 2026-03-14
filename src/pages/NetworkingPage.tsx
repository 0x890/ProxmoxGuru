import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Network, RefreshCw, Wifi, Link, GitBranch } from 'lucide-react'
import { useServerStore } from '@/store/serverStore'
import { useUIStore } from '@/store/uiStore'
import { useNodes, useNetwork } from '@/hooks/useProxmox'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import type { NetworkInterface } from '@/types/proxmox'

const typeIcons: Record<string, React.ReactNode> = {
  eth: <Wifi size={14} />,
  bridge: <GitBranch size={14} />,
  bond: <Link size={14} />,
  vlan: <Network size={14} />,
  alias: <Network size={14} />,
  OVSBridge: <GitBranch size={14} />,
  OVSBond: <Link size={14} />,
  OVSIntPort: <Network size={14} />,
  OVSPort: <Network size={14} />,
}

const typeColors: Record<string, string> = {
  eth: 'badge-blue',
  bridge: 'badge-green',
  bond: 'badge-purple',
  vlan: 'badge-yellow',
  alias: 'badge-gray',
  OVSBridge: 'badge-green',
  OVSBond: 'badge-purple',
  OVSIntPort: 'badge-gray',
  OVSPort: 'badge-gray',
}

function InterfaceCard({ iface }: { iface: NetworkInterface }) {
  return (
    <div className="card p-4 hover:border-border-bright transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', iface.active ? 'bg-success/10 text-success' : 'bg-surface-tertiary text-text-tertiary')}>
            {typeIcons[iface.type] ?? <Network size={14} />}
          </div>
          <div>
            <h3 className="text-sm font-bold text-text-primary">{iface.iface}</h3>
            <span className={cn('badge text-2xs mt-0.5', typeColors[iface.type] ?? 'badge-gray')}>
              {iface.type}
            </span>
          </div>
        </div>
        <StatusBadge status={iface.active ? 'online' : 'offline'} size="xs" label={iface.active ? 'UP' : 'DOWN'} />
      </div>

      <div className="space-y-1.5">
        {iface.address && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-tertiary">IPv4</span>
            <span className="text-xs font-mono text-text-primary">{iface.address}/{iface.netmask}</span>
          </div>
        )}
        {iface.address6 && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-tertiary">IPv6</span>
            <span className="text-xs font-mono text-text-primary truncate max-w-40">{iface.address6}</span>
          </div>
        )}
        {iface.gateway && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-tertiary">Gateway</span>
            <span className="text-xs font-mono text-text-primary">{iface.gateway}</span>
          </div>
        )}
        {iface.bridge_ports && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-tertiary">Ports</span>
            <span className="text-xs font-mono text-text-secondary">{iface.bridge_ports}</span>
          </div>
        )}
        {iface.bond_mode && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-tertiary">Bond Mode</span>
            <span className="text-xs font-mono text-text-secondary">{iface.bond_mode}</span>
          </div>
        )}
        {iface.vlan_id && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-tertiary">VLAN ID</span>
            <span className="text-xs font-mono text-text-primary">{iface.vlan_id}</span>
          </div>
        )}
        {iface.vlan_raw_device && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-tertiary">Raw Device</span>
            <span className="text-xs font-mono text-text-secondary">{iface.vlan_raw_device}</span>
          </div>
        )}
        {iface.autostart === 1 && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-tertiary">Autostart</span>
            <span className="text-xs text-success">Yes</span>
          </div>
        )}
        {iface.comments && (
          <p className="text-xs text-text-tertiary italic mt-1">{iface.comments}</p>
        )}
      </div>
    </div>
  )
}

function NodeNetworkSection({ node, serverId }: { node: string; serverId: string }) {
  const { data: interfaces, isLoading, refetch } = useNetwork(serverId, node)

  const grouped = useMemo(() => {
    if (!interfaces) return {}
    const g: Record<string, NetworkInterface[]> = {}
    for (const iface of interfaces) {
      const type = iface.type ?? 'other'
      if (!g[type]) g[type] = []
      g[type].push(iface)
    }
    return g
  }, [interfaces])

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {[1, 2, 3].map((i) => <div key={i} className="h-36 rounded-xl shimmer" />)}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {Object.entries(grouped).map(([type, ifaces]) => (
        <div key={type}>
          <h3 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-2 flex items-center gap-1.5">
            {typeIcons[type] ?? <Network size={12} />}
            {type} ({ifaces.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {ifaces.map((iface) => (
              <InterfaceCard key={iface.iface} iface={iface} />
            ))}
          </div>
        </div>
      ))}
      {interfaces?.length === 0 && (
        <p className="text-sm text-text-tertiary text-center py-8">No network interfaces found</p>
      )}
    </div>
  )
}

export default function NetworkingPage() {
  const activeServerId = useServerStore((s) => s.activeServerId)
  const selectedNode = useUIStore((s) => s.selectedNode)

  const { data: nodes } = useNodes(activeServerId)
  const nodeNames = useMemo(() => nodes?.map((n) => n.node) ?? [], [nodes])
  const activeNode = selectedNode ?? nodeNames[0] ?? null

  return (
    <div className="p-6">
      <motion.div
        className="flex items-center justify-between mb-6"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div>
          <h1 className="text-2xl font-bold font-display text-text-primary flex items-center gap-2">
            <Network size={22} className="text-primary" /> Networking
          </h1>
          <p className="text-sm text-text-secondary mt-0.5">
            Network interfaces on {activeNode ?? 'no node selected'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {nodeNames.length > 1 && (
            <div className="flex gap-1">
              {nodeNames.map((n) => (
                <button
                  key={n}
                  onClick={() => useUIStore.getState().setSelectedNode(n)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                    activeNode === n ? 'bg-primary text-white' : 'text-text-secondary hover:bg-surface-hover'
                  )}
                >
                  {n}
                </button>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      {activeServerId && activeNode ? (
        <NodeNetworkSection node={activeNode} serverId={activeServerId} />
      ) : (
        <div className="flex flex-col items-center py-24 text-text-tertiary">
          <Network size={40} className="mb-3 opacity-30" />
          <p className="text-base">No node selected</p>
          <p className="text-sm mt-1">Select a node to view network interfaces</p>
        </div>
      )}
    </div>
  )
}
