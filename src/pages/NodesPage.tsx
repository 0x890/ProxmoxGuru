import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Server, RefreshCw, Power, RotateCcw, ChevronRight, Cpu, MemoryStick, HardDrive, Clock } from 'lucide-react'
import { useServerStore } from '@/store/serverStore'
import { useUIStore } from '@/store/uiStore'
import { useNodes, useNodeStatus, useNodeRrddata } from '@/hooks/useProxmox'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { ProgressBar, CircularProgress } from '@/components/ui/ProgressBar'
import { Button } from '@/components/ui/Button'
import { ConfirmModal } from '@/components/ui/Modal'
import { MetricChart } from '@/components/ui/MetricChart'
import { useToast } from '@/components/ui/Toast'
import { formatBytes, formatUptime, formatPercent } from '@/lib/utils'
import * as api from '@/api/proxmox'

function NodeDetailPanel({ node, serverId, onClose }: { node: string; serverId: string; onClose: () => void }) {
  const { data: status, isLoading } = useNodeStatus(serverId, node)
  const { data: rrddata } = useNodeRrddata(serverId, node, 'hour')
  const toast = useToast()
  const [confirmAction, setConfirmAction] = useState<'reboot' | 'shutdown' | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  async function handleAction(action: 'reboot' | 'shutdown') {
    setActionLoading(true)
    try {
      await api.nodeAction(serverId, node, action)
      toast.success(`Node ${action} initiated`, `${node} will ${action} shortly`)
    } catch (err) {
      toast.error(`Failed to ${action} node`, err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setActionLoading(false)
      setConfirmAction(null)
    }
  }

  const cpuPct = status ? (status.cpu * 100) : 0
  const memPct = status ? formatPercent(status.memory.used, status.memory.total) : 0

  const chartData = rrddata?.map((d) => ({
    time: d.time,
    cpu: (d.cpu ?? 0) * 100,
    mem: formatPercent(d.memused ?? 0, d.memtotal ?? 1),
  })) ?? []

  return (
    <motion.div
      className="fixed right-0 top-14 bottom-0 w-96 bg-surface border-l border-border z-20 overflow-y-auto"
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
    >
      <div className="p-5">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-bold font-display text-text-primary">{node}</h2>
            {status && (
              <p className="text-xs text-text-tertiary mt-0.5">{status.pveversion}</p>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <Button variant="secondary" size="sm" icon={<RotateCcw size={13} />} onClick={() => setConfirmAction('reboot')}>
              Reboot
            </Button>
            <Button variant="danger" size="sm" icon={<Power size={13} />} onClick={() => setConfirmAction('shutdown')}>
              Shutdown
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>✕</Button>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => <div key={i} className="h-20 rounded-lg shimmer" />)}
          </div>
        ) : status ? (
          <>
            {/* Circular gauges */}
            <div className="flex justify-around mb-5 p-4 rounded-xl bg-surface-secondary border border-border">
              <CircularProgress
                percentage={cpuPct}
                size={72}
                strokeWidth={5}
                label={`${cpuPct.toFixed(0)}%`}
                sublabel="CPU"
              />
              <CircularProgress
                percentage={memPct}
                size={72}
                strokeWidth={5}
                label={`${memPct.toFixed(0)}%`}
                sublabel="RAM"
              />
              <CircularProgress
                percentage={formatPercent(status.rootfs.used, status.rootfs.total)}
                size={72}
                strokeWidth={5}
                label={`${formatPercent(status.rootfs.used, status.rootfs.total).toFixed(0)}%`}
                sublabel="Disk"
              />
            </div>

            {/* Info */}
            <div className="space-y-2 mb-5">
              {[
                { label: 'CPU Model', value: status.cpuinfo.model },
                { label: 'CPU Cores', value: `${status.cpuinfo.cores} cores × ${status.cpuinfo.sockets} sockets` },
                { label: 'Memory', value: `${formatBytes(status.memory.used)} / ${formatBytes(status.memory.total)}` },
                { label: 'Swap', value: `${formatBytes(status.swap.used)} / ${formatBytes(status.swap.total)}` },
                { label: 'Root FS', value: `${formatBytes(status.rootfs.used)} / ${formatBytes(status.rootfs.total)}` },
                { label: 'Uptime', value: formatUptime(status.uptime) },
                { label: 'Kernel', value: status.kversion },
                { label: 'Load Avg', value: status.loadavg?.join(', ') ?? 'N/A' },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-start justify-between gap-2 py-1.5 border-b border-border last:border-0">
                  <span className="text-xs text-text-tertiary shrink-0">{label}</span>
                  <span className="text-xs text-text-primary text-right font-mono truncate max-w-48" title={String(value)}>{value}</span>
                </div>
              ))}
            </div>

            {/* Chart */}
            {chartData.length > 0 && (
              <MetricChart
                title="Last Hour"
                data={chartData}
                series={[
                  { key: 'cpu', label: 'CPU', color: '#4DA3FF', unit: '%' },
                  { key: 'mem', label: 'Memory', color: '#7B61FF', unit: '%' },
                ]}
                height={130}
              />
            )}
          </>
        ) : (
          <p className="text-sm text-text-tertiary text-center py-8">Failed to load node status</p>
        )}
      </div>

      <ConfirmModal
        open={confirmAction !== null}
        onClose={() => setConfirmAction(null)}
        onConfirm={() => confirmAction && handleAction(confirmAction)}
        title={`${confirmAction === 'reboot' ? 'Reboot' : 'Shutdown'} Node`}
        message={`Are you sure you want to ${confirmAction} node "${node}"? This will affect all running VMs.`}
        confirmLabel={confirmAction === 'reboot' ? 'Reboot' : 'Shutdown'}
        loading={actionLoading}
      />
    </motion.div>
  )
}

export default function NodesPage() {
  const activeServerId = useServerStore((s) => s.activeServerId)
  const selectedNode = useUIStore((s) => s.selectedNode)
  const setSelectedNode = useUIStore((s) => s.setSelectedNode)

  const { data: nodes, isLoading, refetch } = useNodes(activeServerId)

  return (
    <div className="p-6">
      <motion.div
        className="flex items-center justify-between mb-6"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div>
          <h1 className="text-2xl font-bold font-display text-text-primary flex items-center gap-2">
            <Server size={22} className="text-primary" /> Nodes
          </h1>
          <p className="text-sm text-text-secondary mt-0.5">
            {nodes?.length ?? 0} node{nodes?.length !== 1 ? 's' : ''} in cluster
          </p>
        </div>
        <Button variant="secondary" size="sm" icon={<RefreshCw size={14} />} onClick={() => refetch()}>
          Refresh
        </Button>
      </motion.div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 rounded-xl shimmer" />
          ))}
        </div>
      ) : nodes && nodes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {nodes.map((node, idx) => {
            const cpuPct = formatPercent(node.cpu * node.maxcpu, node.maxcpu)
            const memPct = formatPercent(node.mem, node.maxmem)
            const diskPct = formatPercent(node.disk, node.maxdisk)
            const isSelected = selectedNode === node.node

            return (
              <motion.div
                key={node.node}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.05 }}
                className={`card p-5 cursor-pointer transition-all duration-200 ${isSelected ? 'border-primary/50 glow-blue' : 'hover:border-border-bright'}`}
                onClick={() => setSelectedNode(isSelected ? null : node.node)}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${node.status === 'online' ? 'bg-success/10' : 'bg-danger/10'}`}>
                      <Server size={18} className={node.status === 'online' ? 'text-success' : 'text-danger'} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-text-primary">{node.node}</h3>
                      <p className="text-xs text-text-tertiary flex items-center gap-1">
                        <Clock size={10} />
                        {formatUptime(node.uptime)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={node.status} size="xs" />
                    <ChevronRight size={14} className={`text-text-tertiary transition-transform ${isSelected ? 'rotate-90' : ''}`} />
                  </div>
                </div>

                {/* Metrics */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Cpu size={12} className="text-primary shrink-0" />
                    <ProgressBar percentage={cpuPct} size="sm" className="flex-1" />
                    <span className="text-xs font-mono text-text-secondary w-10 text-right">{cpuPct.toFixed(0)}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MemoryStick size={12} className="text-purple shrink-0" />
                    <ProgressBar percentage={memPct} size="sm" className="flex-1" />
                    <span className="text-xs font-mono text-text-secondary w-10 text-right">{memPct.toFixed(0)}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <HardDrive size={12} className="text-success shrink-0" />
                    <ProgressBar percentage={diskPct} size="sm" className="flex-1" />
                    <span className="text-xs font-mono text-text-secondary w-10 text-right">{diskPct.toFixed(0)}%</span>
                  </div>
                </div>

                {/* Footer */}
                <div className="mt-4 pt-3 border-t border-border grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-2xs text-text-tertiary">RAM</p>
                    <p className="text-xs font-medium text-text-secondary">{formatBytes(node.mem)} / {formatBytes(node.maxmem)}</p>
                  </div>
                  <div>
                    <p className="text-2xs text-text-tertiary">CPUs</p>
                    <p className="text-xs font-medium text-text-secondary">{node.maxcpu} cores</p>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center py-24 text-text-tertiary">
          <Server size={40} className="mb-3 opacity-30" />
          <p className="text-base">No nodes found</p>
          <p className="text-sm mt-1">Ensure you are connected to a Proxmox cluster</p>
        </div>
      )}

      {/* Detail panel */}
      <AnimatePresence>
        {selectedNode && activeServerId && (
          <NodeDetailPanel
            key={selectedNode}
            node={selectedNode}
            serverId={activeServerId}
            onClose={() => setSelectedNode(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
