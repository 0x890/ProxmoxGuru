import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Server, ServerConfig, ConnectionStatus } from '@/types/proxmox'

interface ServerStore {
  servers: Server[]
  activeServerId: string | null
  connectionStatus: ConnectionStatus
  connectionError: string | null

  // Actions
  setServers: (servers: Server[]) => void
  addServer: (server: Server) => void
  removeServer: (serverId: string) => void
  updateServer: (serverId: string, updates: Partial<Server>) => void
  setActiveServer: (serverId: string | null) => void
  setConnectionStatus: (status: ConnectionStatus) => void
  setConnectionError: (error: string | null) => void
  getActiveServer: () => Server | null

  // Async actions
  loadServers: () => Promise<void>
  connectToServer: (serverId: string) => Promise<void>
  disconnectFromServer: (serverId: string) => Promise<void>
  saveServer: (config: ServerConfig) => Promise<Server>
  deleteServer: (serverId: string) => Promise<void>
}

export const useServerStore = create<ServerStore>()(
  persist(
    (set, get) => ({
      servers: [],
      activeServerId: null,
      connectionStatus: 'disconnected',
      connectionError: null,

      setServers: (servers) => set({ servers }),
      addServer: (server) =>
        set((state) => ({
          servers: [...state.servers.filter((s) => s.id !== server.id), server],
        })),
      removeServer: (serverId) =>
        set((state) => ({
          servers: state.servers.filter((s) => s.id !== serverId),
          activeServerId: state.activeServerId === serverId ? null : state.activeServerId,
        })),
      updateServer: (serverId, updates) =>
        set((state) => ({
          servers: state.servers.map((s) => (s.id === serverId ? { ...s, ...updates } : s)),
        })),
      setActiveServer: (serverId) => set({ activeServerId: serverId }),
      setConnectionStatus: (status) => set({ connectionStatus: status }),
      setConnectionError: (error) => set({ connectionError: error }),
      getActiveServer: () => {
        const state = get()
        return state.servers.find((s) => s.id === state.activeServerId) ?? null
      },

      loadServers: async () => {
        if (!window.proxmox) return
        try {
          const rawServers = await window.proxmox.getServers()
          const servers: Server[] = rawServers.map((s) => ({
            ...s,
            connected: s.connected ?? false,
          }))
          set({ servers })
        } catch (err) {
          console.error('Failed to load servers:', err)
        }
      },

      connectToServer: async (serverId) => {
        if (!window.proxmox) return
        set({ connectionStatus: 'connecting', connectionError: null })
        try {
          const result = await window.proxmox.connectServer(serverId)
          if (result.success) {
            set({ connectionStatus: 'connected', activeServerId: serverId, connectionError: null })
            get().updateServer(serverId, { connected: true })
          } else {
            set({ connectionStatus: 'error', connectionError: 'Connection failed' })
          }
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Unknown error'
          set({ connectionStatus: 'error', connectionError: message })
          get().updateServer(serverId, { connected: false })
        }
      },

      disconnectFromServer: async (serverId) => {
        if (!window.proxmox) return
        try {
          await window.proxmox.disconnectServer(serverId)
          get().updateServer(serverId, { connected: false })
          const state = get()
          if (state.activeServerId === serverId) {
            set({ activeServerId: null, connectionStatus: 'disconnected' })
          }
        } catch (err) {
          console.error('Failed to disconnect:', err)
        }
      },

      saveServer: async (config) => {
        if (!window.proxmox) throw new Error('Proxmox API not available')
        await window.proxmox.addServer(config)
        const server: Server = { ...config, connected: false }
        get().addServer(server)
        return server
      },

      deleteServer: async (serverId) => {
        if (!window.proxmox) throw new Error('Proxmox API not available')
        await window.proxmox.removeServer(serverId)
        get().removeServer(serverId)
      },
    }),
    {
      name: 'proxmox-server-store',
      partialize: (state) => ({
        servers: state.servers.map((s) => ({
          ...s,
          tokenSecret: undefined,
          password: undefined,
          connected: false,
        })),
        activeServerId: state.activeServerId,
      }),
    }
  )
)
