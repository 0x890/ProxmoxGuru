import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MonitorSpeaker,
  Play,
  Square,
  PowerOff,
  RefreshCw,
  Pause,
  SkipForward,
  Camera,
  Trash2,
  Plus,
  X,
} from 'lucide-react'
import { useServerStore } from '@/store/serverStore'
import { useUIStore } from '@/store/uiStore'
import {
  useNodes,
  useAllVMs,
  useVMConfig,
  useVMSnapshots,
  useVMAction,
  useCreateVMSnapshot,
  useDeleteVMSnapshot,
} from '@/hooks/useProxmox'
import { DataTable, Column } from '@/components/ui/DataTable'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Button } from '@/components/ui/Button'
import { ConfirmModal, Modal } from '@/components/ui/Modal'
import { MetricChart } from '@/components/ui/MetricChart'
import { useToast } from '@/components/ui/Toast'
import { formatBytes, formatUptime, formatPercent, timeAgo } from '@/lib/utils'
import type { VM } from '@/types/proxmox'

type VMFilter = 'all' | 'running' | 'stopped'

function VMDetailPanel({ vm, serverId, onClose }: { vm: VM; serverId: string; onClose: () => void }) {
  const toast = useToast()
  const [activeTab, setActiveTab] = useState<'overview' | 'config' | 'snapshots'>('overview')
  const [showSnapshotModal, setShowSnapshotModal] = useState(false)
  const [snapName, setSnapName] = useState('')
  const [snapDesc, setSnapDesc] = useState('')
  const [deleteSnap, setDeleteSnap] = useState<string | null>(null)

  const { data: config } = useVMConfig(serverId, vm.node, vm.vmid)
  const { data: snapshots, refetch: refetchSnaps } = useVMSnapshots(serverId, vm.node, vm.vmid)
  const vmAction = useVMAction()
  const createSnap = useCreateVMSnapshot()
  const deleteSnapMut = useDeleteVMSnapshot()

  async function doAction(action: 'start' | 'stop' | 'shutdown' | 'reset' | 'suspend' | 'resume') {
    try {
      await vmAction.mutateAsync({ serverId, node: vm.node, vmid: vm.vmid, action })
      toast.success(`VM ${action}`, `${vm.name} ${action} initiated`)
    } catch (err) {
      toast.error(`Failed to ${action} VM`, err instanceof Error ? err.message : 'Unknown error')
    }
  }

  async function handleCreateSnapshot() {
    if (!snapName) return
    try {
      await createSnap.mutateAsync({ serverId, node: vm.node, vmid: vm.vmid, params: { snapname: snapName, description: snapDesc } })
      toast.success('Snapshot created', snapName)
      setShowSnapshotModal(false)
      setSnapName('')
      setSnapDesc('')
      refetchSnaps()
    } catch (err) {
      toast.error('Snapshot failed', err instanceof Error ? err.message : 'Unknown error')
    }
  }

  async function handleDeleteSnapshot(snapname: string) {
    try {
      await deleteSnapMut.mutateAsync({ serverId, node: vm.node, vmid: vm.vmid, snapname })
      toast.success('Snapshot deleted', snapname)
      refetchSnaps()
    } catch (err) {
      toast.error('Delete failed', err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setDeleteSnap(null)
    }
  }

  const cpuPct = formatPercent(vm.cpu * vm.maxcpu, vm.maxcpu)
  const memPct = formatPercent(vm.mem, vm.maxmem)

  const tabs = ['overview', 'config', 'snapshots'] as const

  return (
    <motion.div
      className="fixed right-0 top-14 bottom-0 w-96 bg-surface border-l border-border z-20 flex flex-col"
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
    >
      {/* Header */}
      <div className="p-4 border-b border-border shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-base font-bold text-text-primary">{vm.name ?? `VM ${vm.vmid}`}</h2>
            <p className="text-xs text-text-tertiary">VMID {vm.vmid} · {vm.node}</p>
          </div>
          <div className="flex items-center gap-1">
            <StatusBadge status={vm.status} size="xs" />
            <Button variant="ghost" size="xs" icon={<X size={13} />} onClick={onClose} />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-1 flex-wrap">
          {vm.status === 'stopped' && (
            <Button variant="secondary" size="xs" icon={<Play size={11} />} onClick={() => doAction('start')}>Start</Button>
          )}
          {vm.status === 'running' && (
            <>
              <Button variant="secondary" size="xs" icon={<PowerOff size={11} />} onClick={() => doAction('shutdown')}>Shutdown</Button>
              <Button variant="danger" size="xs" icon={<Square size={11} />} onClick={() => doAction('stop')}>Force Stop</Button>
              <Button variant="secondary" size="xs" icon={<Pause size={11} />} onClick={() => doAction('suspend')}>Suspend</Button>
              <Button variant="secondary" size="xs" icon={<RefreshCw size={11} />} onClick={() => doAction('reset')}>Reset</Button>
            </>
          )}
          {vm.status === 'suspended' && (
            <Button variant="secondary" size="xs" icon={<SkipForward size={11} />} onClick={() => doAction('resume')}>Resume</Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border shrink-0">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2.5 text-xs font-medium capitalize transition-colors ${activeTab === tab ? 'text-primary border-b-2 border-primary' : 'text-text-tertiary hover:text-text-secondary'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'overview' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Status', value: vm.status },
                { label: 'Uptime', value: formatUptime(vm.uptime) },
                { label: 'CPU Usage', value: `${cpuPct.toFixed(1)}%` },
                { label: 'CPUs', value: String(vm.maxcpu) },
                { label: 'Memory', value: formatBytes(vm.mem) },
                { label: 'Max Memory', value: formatBytes(vm.maxmem) },
                { label: 'Disk', value: formatBytes(vm.disk) },
                { label: 'Max Disk', value: formatBytes(vm.maxdisk) },
              ].map(({ label, value }) => (
                <div key={label} className="p-2.5 rounded-lg bg-surface-secondary">
                  <p className="text-2xs text-text-tertiary mb-0.5">{label}</p>
                  <p className="text-xs font-semibold text-text-primary">{value}</p>
                </div>
              ))}
            </div>
            <MetricChart
              title="Live Metrics"
              data={Array.from({ length: 20 }, (_, i) => ({
                time: Math.floor(Date.now() / 1000) - (20 - i) * 30,
                cpu: Math.max(0, cpuPct + (Math.random() - 0.5) * 10),
                mem: Math.max(0, memPct + (Math.random() - 0.5) * 3),
              }))}
              series={[
                { key: 'cpu', label: 'CPU', color: '#4DA3FF', unit: '%' },
                { key: 'mem', label: 'Mem', color: '#7B61FF', unit: '%' },
              ]}
              height={120}
            />
          </div>
        )}

        {activeTab === 'config' && config && (
          <div className="space-y-1">
            {Object.entries(config)
              .filter(([, v]) => v !== undefined && v !== null && v !== '')
              .map(([key, value]) => (
                <div key={key} className="flex items-start justify-between gap-2 py-1.5 border-b border-border last:border-0">
                  <span className="text-xs text-text-tertiary shrink-0 w-20 truncate">{key}</span>
                  <span className="text-xs text-text-primary text-right font-mono break-all">{String(value)}</span>
                </div>
              ))}
          </div>
        )}

        {activeTab === 'snapshots' && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-text-secondary">{snapshots?.length ?? 0} snapshots</span>
              <Button variant="secondary" size="xs" icon={<Plus size={11} />} onClick={() => setShowSnapshotModal(true)}>
                Create
              </Button>
            </div>
            {snapshots && snapshots.length > 0 ? (
              <div className="space-y-2">
                {snapshots.filter(s => s.name !== 'current').map((snap) => (
                  <div key={snap.name} className="flex items-start gap-2 p-3 rounded-lg bg-surface-secondary border border-border">
                    <Camera size={13} className="text-primary mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-text-primary">{snap.name}</p>
                      {snap.description && <p className="text-2xs text-text-tertiary mt-0.5">{snap.description}</p>}
                      {snap.snaptime && <p className="text-2xs text-text-muted mt-0.5">{timeAgo(snap.snaptime)}</p>}
                    </div>
                    <Button
                      variant="ghost"
                      size="xs"
                      icon={<Trash2 size={11} />}
                      className="text-danger"
                      onClick={() => setDeleteSnap(snap.name)}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-text-tertiary text-center py-8">No snapshots</p>
            )}
          </div>
        )}
      </div>

      {/* Snapshot create modal */}
      <Modal open={showSnapshotModal} onClose={() => setShowSnapshotModal(false)} title="Create Snapshot" size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowSnapshotModal(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleCreateSnapshot} loading={createSnap.isPending} disabled={!snapName}>Create</Button>
          </>
        }
      >
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">Snapshot Name</label>
            <input className="input" value={snapName} onChange={(e) => setSnapName(e.target.value)} placeholder="snap-before-update" />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">Description</label>
            <input className="input" value={snapDesc} onChange={(e) => setSnapDesc(e.target.value)} placeholder="Optional description" />
          </div>
        </div>
      </Modal>

      <ConfirmModal
        open={deleteSnap !== null}
        onClose={() => setDeleteSnap(null)}
        onConfirm={() => deleteSnap && handleDeleteSnapshot(deleteSnap)}
        title="Delete Snapshot"
        message={`Delete snapshot "${deleteSnap}"? This cannot be undone.`}
        confirmLabel="Delete"
        loading={deleteSnapMut.isPending}
      />
    </motion.div>
  )
}

export default function VMsPage() {
  const activeServerId = useServerStore((s) => s.activeServerId)
  const selectedVMId = useUIStore((s) => s.selectedVMId)
  const setSelectedVMId = useUIStore((s) => s.setSelectedVMId)
  const toast = useToast()

  const { data: nodes } = useNodes(activeServerId)
  const nodeNames = useMemo(() => nodes?.map((n) => n.node) ?? [], [nodes])
  const { data: vms, isLoading, refetch } = useAllVMs(activeServerId, nodeNames)
  const vmAction = useVMAction()

  const [filter, setFilter] = useState<VMFilter>('all')

  const filtered = useMemo(() => {
    if (!vms) return []
    if (filter === 'running') return vms.filter((v) => v.status === 'running')
    if (filter === 'stopped') return vms.filter((v) => v.status === 'stopped')
    return vms
  }, [vms, filter])

  const selectedVM = vms?.find((v) => v.vmid === selectedVMId) ?? null

  async function quickAction(vm: VM, action: 'start' | 'stop' | 'shutdown' | 'reset') {
    try {
      await vmAction.mutateAsync({ serverId: activeServerId!, node: vm.node, vmid: vm.vmid, action })
      toast.success(`VM ${action}`, `${vm.name ?? vm.vmid} ${action} initiated`)
    } catch (err) {
      toast.error(`Failed to ${action}`, err instanceof Error ? err.message : 'Unknown error')
    }
  }

  const columns: Column<VM>[] = [
    {
      key: 'vmid',
      header: 'VMID',
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
          <p className="text-sm font-medium text-text-primary">{String(v) || `VM ${row.vmid}`}</p>
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
            <MonitorSpeaker size={22} className="text-primary" /> Virtual Machines
          </h1>
          <p className="text-sm text-text-secondary mt-0.5">{vms?.length ?? 0} VMs total</p>
        </div>
        <Button variant="secondary" size="sm" icon={<RefreshCw size={14} />} onClick={() => refetch()}>
          Refresh
        </Button>
      </motion.div>

      {/* Filter tabs */}
      <div className="flex gap-1 mb-4">
        {(['all', 'running', 'stopped'] as VMFilter[]).map((f) => {
          const count = f === 'all' ? vms?.length : vms?.filter((v) => v.status === f).length
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                filter === f ? 'bg-primary text-white shadow-glow-blue' : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
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
          searchPlaceholder="Search VMs..."
          onRowClick={(row) => setSelectedVMId(selectedVMId === (row.vmid as number) ? null : (row.vmid as number))}
          selectedRowId={selectedVMId}
          actions={(row) => {
            const vm = row as unknown as VM
            return (
              <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                {vm.status === 'stopped' && (
                  <Button variant="ghost" size="xs" icon={<Play size={12} />} onClick={() => quickAction(vm, 'start')} />
                )}
                {vm.status === 'running' && (
                  <>
                    <Button variant="ghost" size="xs" icon={<PowerOff size={12} />} onClick={() => quickAction(vm, 'shutdown')} />
                    <Button variant="ghost" size="xs" icon={<Square size={12} />} className="text-danger" onClick={() => quickAction(vm, 'stop')} />
                  </>
                )}
              </div>
            )
          }}
          emptyState={
            <div className="flex flex-col items-center py-12 text-text-tertiary">
              <MonitorSpeaker size={32} className="mb-2 opacity-30" />
              <p>No virtual machines found</p>
            </div>
          }
        />
      </motion.div>

      <AnimatePresence>
        {selectedVM && activeServerId && (
          <VMDetailPanel
            key={selectedVM.vmid}
            vm={selectedVM}
            serverId={activeServerId}
            onClose={() => setSelectedVMId(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
