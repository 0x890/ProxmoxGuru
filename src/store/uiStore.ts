import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Notification } from '@/types/proxmox'

interface UIStore {
  // Sidebar
  sidebarCollapsed: boolean
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void

  // Command Palette
  commandPaletteOpen: boolean
  openCommandPalette: () => void
  closeCommandPalette: () => void
  toggleCommandPalette: () => void

  // Selected node
  selectedNode: string | null
  setSelectedNode: (node: string | null) => void

  // Active page
  activePage: string
  setActivePage: (page: string) => void

  // Notifications
  notifications: Notification[]
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void
  markNotificationRead: (id: string) => void
  markAllNotificationsRead: () => void
  clearNotifications: () => void
  unreadCount: () => number

  // Polling intervals (ms)
  pollingInterval: number
  setPollingInterval: (interval: number) => void

  // Theme
  accentColor: 'blue' | 'purple' | 'green'
  setAccentColor: (color: 'blue' | 'purple' | 'green') => void

  // Detail panels
  selectedVMId: number | null
  setSelectedVMId: (id: number | null) => void
  selectedContainerId: number | null
  setSelectedContainerId: (id: number | null) => void
  selectedTaskUpid: string | null
  setSelectedTaskUpid: (upid: string | null) => void

  // Toast
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
}

export interface Toast {
  id: string
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  message?: string
  duration?: number
}

export const useUIStore = create<UIStore>()(
  persist(
    (set, get) => ({
      // Sidebar
      sidebarCollapsed: false,
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),

      // Command Palette
      commandPaletteOpen: false,
      openCommandPalette: () => set({ commandPaletteOpen: true }),
      closeCommandPalette: () => set({ commandPaletteOpen: false }),
      toggleCommandPalette: () => set((s) => ({ commandPaletteOpen: !s.commandPaletteOpen })),

      // Selected node
      selectedNode: null,
      setSelectedNode: (node) => set({ selectedNode: node }),

      // Active page
      activePage: 'dashboard',
      setActivePage: (page) => set({ activePage: page }),

      // Notifications
      notifications: [],
      addNotification: (notification) => {
        const newNotification: Notification = {
          ...notification,
          id: `notif-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          timestamp: new Date(),
          read: false,
        }
        set((s) => ({
          notifications: [newNotification, ...s.notifications].slice(0, 50),
        }))
      },
      markNotificationRead: (id) =>
        set((s) => ({
          notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
        })),
      markAllNotificationsRead: () =>
        set((s) => ({
          notifications: s.notifications.map((n) => ({ ...n, read: true })),
        })),
      clearNotifications: () => set({ notifications: [] }),
      unreadCount: () => get().notifications.filter((n) => !n.read).length,

      // Polling
      pollingInterval: 5000,
      setPollingInterval: (interval) => set({ pollingInterval: interval }),

      // Theme
      accentColor: 'blue',
      setAccentColor: (color) => set({ accentColor: color }),

      // Detail panels
      selectedVMId: null,
      setSelectedVMId: (id) => set({ selectedVMId: id }),
      selectedContainerId: null,
      setSelectedContainerId: (id) => set({ selectedContainerId: id }),
      selectedTaskUpid: null,
      setSelectedTaskUpid: (upid) => set({ selectedTaskUpid: upid }),

      // Toasts
      toasts: [],
      addToast: (toast) => {
        const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`
        set((s) => ({ toasts: [...s.toasts, { ...toast, id }] }))
        const duration = toast.duration ?? 4000
        if (duration > 0) {
          setTimeout(() => {
            get().removeToast(id)
          }, duration)
        }
      },
      removeToast: (id) =>
        set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
    }),
    {
      name: 'proxmox-ui-store',
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        pollingInterval: state.pollingInterval,
        accentColor: state.accentColor,
        selectedNode: state.selectedNode,
      }),
    }
  )
)
