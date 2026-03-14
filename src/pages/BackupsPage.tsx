import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Archive, RefreshCw, Trash2, Download, AlertTriangle, HardDrive } from 'lucide-react'
import { useServerStore } from '@/store/serverStore'
import { useUIStore } from '@/store/uiStore'
import { useNodes, useStorage, useBackups } from '@/hooks/useProxmox'
import { DataTable, Column } from '@/components/ui/DataTable'
import { Button } from '@/components/ui/Button'
import { ConfirmModal } from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Toast'
import { formatBytes, formatTimestamp } from '@/lib/utils'
import * as api from '@/api/proxmox'
import type { Backup } from '@/types/proxmox'
import { cn } from '@/lib/utils'

export default function BackupsPage() {
  const activeServerId = useServerStore((s) => s.activeServerId)
  const selectedNode = useUIStore((s) => s.selectedNode)
  const toast = useToast()

  const { data: nodes } = useNodes(activeServerId)
  const nodeNames = useMemo(() => nodes?.map((n) => n.node) ?? [], [nodes])
  const activeNode = selectedNode ?? nodeNames[0] ?? null

  const { data: storageList } = useStorage(activeServerId, activeNode)
  const backupStorages = useMemo(
    () => storageList?.filter((s) => s.content.includes('backup')) ?? [],
    [storageList]
  )

  const [selectedStorageId, setSelectedStorageId] = useState<string | null>(null)
  const activeStorage = selectedStorageId ?? backupStorages[0]?.storage ?? null

  const { data: backups, isLoading, refetch } = useBackups(activeServerId, activeNode, activeStorage)
  const [deleteTarget, setDeleteTarget] = useState<Backup | null>(null)
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    if (!deleteTarget || !activeServerId || !activeNode || !activeStorage) return
    setDeleting(true)
    try {
      await api.deleteBackup(activeServerId, activeNode, activeStorage, deleteTarget.volid)
      toast.success('Backup deleted', deleteTarget.volid.split('/').pop())
      refetch()
    } catch (err) {
      toast.error('Delete failed', err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setDeleting(false)
      setDeleteTarget(null)
    }
  }

  const columns: Column<Backup>[] = [
    {
      key: 'volid',
      header: 'Backup',
      render: (v) => {
        const name = String(v).split('/').pop() ?? String(v)
        return (
          <div className="flex items-center gap-2">
            <Archive size={13} className="text-warning shrink-0" />
            <span className="text-xs font-mono text-text-primary truncate max-w-48" title={String(v)}>{name}</span>
          </div>
        )
      },
    },
    {
      key: 'vmid',
      header: 'VM/CT',
      sortable: true,
      render: (v) => <span className="text-xs font-mono text-text-secondary">{v ? String(v) : '—'}</span>,
    },
    {
      key: 'format',
      header: 'Format',
      render: (v) => <span className="badge badge-gray text-2xs">{String(v)}</span>,
    },
    {
      key: 'size',
      header: 'Size',
      sortable: true,
      render: (v) => <span className="text-xs font-mono text-text-secondary">{formatBytes(v as number)}</span>,
    },
    {
      key: 'ctime',
      header: 'Created',
      sortable: true,
      render: (v) => <span className="text-xs text-text-secondary">{formatTimestamp(v as number)}</span>,
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
            <Archive size={22} className="text-warning" /> Backups
          </h1>
          <p className="text-sm text-text-secondary mt-0.5">
            {backups?.length ?? 0} backups in {activeStorage ?? 'no storage'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {nodeNames.length > 1 && (
            <select
              className="input w-32 h-8 text-xs"
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

      {/* Storage selector */}
      {backupStorages.length > 0 && (
        <div className="flex gap-2 mb-5">
          {backupStorages.map((s) => (
            <button
              key={s.storage}
              onClick={() => setSelectedStorageId(s.storage)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all',
                activeStorage === s.storage
                  ? 'bg-primary/10 text-primary border-primary/30'
                  : 'text-text-secondary border-border hover:border-border-bright hover:text-text-primary'
              )}
            >
              <HardDrive size={12} />
              {s.storage}
            </button>
          ))}
        </div>
      )}

      {!activeStorage ? (
        <div className="flex flex-col items-center py-24 text-text-tertiary">
          <AlertTriangle size={40} className="mb-3 opacity-30" />
          <p className="text-base">No backup storage found</p>
          <p className="text-sm mt-1">Configure a storage pool with backup content type</p>
        </div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
          <DataTable
            data={(backups ?? []) as unknown as Record<string, unknown>[]}
            columns={columns as unknown as Column<Record<string, unknown>>[]}
            rowKey="volid"
            loading={isLoading}
            searchable
            searchPlaceholder="Search backups..."
            actions={(row) => (
              <Button
                variant="ghost"
                size="xs"
                icon={<Trash2 size={12} />}
                className="text-danger"
                onClick={() => setDeleteTarget(row as unknown as Backup)}
              />
            )}
            emptyState={
              <div className="flex flex-col items-center py-12 text-text-tertiary">
                <Archive size={32} className="mb-2 opacity-30" />
                <p>No backups found</p>
              </div>
            }
          />
        </motion.div>
      )}

      <ConfirmModal
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Backup"
        message={`Delete backup "${deleteTarget?.volid.split('/').pop()}"? This cannot be undone.`}
        confirmLabel="Delete"
        loading={deleting}
      />
    </div>
  )
}
