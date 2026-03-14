import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  Cpu,
  MemoryStick,
  HardDrive,
  Network,
  MonitorSpeaker,
  Box,
  Server,
  Activity,
  CheckCircle2,
  AlertTriangle,
  XCircle,
} from 'lucide-react'
import { useServerStore } from '@/store/serverStore'
import { useUIStore } from '@/store/uiStore'
import {
  useClusterStatus,
  useNodes,
  useAllVMs,
  useAllContainers,
  useTasks,
} from '@/hooks/useProxmox'
import { MetricCard } from '@/components/ui/MetricCard'
import { MetricChart } from '@/components/ui/MetricChart'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { formatBytes, formatUptime, formatPercent, timeAgo } from '@/lib/utils'

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35 },
}

export default function DashboardPage() {
  const activeServerId = useServerStore((s) => s.activeServerId)
  const selectedNode = useUIStore((s) => s.selectedNode)
  const navigate = useNavigate()

  const { data: clusterStatus } = useClusterStatus(activeServerId)
  const { data: nodes, isLoading: nodesLoading } = useNodes(activeServerId)

  const nodeNames = useMemo(() => nodes?.map((n) => n.node) ?? [], [nodes])

  const { data: vms } = useAllVMs(activeServerId, nodeNames)
  const { data: containers } = useAllContainers(activeServerId, nodeNames)
  const { data: tasks } = useTasks(activeServerId, selectedNode ?? nodeNames[0] ?? null)

  const clusterNode = clusterStatus?.find((s) => s.type === 'cluster')
  const onlineNodes = nodes?.filter((n) => n.status === 'online') ?? []
  const offlineNodes = nodes?.filter((n) => n.status !== 'online') ?? []

  const runningVMs = vms?.filter((v) => v.status === 'running') ?? []
  const stoppedVMs = vms?.filter((v) => v.status === 'stopped') ?? []
  const runningContainers = containers?.filter((c) => c.status === 'running') ?? []

  const totalCPU = nodes?.reduce((a, n) => a + n.cpu * n.maxcpu, 0) ?? 0
  const totalMaxCPU = nodes?.reduce((a, n) => a + n.maxcpu, 0) ?? 1
  const totalMem = nodes?.reduce((a, n) => a + n.mem, 0) ?? 0
  const totalMaxMem = nodes?.reduce((a, n) => a + n.maxmem, 0) ?? 1
  const totalDisk = nodes?.reduce((a, n) => a + n.disk, 0) ?? 0
  const totalMaxDisk = nodes?.reduce((a, n) => a + n.maxdisk, 0) ?? 1

  const cpuPct = formatPercent(totalCPU, totalMaxCPU)
  const memPct = formatPercent(totalMem, totalMaxMem)
  const diskPct = formatPercent(totalDisk, totalMaxDisk)

  // Mock sparkline data for demo
  const cpuSparkline = Array.from({ length: 20 }, (_, i) => ({
    value: Math.max(0, cpuPct + (Math.random() - 0.5) * 15),
  }))
  const memSparkline = Array.from({ length: 20 }, (_, i) => ({
    value: Math.max(0, memPct + (Math.random() - 0.5) * 5),
  }))

  return (
    <div className="p-6 space-y-6">
      <motion.div {...fadeUp}>
        <h1 className="text-2xl font-bold font-display text-text-primary">Dashboard</h1>
        <p className="text-sm text-text-secondary mt-0.5">
          {clusterNode?.name ?? 'Cluster'} Overview
          {clusterNode && (
            <span className="ml-2">
              <StatusBadge status={clusterNode.quorate ? 'online' : 'warning'} label={clusterNode.quorate ? 'Quorate' : 'No Quorum'} size="xs" />
            </span>
          )}
        </p>
      </motion.div>

      {/* Cluster health cards */}
      <motion.div
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.05 }}
      >
        <div
          className="card p-4 cursor-pointer hover:border-border-bright transition-colors"
          onClick={() => navigate('/nodes')}
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center">
              <Server size={15} className="text-success" />
            </div>
            <span className="text-xs font-medium text-text-secondary uppercase tracking-wider">Nodes</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold text-text-primary font-display">{onlineNodes.length}</span>
            <span className="text-sm text-text-tertiary">/ {nodes?.length ?? 0} online</span>
          </div>
          {offlineNodes.length > 0 && (
            <p className="text-xs text-danger mt-1">{offlineNodes.length} offline</p>
          )}
        </div>

        <div className="card p-4 cursor-pointer hover:border-border-bright transition-colors" onClick={() => navigate('/vms')}>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <MonitorSpeaker size={15} className="text-primary" />
            </div>
            <span className="text-xs font-medium text-text-secondary uppercase tracking-wider">VMs</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold text-text-primary font-display">{runningVMs.length}</span>
            <span className="text-sm text-text-tertiary">/ {vms?.length ?? 0} running</span>
          </div>
          {stoppedVMs.length > 0 && (
            <p className="text-xs text-text-tertiary mt-1">{stoppedVMs.length} stopped</p>
          )}
        </div>

        <div className="card p-4 cursor-pointer hover:border-border-bright transition-colors" onClick={() => navigate('/containers')}>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-purple/10 flex items-center justify-center">
              <Box size={15} className="text-purple" />
            </div>
            <span className="text-xs font-medium text-text-secondary uppercase tracking-wider">Containers</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold text-text-primary font-display">{runningContainers.length}</span>
            <span className="text-sm text-text-tertiary">/ {containers?.length ?? 0} running</span>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-warning/10 flex items-center justify-center">
              <Activity size={15} className="text-warning" />
            </div>
            <span className="text-xs font-medium text-text-secondary uppercase tracking-wider">Tasks</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold text-text-primary font-display">
              {tasks?.filter((t) => !t.endtime).length ?? 0}
            </span>
            <span className="text-sm text-text-tertiary">running</span>
          </div>
          <p className="text-xs text-text-tertiary mt-1">{tasks?.length ?? 0} total</p>
        </div>
      </motion.div>

      {/* Metric cards */}
      <motion.div
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.1 }}
      >
        <MetricCard
          icon={<Cpu />}
          title="CPU Usage"
          value={cpuPct.toFixed(1)}
          unit="%"
          subtitle={`${totalMaxCPU} vCPUs total`}
          sparklineData={cpuSparkline}
          sparklineColor="#4DA3FF"
          glowColor="blue"
        />
        <MetricCard
          icon={<MemoryStick />}
          title="Memory"
          value={formatBytes(totalMem)}
          subtitle={`${formatBytes(totalMaxMem)} total · ${memPct.toFixed(1)}%`}
          sparklineData={memSparkline}
          sparklineColor="#7B61FF"
          glowColor="purple"
        />
        <MetricCard
          icon={<HardDrive />}
          title="Disk Used"
          value={formatBytes(totalDisk)}
          subtitle={`${formatBytes(totalMaxDisk)} total · ${diskPct.toFixed(1)}%`}
          glowColor="green"
        />
        <MetricCard
          icon={<Network />}
          title="Network I/O"
          value="—"
          subtitle="Across all nodes"
          glowColor="blue"
        />
      </motion.div>

      {/* Charts row */}
      <motion.div
        className="grid grid-cols-1 lg:grid-cols-2 gap-4"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.15 }}
      >
        <MetricChart
          title="CPU Utilization"
          data={Array.from({ length: 30 }, (_, i) => ({
            time: Math.floor(Date.now() / 1000) - (30 - i) * 60,
            cpu: Math.max(0, Math.min(1, cpuPct / 100 + (Math.random() - 0.5) * 0.1)),
          }))}
          series={[{ key: 'cpu', label: 'CPU', color: '#4DA3FF', unit: '%', format: (v) => `${(v * 100).toFixed(1)}%` }]}
          height={160}
        />
        <MetricChart
          title="Memory Utilization"
          data={Array.from({ length: 30 }, (_, i) => ({
            time: Math.floor(Date.now() / 1000) - (30 - i) * 60,
            mem: Math.max(0, totalMem + (Math.random() - 0.5) * totalMaxMem * 0.05),
          }))}
          series={[{ key: 'mem', label: 'Memory', color: '#7B61FF', format: (v) => formatBytes(v) }]}
          height={160}
        />
      </motion.div>

      {/* Nodes grid + Recent tasks */}
      <motion.div
        className="grid grid-cols-1 lg:grid-cols-3 gap-4"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.2 }}
      >
        {/* Nodes */}
        <div className="lg:col-span-2 card p-4">
          <h2 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
            <Server size={15} className="text-primary" /> Nodes
          </h2>
          {nodesLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <div key={i} className="h-16 rounded-lg shimmer" />)}
            </div>
          ) : nodes && nodes.length > 0 ? (
            <div className="space-y-3">
              {nodes.map((node) => {
                const cpu = formatPercent(node.cpu * node.maxcpu, node.maxcpu)
                const mem = formatPercent(node.mem, node.maxmem)
                return (
                  <div
                    key={node.node}
                    className="flex items-center gap-4 p-3 rounded-lg bg-surface-secondary border border-border hover:border-border-bright transition-colors cursor-pointer"
                    onClick={() => { useUIStore.getState().setSelectedNode(node.node); navigate('/nodes') }}
                  >
                    <div className="w-2 h-2 rounded-full shrink-0 mt-0.5" style={{ background: node.status === 'online' ? '#22C55E' : '#EF4444' }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-sm font-semibold text-text-primary">{node.node}</span>
                        <StatusBadge status={node.status} size="xs" />
                        <span className="text-xs text-text-tertiary ml-auto">up {formatUptime(node.uptime)}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <ProgressBar percentage={cpu} size="xs" label="CPU" sublabel={`${cpu.toFixed(0)}%`} showValue={false} />
                        <ProgressBar percentage={mem} size="xs" label="RAM" sublabel={`${mem.toFixed(0)}%`} showValue={false} />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-text-tertiary text-center py-8">No nodes found</p>
          )}
        </div>

        {/* Recent tasks */}
        <div className="card p-4">
          <h2 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
            <Activity size={15} className="text-primary" /> Recent Tasks
          </h2>
          {tasks && tasks.length > 0 ? (
            <div className="space-y-2">
              {tasks.slice(0, 8).map((task) => {
                const status = task.exitstatus === 'OK' ? 'ok' : !task.endtime ? 'running' : 'error'
                return (
                  <div key={task.upid} className="flex items-start gap-2 py-1.5">
                    {status === 'ok' && <CheckCircle2 size={13} className="text-success mt-0.5 shrink-0" />}
                    {status === 'running' && <Activity size={13} className="text-warning mt-0.5 shrink-0 animate-pulse" />}
                    {status === 'error' && <XCircle size={13} className="text-danger mt-0.5 shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-text-primary truncate">{task.type}</p>
                      <p className="text-2xs text-text-tertiary">{task.node} · {timeAgo(task.starttime)}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-text-tertiary text-center py-8">No recent tasks</p>
          )}
        </div>
      </motion.div>
    </div>
  )
}
