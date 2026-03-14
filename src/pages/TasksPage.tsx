import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { ListTodo, CheckCircle2, XCircle, Loader2, RefreshCw, Filter } from 'lucide-react'
import { useServerStore } from '@/store/serverStore'
import { useUIStore } from '@/store/uiStore'
import { useNodes, useTasks, useTaskStatus } from '@/hooks/useProxmox'
import { DataTable, Column } from '@/components/ui/DataTable'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { formatTimestamp, timeAgo } from '@/lib/utils'
import type { Task } from '@/types/proxmox'
import { cn } from '@/lib/utils'

function TaskStatusBadge({ task }: { task: Task }) {
  const running = !task.endtime
  const ok = task.exitstatus === 'OK'
  const error = task.endtime && task.exitstatus && task.exitstatus !== 'OK'

  return (
    <div className="flex items-center gap-1.5">
      {running && (
        <>
          <Loader2 size={12} className="text-warning animate-spin" />
          <span className="text-xs text-warning font-medium">Running</span>
        </>
      )}
      {ok && (
        <>
          <CheckCircle2 size={12} className="text-success" />
          <span className="text-xs text-success font-medium">OK</span>
        </>
      )}
      {error && (
        <>
          <XCircle size={12} className="text-danger" />
          <span className="text-xs text-danger font-medium">{task.exitstatus}</span>
        </>
      )}
    </div>
  )
}

function TaskDetailModal({ task, serverId, node, onClose }: { task: Task; serverId: string; node: string; onClose: () => void }) {
  const { data: status } = useTaskStatus(serverId, node, task.upid)

  return (
    <Modal open onClose={onClose} title={`Task: ${task.type}`} size="lg">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Type', value: task.type },
            { label: 'Node', value: task.node },
            { label: 'User', value: task.user },
            { label: 'ID', value: task.id || '—' },
            { label: 'Started', value: formatTimestamp(task.starttime) },
            { label: 'Ended', value: task.endtime ? formatTimestamp(task.endtime) : 'Running...' },
            { label: 'Status', value: status?.exitstatus ?? (status?.status === 'running' ? 'Running' : 'Unknown') },
            { label: 'PID', value: String(task.pid) },
          ].map(({ label, value }) => (
            <div key={label} className="p-3 rounded-lg bg-surface-secondary">
              <p className="text-2xs text-text-tertiary mb-1">{label}</p>
              <p className="text-xs font-medium text-text-primary">{value}</p>
            </div>
          ))}
        </div>
        <div>
          <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-2">UPID</p>
          <p className="text-xs font-mono text-text-secondary bg-surface-secondary rounded-lg p-3 break-all">{task.upid}</p>
        </div>
      </div>
    </Modal>
  )
}

type TaskFilter = 'all' | 'running' | 'ok' | 'error'

export default function TasksPage() {
  const activeServerId = useServerStore((s) => s.activeServerId)
  const selectedNode = useUIStore((s) => s.selectedNode)
  const setSelectedNode = useUIStore((s) => s.setSelectedNode)

  const { data: nodes } = useNodes(activeServerId)
  const nodeNames = useMemo(() => nodes?.map((n) => n.node) ?? [], [nodes])
  const activeNode = selectedNode ?? nodeNames[0] ?? null

  const { data: tasks, isLoading, refetch } = useTasks(activeServerId, activeNode)
  const [filter, setFilter] = useState<TaskFilter>('all')
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)

  const filtered = useMemo(() => {
    if (!tasks) return []
    switch (filter) {
      case 'running': return tasks.filter((t) => !t.endtime)
      case 'ok': return tasks.filter((t) => t.exitstatus === 'OK')
      case 'error': return tasks.filter((t) => t.endtime && t.exitstatus && t.exitstatus !== 'OK')
      default: return tasks
    }
  }, [tasks, filter])

  const runningCount = tasks?.filter((t) => !t.endtime).length ?? 0

  const columns: Column<Task>[] = [
    {
      key: 'type',
      header: 'Type',
      sortable: true,
      render: (v, row) => (
        <div>
          <p className="text-sm font-medium text-text-primary">{String(v)}</p>
          {row.id && <p className="text-xs text-text-tertiary">{String(row.id)}</p>}
        </div>
      ),
    },
    {
      key: 'node',
      header: 'Node',
      sortable: true,
      render: (v) => <span className="text-xs text-text-secondary">{String(v)}</span>,
    },
    {
      key: 'user',
      header: 'User',
      render: (v) => <span className="text-xs text-text-secondary">{String(v)}</span>,
    },
    {
      key: 'starttime',
      header: 'Started',
      sortable: true,
      render: (v) => <span className="text-xs text-text-secondary">{timeAgo(v as number)}</span>,
    },
    {
      key: 'exitstatus',
      header: 'Status',
      render: (_, row) => <TaskStatusBadge task={row as unknown as Task} />,
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
            <ListTodo size={22} className="text-primary" /> Tasks
            {runningCount > 0 && (
              <span className="flex items-center gap-1.5 text-sm font-normal text-warning">
                <Loader2 size={14} className="animate-spin" />
                {runningCount} running
              </span>
            )}
          </h1>
          <p className="text-sm text-text-secondary mt-0.5">Auto-refreshes every 3 seconds</p>
        </div>
        <div className="flex items-center gap-2">
          {nodeNames.length > 1 && (
            <select
              className="input w-32 h-8 text-xs"
              value={activeNode ?? ''}
              onChange={(e) => setSelectedNode(e.target.value)}
            >
              {nodeNames.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          )}
          <Button variant="secondary" size="sm" icon={<RefreshCw size={14} />} onClick={() => refetch()}>
            Refresh
          </Button>
        </div>
      </motion.div>

      {/* Filter tabs */}
      <div className="flex gap-1 mb-4">
        {([
          { id: 'all', label: 'All', count: tasks?.length },
          { id: 'running', label: 'Running', count: tasks?.filter((t) => !t.endtime).length },
          { id: 'ok', label: 'Completed', count: tasks?.filter((t) => t.exitstatus === 'OK').length },
          { id: 'error', label: 'Error', count: tasks?.filter((t) => t.endtime && t.exitstatus !== 'OK').length },
        ] as const).map(({ id, label, count }) => (
          <button
            key={id}
            onClick={() => setFilter(id as TaskFilter)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
              filter === id ? 'bg-primary text-white shadow-glow-blue' : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
            )}
          >
            {label} {count !== undefined && <span className="opacity-70">({count})</span>}
          </button>
        ))}
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
        <DataTable
          data={filtered as unknown as Record<string, unknown>[]}
          columns={columns as unknown as Column<Record<string, unknown>>[]}
          rowKey="upid"
          loading={isLoading}
          searchable
          searchPlaceholder="Search tasks..."
          onRowClick={(row) => setSelectedTask(row as unknown as Task)}
          pageSize={30}
          emptyState={
            <div className="flex flex-col items-center py-12 text-text-tertiary">
              <ListTodo size={32} className="mb-2 opacity-30" />
              <p>No tasks found</p>
            </div>
          }
        />
      </motion.div>

      {selectedTask && activeServerId && activeNode && (
        <TaskDetailModal
          task={selectedTask}
          serverId={activeServerId}
          node={activeNode}
          onClose={() => setSelectedTask(null)}
        />
      )}
    </div>
  )
}
