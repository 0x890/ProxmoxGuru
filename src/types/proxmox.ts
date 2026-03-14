// ─── Server & Authentication ──────────────────────────────────────────────────

export interface ServerConfig {
  id: string
  name: string
  host: string
  port: number
  authType: 'token' | 'password'
  tokenId?: string
  tokenSecret?: string
  username?: string
  password?: string
  realm?: string
  verifySsl: boolean
}

export interface Server extends ServerConfig {
  connected: boolean
  version?: string
  lastConnected?: string
}

export interface Credentials {
  username: string
  password: string
  realm: string
}

// ─── Cluster ─────────────────────────────────────────────────────────────────

export interface ClusterStatus {
  id: string
  name: string
  nodes: number
  quorate: number
  version: number
  type: 'cluster' | 'node'
}

export interface ClusterResource {
  id: string
  type: 'node' | 'vm' | 'lxc' | 'storage' | 'pool'
  node?: string
  name?: string
  status?: string
  vmid?: number
  maxcpu?: number
  cpu?: number
  maxmem?: number
  mem?: number
  maxdisk?: number
  disk?: number
  uptime?: number
  pool?: string
  storage?: string
  content?: string
}

// ─── Nodes ───────────────────────────────────────────────────────────────────

export interface Node {
  node: string
  status: 'online' | 'offline' | 'unknown'
  cpu: number
  maxcpu: number
  mem: number
  maxmem: number
  disk: number
  maxdisk: number
  uptime: number
  level: string
  id: string
  type: string
}

export interface NodeStatus {
  node: string
  status: string
  pveversion: string
  uptime: number
  cpu: number
  cpuinfo: {
    cores: number
    sockets: number
    mhz: string
    model: string
    cpus: number
    flags: string
    hvm: string
    user_hz: number
  }
  memory: {
    used: number
    free: number
    total: number
  }
  rootfs: {
    used: number
    free: number
    total: number
    avail: number
  }
  swap: {
    used: number
    free: number
    total: number
  }
  loadavg: string[]
  kversion: string
  ksm: {
    shared: number
  }
  wait: number
  idle: number
}

export interface NodeRrdData {
  time: number
  cpu: number
  iowait?: number
  memused?: number
  memtotal?: number
  netin?: number
  netout?: number
  maxcpu?: number
  maxmem?: number
}

// ─── VMs ─────────────────────────────────────────────────────────────────────

export interface VM {
  vmid: number
  name: string
  status: 'running' | 'stopped' | 'paused' | 'suspended'
  node: string
  cpu: number
  maxcpu: number
  mem: number
  maxmem: number
  disk: number
  maxdisk: number
  uptime: number
  pid?: number
  qmpstatus?: string
  template?: number
  diskread?: number
  diskwrite?: number
  netin?: number
  netout?: number
  tags?: string
  lock?: string
}

export interface VMConfig {
  vmid: number
  name?: string
  description?: string
  cores: number
  sockets: number
  memory: number
  balloon?: number
  cpu: string
  bios?: string
  boot?: string
  bootdisk?: string
  ostype?: string
  ide0?: string
  ide2?: string
  scsi0?: string
  net0?: string
  net1?: string
  vga?: string
  agent?: string
  onboot?: number
  protection?: number
  scsihw?: string
  numa?: number
  hotplug?: string
  tags?: string
  [key: string]: unknown
}

export interface VMStatus {
  vmid: number
  status: 'running' | 'stopped' | 'paused' | 'suspended'
  name: string
  cpu: number
  cpus: number
  mem: number
  maxmem: number
  disk: number
  maxdisk: number
  uptime: number
  pid?: number
  ha?: {
    managed: number
    state?: string
    group?: string
  }
  lock?: string
  qmpstatus?: string
  diskread?: number
  diskwrite?: number
  netin?: number
  netout?: number
  balloon?: number
  ballooninfo?: {
    actual: number
    free_mem: number
    mem_swapped_in: number
    mem_swapped_out: number
    minor_page_faults: number
    major_page_faults: number
    last_update: number
    max_mem: number
    total_mem: number
  }
}

export interface VMSnapshot {
  name: string
  snaptime?: number
  description?: string
  vmstate?: boolean
  parent?: string
  running?: boolean
}

// ─── Containers ──────────────────────────────────────────────────────────────

export interface Container {
  vmid: number
  name: string
  status: 'running' | 'stopped' | 'paused'
  node: string
  cpu: number
  maxcpu: number
  mem: number
  maxmem: number
  disk: number
  maxdisk: number
  uptime: number
  tags?: string
  type: 'lxc'
  netin?: number
  netout?: number
  diskread?: number
  diskwrite?: number
}

export interface ContainerConfig {
  vmid: number
  hostname?: string
  description?: string
  ostype?: string
  arch?: string
  cores?: number
  memory?: number
  swap?: number
  rootfs?: string
  net0?: string
  net1?: string
  onboot?: number
  protection?: number
  unprivileged?: number
  tags?: string
  [key: string]: unknown
}

export interface ContainerStatus {
  vmid: number
  status: 'running' | 'stopped' | 'paused'
  name: string
  cpu: number
  cpus: number
  mem: number
  maxmem: number
  disk: number
  maxdisk: number
  uptime: number
  diskread?: number
  diskwrite?: number
  netin?: number
  netout?: number
  swap?: number
  maxswap?: number
}

// ─── Storage ─────────────────────────────────────────────────────────────────

export interface Storage {
  storage: string
  type: 'dir' | 'lvm' | 'lvmthin' | 'zfspool' | 'nfs' | 'cifs' | 'glusterfs' | 'cephfs' | 'rbd' | 'btrfs'
  status: 'available' | 'degraded' | 'unknown' | string
  content: string
  shared: number
  used: number
  total: number
  avail: number
  used_fraction: number
  active: number
  enabled: number
}

export interface StorageContent {
  volid: string
  format: string
  size: number
  content: string
  vmid?: number
  ctime?: number
  notes?: string
  protected?: boolean
  verification?: {
    state: string
    upid: string
  }
}

// ─── Network ─────────────────────────────────────────────────────────────────

export interface NetworkInterface {
  iface: string
  type: 'eth' | 'bridge' | 'bond' | 'vlan' | 'alias' | 'OVSBridge' | 'OVSBond' | 'OVSIntPort' | 'OVSPort'
  active: number
  autostart: number
  exists?: number
  address?: string
  netmask?: string
  gateway?: string
  address6?: string
  netmask6?: string
  gateway6?: string
  bridge_ports?: string
  bridge_stp?: string
  bridge_fd?: string
  bond_mode?: string
  bond_miimon?: string
  slaves?: string
  vlan_id?: string
  vlan_raw_device?: string
  comments?: string
  method?: string
  method6?: string
}

// ─── Tasks ───────────────────────────────────────────────────────────────────

export interface Task {
  upid: string
  node: string
  pid: number
  pstart: number
  starttime: number
  type: string
  id: string
  user: string
  status?: string
  endtime?: number
  exitstatus?: string
}

export interface TaskLog {
  n: number
  t: string
}

export interface TaskStatus {
  node: string
  pid: number
  pstart: number
  starttime: number
  type: string
  id: string
  user: string
  status: 'running' | 'stopped'
  exitstatus?: string
  upid: string
}

// ─── Logs ────────────────────────────────────────────────────────────────────

export interface SyslogEntry {
  n: number
  t: string
  pid?: number
  uid?: string
  tag?: string
  msg?: string
}

export interface Log {
  time: number
  level: 'info' | 'warning' | 'error' | 'debug'
  message: string
  node?: string
  source?: string
}

// ─── Backups ─────────────────────────────────────────────────────────────────

export interface Backup {
  volid: string
  vmid?: number
  format: string
  size: number
  ctime: number
  content: string
  notes?: string
  protected?: boolean
  subtype?: string
}

export interface BackupJob {
  id: string
  node?: string
  vmid?: string
  storage: string
  schedule?: string
  compress?: string
  mode?: string
  enabled?: boolean
  comment?: string
}

// ─── API Response ────────────────────────────────────────────────────────────

export interface APIResponse<T = unknown> {
  data: T
  errors?: Record<string, string>
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
}

// ─── App State ───────────────────────────────────────────────────────────────

export type ConnectionStatus = 'connected' | 'disconnected' | 'connecting' | 'error'

export interface Notification {
  id: string
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  message: string
  timestamp: Date
  read: boolean
}

export interface CommandPaletteItem {
  id: string
  label: string
  description?: string
  icon?: string
  category: string
  action: () => void
  keywords?: string[]
}
