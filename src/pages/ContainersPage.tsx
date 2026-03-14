import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Box,
  Play,
  Square,
  PowerOff,
  RefreshCw,
  RotateCcw,
  X,
} from 'lucide-react'
import { useServerStore } from '@/store/serverStore'
import { useUIStore } from '@/store/uiStore'
import {
  useNodes,
  useAllContainers,
  useContainerAction,
} from '@/hooks/useProxmox'
import { DataTable, Column } from '@/components/ui/DataTable'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Button } from '@/components/ui/Button'
import { MetricChart } from '@/components/ui/MetricChart'
import { useToast } from '@/components/ui/Toast'
import { formatBytes, formatUptime, formatPercent } from '@/lib/utils'
import type { Container } from '@/types/proxmox'

type CTFilter = 'all' | 'running' | 'stopped'

function ContainerDetailPanel({ ct, serverId, onClose }: { ct: Container; serverId: string; onClose: () => void }) {
  const toast = useToast()
  const containerAction = useContainerAction()

  async function doAction(action: 'start' | 'stop' | 'shutdown' | 'restart' | 'suspend' | 'resume') {
    try {
      await containerAction.mutateAsync({ serverId, node: ct.node, vmid: ct.vmid, action })
      toast.success(`Container ${action}`, `${ct.name} ${action} initiated`)
    } catch (err) {
      toast.error(`Failed to ${action}`, err instanceof Error ? err.message : 'Unknown error')
    }
  }

  const cpuPct = formatPercent(ct.cpu * ct.maxcpu, ct.maxcpu)
  const memPct = formatPercent(ct.mem, ct.maxmem)
  const diskPct = formatPercent(ct.disk, ct.maxdisk)

  return (
    <motion.div
      className="fixed right-0 top-14 bottom-0 w-96 bg-surface border-l border-border z-20 flex flex-col"
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
    >
      <div className="p-4 border-b border-border shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-base font-bold text-text-primary">{ct.name ?? `CT ${ct.vmid}`}</h2>
            <p className="text-xs text-text-tertiary">CTID {ct.vmid} · {ct.node}</p>
          </div>
          <div className="flex items-center gap-1">
            <StatusBadge status={ct.status} size="xs" />
            <Button variant="ghost" size="xs" icon={<X size={13} />} onClick={onClose} />
          </div>
        </div>

        <div className="flex gap-1 flex-wrap">
          {ct.status === 'stopped' && (
            <Button variant="secondary" size="xs" icon={<Play size={11} />} onClick={() => doAction('start')}>Start</Button>
          )}
          {ct.status === 'running' && (
            <>
              <Button variant="secondary" size="xs" icon={<PowerOff size={11} />} onClick={() => doAction('shutdown')}>Shutdown</Button>
              <Button variant="danger" size="xs" icon={<Square size={11} />} onClick={() => doAction('stop')}>Stop</Button>
              <Button variant="secondary" size="xs" icon={<RotateCcw size={11} />} onClick={() => doAction('restart')}>Restart</Button>
            </>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Status', value: ct.status },
              { label: 'Uptime', value: formatUptime(ct.uptime) },
              { label: 'CPU Usage', value: `${cpuPct.toFixed(1)}%` },
              { label: 'CPUs', value: String(ct.maxcpu) },
              { label: 'Memory', value: `${formatBytes(ct.mem)} / ${formatBytes(ct.maxmem)}` },
              { label: 'Memory %', value: `${memPct.toFixed(1)}%` },
              { label: 'Disk', value: `${formatBytes(ct.disk)} / ${formatBytes(ct.maxdisk)}` },
              { label: 'Disk %', value: `${diskPct.toFixed(1)}%` },
            ].map(({ label, value }) => (
              <div key={label} className="p-2.5 rounded-lg bg-surface-secondary">
                <p className="text-2xs text-text-tertiary mb-0.5">{label}</p>
                <p className="text-xs font-semibold text-text-primary">{value}</p>
              </div>
            ))}
          </div>

          {ct.netin !== undefined && (
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Net In', value: formatBytes(ct.netin ?? 0) },
                { label: 'Net Out', value: formatBytes(ct.netout ?? 0) },
              ].map(({ label, value }) => (
                <div key={label} className="p-2.5 rounded-lg bg-surface-secondary">
                  <p className="text-2xs text-text-tertiary mb-0.5">{label}</p>
                  <p className="text-xs font-semibold text-text-primary">{value}</p>
                </div>
              ))}
            </div>
          )}

          <MetricChart
            title="Resource Usage"
            data={Array.from({ length: 20 }, (_, i) => ({
              time: Math.floor(Date.now() / 1000) - (20 - i) * 30,
              cpu: Math.max(0, cpuPct + (Math.random() - 0.5) * 10),
              mem: Math.max(0, memPct + (Math.random() - 0.5) * 5),
            }))}
            series={[
              { key: 'cpu', label: 'CPU', color: '#4DA3FF', unit: '%' },
              { key: 'mem', label: 'Mem', color: '#7B61FF', unit: '%' },
            ]}
            height={120}
          />
        </div>
      </div>
    </motion.div>
  )
}

export default function ContainersPage() {
  const activeServerId = useServerStore((s) => s.activeServerId)
  const selectedContainerId = useUIStore((s) => s.selectedContainerId)
  const setSelectedContainerId = useUIStore((s) => s.setSelectedContainerId)
  const toast = useToast()

  const { data: nodes } = useNodes(activeServerId)
  const nodeNames = useMemo(() => nodes?.map((n) => n.node) ?? [], [nodes])
  const { data: containers, isLoading, refetch } = useAllContainers(activeServerId, nodeNames)
  const containerAction = useContainerAction()

  const [filter, setFilter] = useState<CTFilter>('all')

  const filtered = useMemo(() => {
    if (!containers) return []
    if (filter === 'running') return containers.filter((c) => c.status === 'running')
    if (filter === 'stopped') return containers.filter((c) => c.status === 'stopped')
    return containers
  }, [containers, filter])

  const selectedCT = containers?.find((c) => c.vmid === selectedContainerId) ?? null

  async function quickAction(ct: Container, action: 'start' | 'stop' | 'shutdown' | 'restart') {
    try {
      await containerAction.mutateAsync({ serverId: activeServerId!, node: ct.node, vmid: ct.vmid, action })
      toast.success(`Container ${action}`, `${ct.name ?? ct.vmid} ${action} initiated`)
    } catch (err) {
      toast.error(`Failed to ${action}`, err instanceof Error ? err.message : 'Unknown error')
    }
  }

  const columns: Column<Container>[] = [
    {
      key: 'vmid',
      header: 'CTID',
      sortable: true,
      width: '70px',
      render: (v) => <span className="text-xs font-mono text-text-secondary">{String(v)}</span>,
    },
    {
      key: 'name',
      header: 'Name',
      sortable: true,
      render: (v, row) => (
        <div>
          <p className="text-sm font-medium text-text-primary">{String(v) || `CT ${row.vmid}`}</p>
          <p className="text-xs text-text-tertiary">{String(row.node)}</p>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (v) => <StatusBadge status={String(v)} size="xs" />,
    },
    {
      key: 'cpu',
      header: 'CPU',
      sortable: true,
      render: (v, row) => {
        const pct = formatPercent((v as number) * (row.maxcpu as number), row.maxcpu as number)
        return <span className="text-xs font-mono text-text-secondary">{pct.toFixed(1)}%</span>
      },
    },
    {
      key: 'mem',
      header: 'RAM',
      sortable: true,
      render: (v, row) => (
        <span className="text-xs font-mono text-text-secondary">
          {formatBytes(v as number)} / {formatBytes(row.maxmem as number)}
        </span>
      ),
    },
    {
      key: 'disk',
      header: 'Disk',
      sortable: true,
      render: (v) => <span className="text-xs font-mono text-text-secondary">{formatBytes(v as number)}</span>,
    },
    {
      key: 'uptime',
      header: 'Uptime',
      sortable: true,
      render: (v) => <span className="text-xs text-text-secondary">{formatUptime(v as number)}</span>,
    },
  ]

  return (
    <div className="p-6">
      <motion.div
        className="flex items-center justify-between mb-6"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div>
          <h1 className="text-2xl font-bold font-display text-text-primary flex items-center gap-2">
            <Box size={22} className="text-purple" /> Containers
          </h1>
          <p className="text-sm text-text-secondary mt-0.5">{containers?.length ?? 0} LXC containers</p>
        </div>
        <Button variant="secondary" size="sm" icon={<RefreshCw size={14} />} onClick={() => refetch()}>
          Refresh
        </Button>
      </motion.div>

      <div className="flex gap-1 mb-4">
        {(['all', 'running', 'stopped'] as CTFilter[]).map((f) => {
          const count = f === 'all' ? containers?.length : containers?.filter((c) => c.status === f).length
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                filter === f ? 'bg-purple text-white shadow-glow-purple' : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
              }`}
            >
              {f} {count !== undefined && <span className="opacity-70">({count})</span>}
            </button>
          )
        })}
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
        <DataTable
          data={filtered as unknown as Record<string, unknown>[]}
          columns={columns as unknown as Column<Record<string, unknown>>[]}
          rowKey="vmid"
          loading={isLoading}
          searchable
          searchPlaceholder="Search containers..."
          onRowClick={(row) => setSelectedContainerId(selectedContainerId === (row.vmid as number) ? null : (row.vmid as number))}
          selectedRowId={selectedContainerId}
          actions={(row) => {
            const ct = row as unknown as Container
            return (
              <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                {ct.status === 'stopped' && (
                  <Button variant="ghost" size="xs" icon={<Play size={12} />} onClick={() => quickAction(ct, 'start')} />
                )}
                {ct.status === 'running' && (
                  <>
                    <Button variant="ghost" size="xs" icon={<RotateCcw size={12} />} onClick={() => quickAction(ct, 'restart')} />
                    <Button variant="ghost" size="xs" icon={<PowerOff size={12} />} onClick={() => quickAction(ct, 'shutdown')} />
                    <Button variant="ghost" size="xs" icon={<Square size={12} />} className="text-danger" onClick={() => quickAction(ct, 'stop')} />
                  </>
                )}
              </div>
            )
          }}
          emptyState={
            <div className="flex flex-col items-center py-12 text-text-tertiary">
              <Box size={32} className="mb-2 opacity-30" />
              <p>No containers found</p>
            </div>
          }
        />
      </motion.div>

      <AnimatePresence>
        {selectedCT && activeServerId && (
          <ContainerDetailPanel
            key={selectedCT.vmid}
            ct={selectedCT}
            serverId={activeServerId}
            onClose={() => setSelectedContainerId(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
