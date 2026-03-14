import type {
  Node,
  NodeStatus,
  NodeRrdData,
  VM,
  VMConfig,
  VMStatus,
  VMSnapshot,
  Container,
  ContainerConfig,
  ContainerStatus,
  Storage,
  StorageContent,
  NetworkInterface,
  Task,
  TaskLog,
  TaskStatus,
  Backup,
  ClusterStatus,
  ClusterResource,
  SyslogEntry,
  Server,
  ServerConfig,
} from '@/types/proxmox'

function assertProxmox(): void {
  if (typeof window === 'undefined' || !window.proxmox) {
    throw new Error('Proxmox IPC bridge not available')
  }
}

// ─── Server Management ────────────────────────────────────────────────────────

export async function getServers(): Promise<(Server & { connected: boolean })[]> {
  assertProxmox()
  const data = await window.proxmox.getServers()
  return data as (Server & { connected: boolean })[]
}

export async function addServer(config: ServerConfig): Promise<{ success: boolean; id: string }> {
  assertProxmox()
  return window.proxmox.addServer(config)
}

export async function removeServer(serverId: string): Promise<{ success: boolean }> {
  assertProxmox()
  return window.proxmox.removeServer(serverId)
}

export async function connectServer(serverId: string): Promise<{ success: boolean; username?: string }> {
  assertProxmox()
  return window.proxmox.connectServer(serverId) as Promise<{ success: boolean; username?: string }>
}

export async function disconnectServer(serverId: string): Promise<{ success: boolean }> {
  assertProxmox()
  return window.proxmox.disconnectServer(serverId)
}

// ─── Cluster ─────────────────────────────────────────────────────────────────

export async function getClusterStatus(serverId: string): Promise<ClusterStatus[]> {
  assertProxmox()
  const data = await window.proxmox.getClusterStatus(serverId)
  return data as ClusterStatus[]
}

export async function getClusterResources(serverId: string): Promise<ClusterResource[]> {
  assertProxmox()
  const data = await window.proxmox.getClusterResources(serverId)
  return data as ClusterResource[]
}

export async function getVersion(serverId: string): Promise<{ version: string; release: string }> {
  assertProxmox()
  const data = await window.proxmox.getVersion(serverId)
  return data as { version: string; release: string }
}

// ─── Nodes ────────────────────────────────────────────────────────────────────

export async function getNodes(serverId: string): Promise<Node[]> {
  assertProxmox()
  const data = await window.proxmox.getNodes(serverId)
  return data as Node[]
}

export async function getNodeStatus(serverId: string, node: string): Promise<NodeStatus> {
  assertProxmox()
  const data = await window.proxmox.getNodeStatus(serverId, node)
  return data as NodeStatus
}

export async function getNodeRrddata(serverId: string, node: string, timeframe: string): Promise<NodeRrdData[]> {
  assertProxmox()
  const data = await window.proxmox.getNodeRrddata(serverId, node, timeframe)
  return data as NodeRrdData[]
}

export async function nodeAction(serverId: string, node: string, command: 'reboot' | 'shutdown'): Promise<void> {
  assertProxmox()
  await window.proxmox.nodeAction(serverId, node, command)
}

// ─── VMs ─────────────────────────────────────────────────────────────────────

export async function getVMs(serverId: string, node: string): Promise<VM[]> {
  assertProxmox()
  const data = await window.proxmox.getVMs(serverId, node)
  return data as VM[]
}

export async function getVMStatus(serverId: string, node: string, vmid: number): Promise<VMStatus> {
  assertProxmox()
  const data = await window.proxmox.getVMStatus(serverId, node, vmid)
  return data as VMStatus
}

export async function getVMConfig(serverId: string, node: string, vmid: number): Promise<VMConfig> {
  assertProxmox()
  const data = await window.proxmox.getVMConfig(serverId, node, vmid)
  return data as VMConfig
}

export async function vmAction(
  serverId: string,
  node: string,
  vmid: number,
  action: 'start' | 'stop' | 'shutdown' | 'reset' | 'suspend' | 'resume'
): Promise<string> {
  assertProxmox()
  const data = await window.proxmox.vmAction(serverId, node, vmid, action)
  return data as string
}

export async function getVMSnapshots(serverId: string, node: string, vmid: number): Promise<VMSnapshot[]> {
  assertProxmox()
  const data = await window.proxmox.getVMSnapshots(serverId, node, vmid)
  return data as VMSnapshot[]
}

export async function createVMSnapshot(
  serverId: string,
  node: string,
  vmid: number,
  params: { snapname: string; description?: string; vmstate?: boolean }
): Promise<string> {
  assertProxmox()
  const data = await window.proxmox.createVMSnapshot(serverId, node, vmid, params)
  return data as string
}

export async function deleteVMSnapshot(
  serverId: string,
  node: string,
  vmid: number,
  snapname: string
): Promise<string> {
  assertProxmox()
  const data = await window.proxmox.deleteVMSnapshot(serverId, node, vmid, snapname)
  return data as string
}

export async function getVMRrddata(serverId: string, node: string, vmid: number, timeframe: string): Promise<NodeRrdData[]> {
  assertProxmox()
  const data = await window.proxmox.getVMRrddata(serverId, node, vmid, timeframe)
  return data as NodeRrdData[]
}

// ─── Containers ───────────────────────────────────────────────────────────────

export async function getContainers(serverId: string, node: string): Promise<Container[]> {
  assertProxmox()
  const data = await window.proxmox.getContainers(serverId, node)
  return data as Container[]
}

export async function getContainerStatus(serverId: string, node: string, vmid: number): Promise<ContainerStatus> {
  assertProxmox()
  const data = await window.proxmox.getContainerStatus(serverId, node, vmid)
  return data as ContainerStatus
}

export async function getContainerConfig(serverId: string, node: string, vmid: number): Promise<ContainerConfig> {
  assertProxmox()
  const data = await window.proxmox.getContainerConfig(serverId, node, vmid)
  return data as ContainerConfig
}

export async function containerAction(
  serverId: string,
  node: string,
  vmid: number,
  action: 'start' | 'stop' | 'shutdown' | 'restart' | 'suspend' | 'resume'
): Promise<string> {
  assertProxmox()
  const data = await window.proxmox.containerAction(serverId, node, vmid, action)
  return data as string
}

export async function getContainerSnapshots(serverId: string, node: string, vmid: number): Promise<VMSnapshot[]> {
  assertProxmox()
  const data = await window.proxmox.getContainerSnapshots(serverId, node, vmid)
  return data as VMSnapshot[]
}

// ─── Storage ─────────────────────────────────────────────────────────────────

export async function getStorage(serverId: string, node: string): Promise<Storage[]> {
  assertProxmox()
  const data = await window.proxmox.getStorage(serverId, node)
  return data as Storage[]
}

export async function getStorageContent(serverId: string, node: string, storage: string): Promise<StorageContent[]> {
  assertProxmox()
  const data = await window.proxmox.getStorageContent(serverId, node, storage)
  return data as StorageContent[]
}

// ─── Network ─────────────────────────────────────────────────────────────────

export async function getNetwork(serverId: string, node: string): Promise<NetworkInterface[]> {
  assertProxmox()
  const data = await window.proxmox.getNetwork(serverId, node)
  return data as NetworkInterface[]
}

// ─── Tasks ────────────────────────────────────────────────────────────────────

export async function getTasks(serverId: string, node: string): Promise<Task[]> {
  assertProxmox()
  const data = await window.proxmox.getTasks(serverId, node)
  return data as Task[]
}

export async function getTaskLog(serverId: string, node: string, upid: string): Promise<TaskLog[]> {
  assertProxmox()
  const data = await window.proxmox.getTaskLog(serverId, node, upid)
  return data as TaskLog[]
}

export async function getTaskStatus(serverId: string, node: string, upid: string): Promise<TaskStatus> {
  assertProxmox()
  const data = await window.proxmox.getTaskStatus(serverId, node, upid)
  return data as TaskStatus
}

// ─── Backups ──────────────────────────────────────────────────────────────────

export async function getBackups(serverId: string, node: string, storage: string): Promise<Backup[]> {
  assertProxmox()
  const data = await window.proxmox.getBackups(serverId, node, storage)
  return data as Backup[]
}

export async function createBackup(serverId: string, node: string, params: unknown): Promise<string> {
  assertProxmox()
  const data = await window.proxmox.createBackup(serverId, node, params)
  return data as string
}

export async function restoreBackup(serverId: string, node: string, params: unknown): Promise<string> {
  assertProxmox()
  const data = await window.proxmox.restoreBackup(serverId, node, params)
  return data as string
}

export async function deleteBackup(serverId: string, node: string, storage: string, volid: string): Promise<void> {
  assertProxmox()
  await window.proxmox.deleteBackup(serverId, node, storage, volid)
}

// ─── Logs ─────────────────────────────────────────────────────────────────────

export async function getLogs(serverId: string, node: string): Promise<SyslogEntry[]> {
  assertProxmox()
  const data = await window.proxmox.getLogs(serverId, node)
  return data as SyslogEntry[]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}

export function formatUptime(seconds: number): string {
  if (!seconds || seconds < 0) return 'N/A'
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  if (days > 0) return `${days}d ${hours}h ${minutes}m`
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes}m`
}

export function formatCPU(cpu: number): string {
  return `${(cpu * 100).toFixed(1)}%`
}

export function getUsageColor(percentage: number): string {
  if (percentage < 60) return '#22C55E'
  if (percentage < 85) return '#F59E0B'
  return '#EF4444'
}
