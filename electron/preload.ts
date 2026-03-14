import { contextBridge, ipcRenderer } from 'electron'

const proxmoxAPI = {
  // Server Management
  getServers: () => ipcRenderer.invoke('get-servers'),
  addServer: (config: unknown) => ipcRenderer.invoke('add-server', config),
  removeServer: (serverId: string) => ipcRenderer.invoke('remove-server', serverId),
  connectServer: (serverId: string) => ipcRenderer.invoke('connect-server', serverId),
  disconnectServer: (serverId: string) => ipcRenderer.invoke('disconnect-server', serverId),

  // Cluster
  getClusterStatus: (serverId: string) => ipcRenderer.invoke('get-cluster-status', serverId),
  getClusterResources: (serverId: string) => ipcRenderer.invoke('get-cluster-resources', serverId),
  getVersion: (serverId: string) => ipcRenderer.invoke('get-version', serverId),

  // Nodes
  getNodes: (serverId: string) => ipcRenderer.invoke('get-nodes', serverId),
  getNodeStatus: (serverId: string, node: string) => ipcRenderer.invoke('get-node-status', serverId, node),
  getNodeRrddata: (serverId: string, node: string, timeframe: string) =>
    ipcRenderer.invoke('get-node-rrddata', serverId, node, timeframe),
  nodeAction: (serverId: string, node: string, command: string) =>
    ipcRenderer.invoke('node-action', serverId, node, command),

  // VMs
  getVMs: (serverId: string, node: string) => ipcRenderer.invoke('get-vms', serverId, node),
  getVMStatus: (serverId: string, node: string, vmid: number) =>
    ipcRenderer.invoke('get-vm-status', serverId, node, vmid),
  getVMConfig: (serverId: string, node: string, vmid: number) =>
    ipcRenderer.invoke('get-vm-config', serverId, node, vmid),
  vmAction: (serverId: string, node: string, vmid: number, action: string) =>
    ipcRenderer.invoke('vm-action', serverId, node, vmid, action),
  getVMSnapshots: (serverId: string, node: string, vmid: number) =>
    ipcRenderer.invoke('get-vm-snapshots', serverId, node, vmid),
  createVMSnapshot: (serverId: string, node: string, vmid: number, params: unknown) =>
    ipcRenderer.invoke('create-vm-snapshot', serverId, node, vmid, params),
  deleteVMSnapshot: (serverId: string, node: string, vmid: number, snapname: string) =>
    ipcRenderer.invoke('delete-vm-snapshot', serverId, node, vmid, snapname),
  getVMRrddata: (serverId: string, node: string, vmid: number, timeframe: string) =>
    ipcRenderer.invoke('get-vm-rrddata', serverId, node, vmid, timeframe),

  // Containers
  getContainers: (serverId: string, node: string) =>
    ipcRenderer.invoke('get-containers', serverId, node),
  getContainerStatus: (serverId: string, node: string, vmid: number) =>
    ipcRenderer.invoke('get-container-status', serverId, node, vmid),
  getContainerConfig: (serverId: string, node: string, vmid: number) =>
    ipcRenderer.invoke('get-container-config', serverId, node, vmid),
  containerAction: (serverId: string, node: string, vmid: number, action: string) =>
    ipcRenderer.invoke('container-action', serverId, node, vmid, action),
  getContainerSnapshots: (serverId: string, node: string, vmid: number) =>
    ipcRenderer.invoke('get-container-snapshots', serverId, node, vmid),

  // Storage
  getStorage: (serverId: string, node: string) =>
    ipcRenderer.invoke('get-storage', serverId, node),
  getStorageContent: (serverId: string, node: string, storage: string) =>
    ipcRenderer.invoke('get-storage-content', serverId, node, storage),

  // Network
  getNetwork: (serverId: string, node: string) =>
    ipcRenderer.invoke('get-network', serverId, node),

  // Tasks
  getTasks: (serverId: string, node: string) =>
    ipcRenderer.invoke('get-tasks', serverId, node),
  getTaskLog: (serverId: string, node: string, upid: string) =>
    ipcRenderer.invoke('get-task-log', serverId, node, upid),
  getTaskStatus: (serverId: string, node: string, upid: string) =>
    ipcRenderer.invoke('get-task-status', serverId, node, upid),

  // Backups
  getBackups: (serverId: string, node: string, storage: string) =>
    ipcRenderer.invoke('get-backups', serverId, node, storage),
  createBackup: (serverId: string, node: string, params: unknown) =>
    ipcRenderer.invoke('create-backup', serverId, node, params),
  restoreBackup: (serverId: string, node: string, params: unknown) =>
    ipcRenderer.invoke('restore-backup', serverId, node, params),
  deleteBackup: (serverId: string, node: string, storage: string, volid: string) =>
    ipcRenderer.invoke('delete-backup', serverId, node, storage, volid),

  // Logs
  getLogs: (serverId: string, node: string) =>
    ipcRenderer.invoke('get-logs', serverId, node),
}

contextBridge.exposeInMainWorld('proxmox', proxmoxAPI)
contextBridge.exposeInMainWorld('platform', process.platform)
