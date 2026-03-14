import type { ServerConfig } from './proxmox'

interface ProxmoxAPI {
  // Server Management
  getServers: () => Promise<(ServerConfig & { connected: boolean })[]>
  addServer: (config: ServerConfig) => Promise<{ success: boolean; id: string }>
  removeServer: (serverId: string) => Promise<{ success: boolean }>
  connectServer: (serverId: string) => Promise<{ success: boolean; username?: string; version?: unknown }>
  disconnectServer: (serverId: string) => Promise<{ success: boolean }>

  // Cluster
  getClusterStatus: (serverId: string) => Promise<unknown[]>
  getClusterResources: (serverId: string) => Promise<unknown[]>
  getVersion: (serverId: string) => Promise<unknown>

  // Nodes
  getNodes: (serverId: string) => Promise<unknown[]>
  getNodeStatus: (serverId: string, node: string) => Promise<unknown>
  getNodeRrddata: (serverId: string, node: string, timeframe: string) => Promise<unknown[]>
  nodeAction: (serverId: string, node: string, command: string) => Promise<unknown>

  // VMs
  getVMs: (serverId: string, node: string) => Promise<unknown[]>
  getVMStatus: (serverId: string, node: string, vmid: number) => Promise<unknown>
  getVMConfig: (serverId: string, node: string, vmid: number) => Promise<unknown>
  vmAction: (serverId: string, node: string, vmid: number, action: string) => Promise<unknown>
  getVMSnapshots: (serverId: string, node: string, vmid: number) => Promise<unknown[]>
  createVMSnapshot: (serverId: string, node: string, vmid: number, params: { snapname: string; description?: string; vmstate?: boolean }) => Promise<unknown>
  deleteVMSnapshot: (serverId: string, node: string, vmid: number, snapname: string) => Promise<unknown>
  getVMRrddata: (serverId: string, node: string, vmid: number, timeframe: string) => Promise<unknown[]>

  // Containers
  getContainers: (serverId: string, node: string) => Promise<unknown[]>
  getContainerStatus: (serverId: string, node: string, vmid: number) => Promise<unknown>
  getContainerConfig: (serverId: string, node: string, vmid: number) => Promise<unknown>
  containerAction: (serverId: string, node: string, vmid: number, action: string) => Promise<unknown>
  getContainerSnapshots: (serverId: string, node: string, vmid: number) => Promise<unknown[]>

  // Storage
  getStorage: (serverId: string, node: string) => Promise<unknown[]>
  getStorageContent: (serverId: string, node: string, storage: string) => Promise<unknown[]>

  // Network
  getNetwork: (serverId: string, node: string) => Promise<unknown[]>

  // Tasks
  getTasks: (serverId: string, node: string) => Promise<unknown[]>
  getTaskLog: (serverId: string, node: string, upid: string) => Promise<unknown[]>
  getTaskStatus: (serverId: string, node: string, upid: string) => Promise<unknown>

  // Backups
  getBackups: (serverId: string, node: string, storage: string) => Promise<unknown[]>
  createBackup: (serverId: string, node: string, params: unknown) => Promise<unknown>
  restoreBackup: (serverId: string, node: string, params: unknown) => Promise<unknown>
  deleteBackup: (serverId: string, node: string, storage: string, volid: string) => Promise<unknown>

  // Logs
  getLogs: (serverId: string, node: string) => Promise<unknown[]>
}

declare global {
  interface Window {
    proxmox: ProxmoxAPI
    platform: string
  }
}

export {}
