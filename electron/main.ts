import { app, BrowserWindow, ipcMain, shell, safeStorage } from 'electron'
import path from 'path'
import axios, { AxiosInstance } from 'axios'
import https from 'https'
import Store from 'electron-store'

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged

// Encrypt/decrypt secrets using the OS keychain (Keychain on macOS,
// libsecret on Linux, DPAPI on Windows). No key is stored in source.
function encrypt(plaintext: string): string {
  if (!safeStorage.isEncryptionAvailable()) return plaintext
  return safeStorage.encryptString(plaintext).toString('base64')
}

function decrypt(ciphertext: string): string {
  if (!safeStorage.isEncryptionAvailable()) return ciphertext
  try {
    return safeStorage.decryptString(Buffer.from(ciphertext, 'base64'))
  } catch {
    return ciphertext // already plaintext (migration from old store)
  }
}

interface ServerConfig {
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

interface SessionData {
  ticket: string
  csrfToken: string
  username: string
}

const store = new Store<{
  servers: ServerConfig[]
}>({
  name: 'proxmoxguru-config',
  defaults: {
    servers: [],
  },
})

const sessions = new Map<string, SessionData>()
const axiosInstances = new Map<string, AxiosInstance>()

function createAxiosInstance(server: ServerConfig, session?: SessionData): AxiosInstance {
  const baseURL = `https://${server.host}:${server.port}/api2/json`
  const httpsAgent = new https.Agent({ rejectUnauthorized: server.verifySsl })

  const headers: Record<string, string> = {}

  if (server.authType === 'token' && server.tokenId && server.tokenSecret) {
    headers['Authorization'] = `PVEAPIToken=${server.tokenId}=${server.tokenSecret}`
  } else if (session) {
    headers['Cookie'] = `PVEAuthCookie=${session.ticket}`
    headers['CSRFPreventionToken'] = session.csrfToken
  }

  const instance = axios.create({
    baseURL,
    httpsAgent,
    headers,
    timeout: 15000,
  })

  // Proxmox API requires POST/PUT bodies as application/x-www-form-urlencoded.
  // Serialize any plain-object body automatically; leave FormData/URLSearchParams as-is.
  instance.interceptors.request.use((config) => {
    if (
      config.data &&
      typeof config.data === 'object' &&
      !(config.data instanceof URLSearchParams) &&
      !(config.data instanceof FormData)
    ) {
      const params = new URLSearchParams()
      for (const [k, v] of Object.entries(config.data as Record<string, unknown>)) {
        if (v !== undefined && v !== null) params.set(k, String(v))
      }
      config.data = params
      config.headers['Content-Type'] = 'application/x-www-form-urlencoded'
    }
    return config
  })

  return instance
}

function decryptServer(server: ServerConfig): ServerConfig {
  return {
    ...server,
    tokenSecret: server.tokenSecret ? decrypt(server.tokenSecret) : undefined,
    password: server.password ? decrypt(server.password) : undefined,
  }
}

async function getAxiosInstance(serverId: string): Promise<AxiosInstance> {
  if (axiosInstances.has(serverId)) {
    return axiosInstances.get(serverId)!
  }
  const servers = store.get('servers', [])
  const raw = servers.find((s: ServerConfig) => s.id === serverId)
  if (!raw) throw new Error('Server not found')
  const server = decryptServer(raw)
  const session = sessions.get(serverId)
  const instance = createAxiosInstance(server, session)
  axiosInstances.set(serverId, instance)
  return instance
}

let mainWindow: BrowserWindow | null = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    backgroundColor: '#0B0B0F',
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    trafficLightPosition: { x: 16, y: 16 },
    frame: process.platform !== 'darwin',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
    show: false,
    icon: path.join(__dirname, '../assets/icon.png'),
  })

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })
}

app.whenReady().then(() => {
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

// ─── Server Management ────────────────────────────────────────────────────────

ipcMain.handle('get-servers', async () => {
  const servers = store.get('servers', [])
  return servers.map((s: ServerConfig) => ({
    ...s,
    tokenSecret: s.tokenSecret ? '***' : undefined,
    password: s.password ? '***' : undefined,
    connected: sessions.has(s.id) || s.authType === 'token',
  }))
})

ipcMain.handle('add-server', async (_event, serverConfig: ServerConfig) => {
  const toStore: ServerConfig = {
    ...serverConfig,
    tokenSecret: serverConfig.tokenSecret ? encrypt(serverConfig.tokenSecret) : undefined,
    password: serverConfig.password ? encrypt(serverConfig.password) : undefined,
  }
  const servers = store.get('servers', [])
  const existing = servers.findIndex((s: ServerConfig) => s.id === toStore.id)
  if (existing >= 0) {
    servers[existing] = toStore
  } else {
    servers.push(toStore)
  }
  store.set('servers', servers)
  return { success: true, id: serverConfig.id }
})

ipcMain.handle('remove-server', async (_event, serverId: string) => {
  const servers = store.get('servers', [])
  const updated = servers.filter((s: ServerConfig) => s.id !== serverId)
  store.set('servers', updated)
  sessions.delete(serverId)
  axiosInstances.delete(serverId)
  return { success: true }
})

ipcMain.handle('connect-server', async (_event, serverId: string) => {
  const servers = store.get('servers', [])
  const raw = servers.find((s: ServerConfig) => s.id === serverId)
  if (!raw) throw new Error('Server not found')
  const server = decryptServer(raw)

  if (server.authType === 'token') {
    const instance = createAxiosInstance(server)
    axiosInstances.set(serverId, instance)
    const response = await instance.get('/version')
    return { success: true, version: response.data.data }
  }

  const httpsAgent = new https.Agent({ rejectUnauthorized: server.verifySsl })
  const loginBody = new URLSearchParams({
    username: `${server.username}@${server.realm || 'pam'}`,
    password: server.password ?? '',
  })
  const response = await axios.post(
    `https://${server.host}:${server.port}/api2/json/access/ticket`,
    loginBody,
    {
      httpsAgent,
      timeout: 15000,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    }
  )

  const { ticket, CSRFPreventionToken, username } = response.data.data
  const session: SessionData = { ticket, csrfToken: CSRFPreventionToken, username }
  sessions.set(serverId, session)

  const instance = createAxiosInstance(server, session)
  axiosInstances.set(serverId, instance)

  return { success: true, username }
})

ipcMain.handle('disconnect-server', async (_event, serverId: string) => {
  sessions.delete(serverId)
  axiosInstances.delete(serverId)
  return { success: true }
})

// ─── Cluster ──────────────────────────────────────────────────────────────────

ipcMain.handle('get-cluster-status', async (_event, serverId: string) => {
  const api = await getAxiosInstance(serverId)
  const response = await api.get('/cluster/status')
  return response.data.data
})

// ─── Nodes ────────────────────────────────────────────────────────────────────

ipcMain.handle('get-nodes', async (_event, serverId: string) => {
  const api = await getAxiosInstance(serverId)
  const response = await api.get('/nodes')
  return response.data.data
})

ipcMain.handle('get-node-status', async (_event, serverId: string, node: string) => {
  const api = await getAxiosInstance(serverId)
  const response = await api.get(`/nodes/${node}/status`)
  return response.data.data
})

ipcMain.handle('get-node-rrddata', async (_event, serverId: string, node: string, timeframe: string) => {
  const api = await getAxiosInstance(serverId)
  const response = await api.get(`/nodes/${node}/rrddata`, { params: { timeframe, cf: 'AVERAGE' } })
  return response.data.data
})

ipcMain.handle('node-action', async (_event, serverId: string, node: string, command: string) => {
  const api = await getAxiosInstance(serverId)
  const response = await api.post(`/nodes/${node}/status`, { command })
  return response.data.data
})

// ─── VMs ──────────────────────────────────────────────────────────────────────

ipcMain.handle('get-vms', async (_event, serverId: string, node: string) => {
  const api = await getAxiosInstance(serverId)
  const response = await api.get(`/nodes/${node}/qemu`)
  return response.data.data
})

ipcMain.handle('get-vm-status', async (_event, serverId: string, node: string, vmid: number) => {
  const api = await getAxiosInstance(serverId)
  const response = await api.get(`/nodes/${node}/qemu/${vmid}/status/current`)
  return response.data.data
})

ipcMain.handle('get-vm-config', async (_event, serverId: string, node: string, vmid: number) => {
  const api = await getAxiosInstance(serverId)
  const response = await api.get(`/nodes/${node}/qemu/${vmid}/config`)
  return response.data.data
})

ipcMain.handle('vm-action', async (_event, serverId: string, node: string, vmid: number, action: string) => {
  const api = await getAxiosInstance(serverId)
  let response
  if (action === 'start') {
    response = await api.post(`/nodes/${node}/qemu/${vmid}/status/start`)
  } else if (action === 'stop') {
    response = await api.post(`/nodes/${node}/qemu/${vmid}/status/stop`)
  } else if (action === 'shutdown') {
    response = await api.post(`/nodes/${node}/qemu/${vmid}/status/shutdown`)
  } else if (action === 'reset') {
    response = await api.post(`/nodes/${node}/qemu/${vmid}/status/reset`)
  } else if (action === 'suspend') {
    response = await api.post(`/nodes/${node}/qemu/${vmid}/status/suspend`)
  } else if (action === 'resume') {
    response = await api.post(`/nodes/${node}/qemu/${vmid}/status/resume`)
  } else {
    throw new Error(`Unknown action: ${action}`)
  }
  return response.data.data
})

ipcMain.handle('get-vm-snapshots', async (_event, serverId: string, node: string, vmid: number) => {
  const api = await getAxiosInstance(serverId)
  const response = await api.get(`/nodes/${node}/qemu/${vmid}/snapshot`)
  return response.data.data
})

ipcMain.handle('create-vm-snapshot', async (_event, serverId: string, node: string, vmid: number, params: { snapname: string; description?: string; vmstate?: boolean }) => {
  const api = await getAxiosInstance(serverId)
  const response = await api.post(`/nodes/${node}/qemu/${vmid}/snapshot`, params)
  return response.data.data
})

ipcMain.handle('delete-vm-snapshot', async (_event, serverId: string, node: string, vmid: number, snapname: string) => {
  const api = await getAxiosInstance(serverId)
  const response = await api.delete(`/nodes/${node}/qemu/${vmid}/snapshot/${snapname}`)
  return response.data.data
})

ipcMain.handle('get-vm-rrddata', async (_event, serverId: string, node: string, vmid: number, timeframe: string) => {
  const api = await getAxiosInstance(serverId)
  const response = await api.get(`/nodes/${node}/qemu/${vmid}/rrddata`, { params: { timeframe, cf: 'AVERAGE' } })
  return response.data.data
})

// ─── Containers ───────────────────────────────────────────────────────────────

ipcMain.handle('get-containers', async (_event, serverId: string, node: string) => {
  const api = await getAxiosInstance(serverId)
  const response = await api.get(`/nodes/${node}/lxc`)
  return response.data.data
})

ipcMain.handle('get-container-status', async (_event, serverId: string, node: string, vmid: number) => {
  const api = await getAxiosInstance(serverId)
  const response = await api.get(`/nodes/${node}/lxc/${vmid}/status/current`)
  return response.data.data
})

ipcMain.handle('get-container-config', async (_event, serverId: string, node: string, vmid: number) => {
  const api = await getAxiosInstance(serverId)
  const response = await api.get(`/nodes/${node}/lxc/${vmid}/config`)
  return response.data.data
})

ipcMain.handle('container-action', async (_event, serverId: string, node: string, vmid: number, action: string) => {
  const api = await getAxiosInstance(serverId)
  let response
  if (action === 'start') {
    response = await api.post(`/nodes/${node}/lxc/${vmid}/status/start`)
  } else if (action === 'stop') {
    response = await api.post(`/nodes/${node}/lxc/${vmid}/status/stop`)
  } else if (action === 'shutdown') {
    response = await api.post(`/nodes/${node}/lxc/${vmid}/status/shutdown`)
  } else if (action === 'restart') {
    response = await api.post(`/nodes/${node}/lxc/${vmid}/status/restart`)
  } else if (action === 'suspend') {
    response = await api.post(`/nodes/${node}/lxc/${vmid}/status/suspend`)
  } else if (action === 'resume') {
    response = await api.post(`/nodes/${node}/lxc/${vmid}/status/resume`)
  } else {
    throw new Error(`Unknown action: ${action}`)
  }
  return response.data.data
})

ipcMain.handle('get-container-snapshots', async (_event, serverId: string, node: string, vmid: number) => {
  const api = await getAxiosInstance(serverId)
  const response = await api.get(`/nodes/${node}/lxc/${vmid}/snapshot`)
  return response.data.data
})

// ─── Storage ──────────────────────────────────────────────────────────────────

ipcMain.handle('get-storage', async (_event, serverId: string, node: string) => {
  const api = await getAxiosInstance(serverId)
  const response = await api.get(`/nodes/${node}/storage`)
  return response.data.data
})

ipcMain.handle('get-storage-content', async (_event, serverId: string, node: string, storage: string) => {
  const api = await getAxiosInstance(serverId)
  const response = await api.get(`/nodes/${node}/storage/${storage}/content`)
  return response.data.data
})

// ─── Network ──────────────────────────────────────────────────────────────────

ipcMain.handle('get-network', async (_event, serverId: string, node: string) => {
  const api = await getAxiosInstance(serverId)
  const response = await api.get(`/nodes/${node}/network`)
  return response.data.data
})

// ─── Tasks ────────────────────────────────────────────────────────────────────

ipcMain.handle('get-tasks', async (_event, serverId: string, node: string) => {
  const api = await getAxiosInstance(serverId)
  const response = await api.get(`/nodes/${node}/tasks`)
  return response.data.data
})

ipcMain.handle('get-task-log', async (_event, serverId: string, node: string, upid: string) => {
  const api = await getAxiosInstance(serverId)
  const encodedUpid = encodeURIComponent(upid)
  const response = await api.get(`/nodes/${node}/tasks/${encodedUpid}/log`)
  return response.data.data
})

ipcMain.handle('get-task-status', async (_event, serverId: string, node: string, upid: string) => {
  const api = await getAxiosInstance(serverId)
  const encodedUpid = encodeURIComponent(upid)
  const response = await api.get(`/nodes/${node}/tasks/${encodedUpid}/status`)
  return response.data.data
})

// ─── Backups ──────────────────────────────────────────────────────────────────

ipcMain.handle('get-backups', async (_event, serverId: string, node: string, storage: string) => {
  const api = await getAxiosInstance(serverId)
  const response = await api.get(`/nodes/${node}/storage/${storage}/content`, {
    params: { content: 'backup' },
  })
  return response.data.data
})

ipcMain.handle('create-backup', async (_event, serverId: string, node: string, params: Record<string, unknown>) => {
  const api = await getAxiosInstance(serverId)
  const response = await api.post(`/nodes/${node}/vzdump`, params)
  return response.data.data
})

ipcMain.handle('restore-backup', async (_event, serverId: string, node: string, params: Record<string, unknown>) => {
  const api = await getAxiosInstance(serverId)
  const response = await api.post(`/nodes/${node}/qemu`, params)
  return response.data.data
})

ipcMain.handle('delete-backup', async (_event, serverId: string, node: string, storage: string, volid: string) => {
  const api = await getAxiosInstance(serverId)
  const response = await api.delete(`/nodes/${node}/storage/${storage}/content/${encodeURIComponent(volid)}`)
  return response.data.data
})

// ─── Logs ─────────────────────────────────────────────────────────────────────

ipcMain.handle('get-logs', async (_event, serverId: string, node: string) => {
  const api = await getAxiosInstance(serverId)
  const response = await api.get(`/nodes/${node}/syslog`, { params: { limit: 500 } })
  return response.data.data
})

// ─── Cluster Resources ────────────────────────────────────────────────────────

ipcMain.handle('get-cluster-resources', async (_event, serverId: string) => {
  const api = await getAxiosInstance(serverId)
  const response = await api.get('/cluster/resources')
  return response.data.data
})

ipcMain.handle('get-version', async (_event, serverId: string) => {
  const api = await getAxiosInstance(serverId)
  const response = await api.get('/version')
  return response.data.data
})
