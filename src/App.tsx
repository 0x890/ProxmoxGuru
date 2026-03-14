import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useServerStore } from '@/store/serverStore'
import { useUIStore } from '@/store/uiStore'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5_000,
      gcTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
})
import AppLayout from '@/components/layout/AppLayout'
import ConnectPage from '@/pages/ConnectPage'
import DashboardPage from '@/pages/DashboardPage'
import NodesPage from '@/pages/NodesPage'
import VMsPage from '@/pages/VMsPage'
import ContainersPage from '@/pages/ContainersPage'
import StoragePage from '@/pages/StoragePage'
import NetworkingPage from '@/pages/NetworkingPage'
import BackupsPage from '@/pages/BackupsPage'
import TasksPage from '@/pages/TasksPage'
import LogsPage from '@/pages/LogsPage'
import SettingsPage from '@/pages/SettingsPage'
import { ToastContainer } from '@/components/ui/Toast'
import CommandPalette from '@/components/layout/CommandPalette'

function AppRoutes() {
  const activeServerId = useServerStore((s) => s.activeServerId)
  const toggleCommandPalette = useUIStore((s) => s.toggleCommandPalette)
  const navigate = useNavigate()

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const mod = e.metaKey || e.ctrlKey

      if (mod && e.key === 'k') {
        e.preventDefault()
        toggleCommandPalette()
        return
      }

      if (mod && !e.shiftKey) {
        const navMap: Record<string, string> = {
          '1': '/',
          '2': '/nodes',
          '3': '/vms',
          '4': '/containers',
          '5': '/storage',
          '6': '/networking',
          '7': '/backups',
          '8': '/tasks',
          '9': '/logs',
        }
        if (navMap[e.key]) {
          e.preventDefault()
          navigate(navMap[e.key])
        }
      }

      if (e.key === 'Escape') {
        useUIStore.getState().closeCommandPalette()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [toggleCommandPalette, navigate])

  if (!activeServerId) {
    return (
      <AnimatePresence mode="wait">
        <Routes>
          <Route path="/connect" element={<ConnectPage />} />
          <Route path="*" element={<Navigate to="/connect" replace />} />
        </Routes>
      </AnimatePresence>
    )
  }

  return (
    <AppLayout>
      <AnimatePresence mode="wait">
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/nodes" element={<NodesPage />} />
          <Route path="/vms" element={<VMsPage />} />
          <Route path="/containers" element={<ContainersPage />} />
          <Route path="/storage" element={<StoragePage />} />
          <Route path="/networking" element={<NetworkingPage />} />
          <Route path="/backups" element={<BackupsPage />} />
          <Route path="/tasks" element={<TasksPage />} />
          <Route path="/logs" element={<LogsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/connect" element={<Navigate to="/" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AnimatePresence>
      <CommandPalette />
    </AppLayout>
  )
}

function AppInitializer({ children }: { children: React.ReactNode }) {
  const loadServers = useServerStore((s) => s.loadServers)

  useEffect(() => {
    loadServers()
  }, [loadServers])

  return <>{children}</>
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppInitializer>
          <AppRoutes />
          <ToastContainer />
        </AppInitializer>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
