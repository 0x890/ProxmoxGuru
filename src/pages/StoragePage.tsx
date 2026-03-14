import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Database, RefreshCw, HardDrive, ChevronRight } from 'lucide-react'
import { useServerStore } from '@/store/serverStore'
import { useUIStore } from '@/store/uiStore'
import { useNodes, useStorage, useStorageContent } from '@/hooks/useProxmox'
import { CircularProgress } from '@/components/ui/ProgressBar'
import { Button } from '@/components/ui/Button'
import { DataTable, Column } from '@/components/ui/DataTable'
import { formatBytes, formatPercent } from '@/lib/utils'
import type { Storage, StorageContent } from '@/types/proxmox'
import { cn } from '@/lib/utils'

const typeColors: Record<string, string> = {
  zfspool: 'badge-blue',
  lvm: 'badge-purple',
  lvmthin: 'badge-purple',
  dir: 'badge-gray',
  nfs: 'badge-yellow',
  cifs: 'badge-yellow',
  cephfs: 'badge-green',
  rbd: 'badge-green',
  btrfs: 'badge-blue',
}

function StorageContentPanel({ node, storage, serverId }: { node: string; storage: string; serverId: string }) {
  const { data: contents, isLoading } = useStorageContent(serverId, node, storage)

  const columns: Column<StorageContent>[] = [
    {
      key: 'volid',
      header: 'Volume',
      render: (v) => (
        <span className="text-xs font-mono text-text-primary truncate max-w-48 block" title={String(v)}>
          {String(v).split('/').pop()}
        </span>
      ),
    },
    {
      key: 'content',
      header: 'Type',
      render: (v) => <span className="badge badge-gray">{String(v)}</span>,
    },
    {
      key: 'size',
      header: 'Size',
      sortable: true,
      render: (v) => <span className="text-xs font-mono text-text-secondary">{formatBytes(v as number)}</span>,
    },
    {
      key: 'vmid',
      header: 'VM/CT',
      render: (v) => <span className="text-xs text-text-secondary">{v ? String(v) : '—'}</span>,
    },
  ]

  if (isLoading) {
    return <div className="h-32 rounded-lg shimmer mt-4" />
  }

  return (
    <div className="mt-4">
      <DataTable
        data={(contents ?? []) as unknown as Record<string, unknown>[]}
        columns={columns as unknown as Column<Record<string, unknown>>[]}
        rowKey="volid"
        pageSize={10}
        searchable
        searchPlaceholder="Search volumes..."
        emptyState={<p className="text-sm text-text-tertiary py-6 text-center">No content</p>}
      />
    </div>
  )
}

export default function StoragePage() {
  const activeServerId = useServerStore((s) => s.activeServerId)
  const selectedNode = useUIStore((s) => s.selectedNode)

  const { data: nodes } = useNodes(activeServerId)
  const nodeNames = useMemo(() => nodes?.map((n) => n.node) ?? [], [nodes])
  const activeNode = selectedNode ?? nodeNames[0] ?? null

  const { data: storage, isLoading, refetch } = useStorage(activeServerId, activeNode)
  const [selectedStorage, setSelectedStorage] = useState<string | null>(null)
  const selectedStorageObj = storage?.find((s) => s.storage === selectedStorage)

  return (
    <div className="p-6">
      <motion.div
        className="flex items-center justify-between mb-6"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div>
          <h1 className="text-2xl font-bold font-display text-text-primary flex items-center gap-2">
            <Database size={22} className="text-primary" /> Storage
          </h1>
          <p className="text-sm text-text-secondary mt-0.5">
            {storage?.length ?? 0} storage pools on {activeNode ?? 'no node selected'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Node selector */}
          {nodeNames.length > 1 && (
            <select
              className="input w-36 h-8 text-xs"
              value={activeNode ?? ''}
              onChange={(e) => useUIStore.getState().setSelectedNode(e.target.value)}
            >
              {nodeNames.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          )}
          <Button variant="secondary" size="sm" icon={<RefreshCw size={14} />} onClick={() => refetch()}>
            Refresh
          </Button>
        </div>
      </motion.div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <div key={i} className="h-52 rounded-xl shimmer" />)}
        </div>
      ) : storage && storage.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {storage.map((s, idx) => {
              const pct = formatPercent(s.used, s.total)
              const isSelected = selectedStorage === s.storage

              return (
                <motion.div
                  key={s.storage}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: idx * 0.05 }}
                  className={cn(
                    'card p-5 cursor-pointer transition-all duration-200',
                    isSelected ? 'border-primary/50 glow-blue' : 'hover:border-border-bright'
                  )}
                  onClick={() => setSelectedStorage(isSelected ? null : s.storage)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-3">
                      <CircularProgress
                        percentage={pct}
                        size={64}
                        strokeWidth={5}
                        label={`${pct.toFixed(0)}%`}
                        sublabel="used"
                      />
                      <div>
                        <h3 className="text-sm font-bold text-text-primary">{s.storage}</h3>
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          <span className={cn('badge text-2xs', typeColors[s.type] ?? 'badge-gray')}>
                            {s.type.toUpperCase()}
                          </span>
                          {s.shared === 1 && (
                            <span className="badge badge-blue text-2xs">shared</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <ChevronRight size={14} className={`text-text-tertiary transition-transform mt-1 ${isSelected ? 'rotate-90' : ''}`} />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-text-tertiary">Used</span>
                      <span className="font-mono text-text-secondary">{formatBytes(s.used)}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-text-tertiary">Available</span>
                      <span className="font-mono text-text-secondary">{formatBytes(s.avail)}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-text-tertiary">Total</span>
                      <span className="font-mono text-text-primary font-semibold">{formatBytes(s.total)}</span>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-border">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {s.content.split(',').map((c) => (
                        <span key={c} className="badge badge-gray text-2xs">{c.trim()}</span>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>

          {/* Content panel */}
          {selectedStorage && activeServerId && activeNode && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="card p-5"
            >
              <div className="flex items-center gap-2 mb-1">
                <HardDrive size={15} className="text-primary" />
                <h2 className="text-sm font-semibold text-text-primary">
                  {selectedStorage} contents
                </h2>
                {selectedStorageObj && (
                  <span className="text-xs text-text-tertiary">
                    · {formatBytes(selectedStorageObj.used)} used
                  </span>
                )}
              </div>
              <StorageContentPanel
                node={activeNode}
                storage={selectedStorage}
                serverId={activeServerId}
              />
            </motion.div>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center py-24 text-text-tertiary">
          <Database size={40} className="mb-3 opacity-30" />
          <p className="text-base">No storage pools found</p>
          {!activeNode && <p className="text-sm mt-1">Select a node to view storage</p>}
        </div>
      )}
    </div>
  )
}
