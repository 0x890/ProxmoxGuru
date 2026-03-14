import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Settings,
  Server,
  Plus,
  Trash2,
  Wifi,
  WifiOff,
  Eye,
  EyeOff,
  RefreshCw,
  Info,
  Zap,
  Palette,
  Clock,
  Shield,
  Key,
} from 'lucide-react'
import { useServerStore } from '@/store/serverStore'
import { useUIStore } from '@/store/uiStore'
import { Button } from '@/components/ui/Button'
import { ConfirmModal, Modal } from '@/components/ui/Modal'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { useToast } from '@/components/ui/Toast'
import { generateId, cn } from '@/lib/utils'
import type { ServerConfig } from '@/types/proxmox'

type AuthType = 'token' | 'password'

interface ServerFormState {
  name: string
  host: string
  port: string
  authType: AuthType
  tokenId: string
  tokenSecret: string
  username: string
  password: string
  realm: string
  verifySsl: boolean
}

const defaultForm: ServerFormState = {
  name: '',
  host: '',
  port: '8006',
  authType: 'password',
  tokenId: '',
  tokenSecret: '',
  username: 'root',
  password: '',
  realm: 'pam',
  verifySsl: false,
}

function ServerForm({ onSave, onCancel }: { onSave: (config: ServerConfig) => void; onCancel: () => void }) {
  const [form, setForm] = useState<ServerFormState>(defaultForm)
  const [showSecret, setShowSecret] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  function setField<K extends keyof ServerFormState>(key: K, val: ServerFormState[K]) {
    setForm((f) => ({ ...f, [key]: val }))
  }

  function handleSubmit() {
    const config: ServerConfig = {
      id: generateId(),
      name: form.name,
      host: form.host,
      port: parseInt(form.port, 10) || 8006,
      authType: form.authType,
      tokenId: form.authType === 'token' ? form.tokenId : undefined,
      tokenSecret: form.authType === 'token' ? form.tokenSecret : undefined,
      username: form.authType === 'password' ? form.username : undefined,
      password: form.authType === 'password' ? form.password : undefined,
      realm: form.authType === 'password' ? form.realm : undefined,
      verifySsl: form.verifySsl,
    }
    onSave(config)
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1.5">Display Name</label>
          <input className="input" value={form.name} onChange={(e) => setField('name', e.target.value)} placeholder="My Proxmox" />
        </div>
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1.5">Port</label>
          <input className="input" value={form.port} onChange={(e) => setField('port', e.target.value)} placeholder="8006" />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-text-secondary mb-1.5">Host / IP Address</label>
        <input className="input" value={form.host} onChange={(e) => setField('host', e.target.value)} placeholder="192.168.1.100" />
      </div>

      <div>
        <label className="block text-xs font-medium text-text-secondary mb-2">Authentication</label>
        <div className="flex gap-1 p-1 rounded-lg bg-surface-secondary border border-border">
          {(['password', 'token'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setField('authType', t)}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-all',
                form.authType === t ? 'bg-primary text-white' : 'text-text-secondary hover:text-text-primary'
              )}
            >
              {t === 'password' ? <Shield size={12} /> : <Key size={12} />}
              {t === 'password' ? 'Password' : 'API Token'}
            </button>
          ))}
        </div>
      </div>

      {form.authType === 'password' && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">Username</label>
              <input className="input" value={form.username} onChange={(e) => setField('username', e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">Realm</label>
              <input className="input" value={form.realm} onChange={(e) => setField('realm', e.target.value)} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                className="input pr-10"
                value={form.password}
                onChange={(e) => setField('password', e.target.value)}
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary">
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>
        </div>
      )}

      {form.authType === 'token' && (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">Token ID</label>
            <input className="input" value={form.tokenId} onChange={(e) => setField('tokenId', e.target.value)} placeholder="root@pam!mytoken" />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">Token Secret</label>
            <div className="relative">
              <input
                type={showSecret ? 'text' : 'password'}
                className="input pr-10 font-mono"
                value={form.tokenSecret}
                onChange={(e) => setField('tokenSecret', e.target.value)}
              />
              <button type="button" onClick={() => setShowSecret(!showSecret)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary">
                {showSecret ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>
        </div>
      )}

      <label className="flex items-center gap-2.5 cursor-pointer">
        <div
          onClick={() => setField('verifySsl', !form.verifySsl)}
          className={cn('w-9 h-5 rounded-full transition-colors relative', form.verifySsl ? 'bg-primary' : 'bg-surface-tertiary border border-border')}
        >
          <div className={cn('absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform shadow-sm', form.verifySsl ? 'translate-x-4' : 'translate-x-0.5')} />
        </div>
        <span className="text-xs text-text-secondary">Verify SSL certificate</span>
      </label>

      <div className="flex gap-2 pt-1">
        <Button variant="ghost" size="md" className="flex-1" onClick={onCancel}>Cancel</Button>
        <Button variant="primary" size="md" className="flex-1" onClick={handleSubmit} disabled={!form.name || !form.host}>
          Save Server
        </Button>
      </div>
    </div>
  )
}

const POLLING_OPTIONS = [
  { value: 2000, label: '2s (aggressive)' },
  { value: 5000, label: '5s (default)' },
  { value: 10000, label: '10s (balanced)' },
  { value: 30000, label: '30s (minimal)' },
]

export default function SettingsPage() {
  const servers = useServerStore((s) => s.servers)
  const activeServerId = useServerStore((s) => s.activeServerId)
  const connectToServer = useServerStore((s) => s.connectToServer)
  const disconnectFromServer = useServerStore((s) => s.disconnectFromServer)
  const saveServer = useServerStore((s) => s.saveServer)
  const deleteServer = useServerStore((s) => s.deleteServer)

  const pollingInterval = useUIStore((s) => s.pollingInterval)
  const setPollingInterval = useUIStore((s) => s.setPollingInterval)
  const accentColor = useUIStore((s) => s.accentColor)
  const setAccentColor = useUIStore((s) => s.setAccentColor)

  const toast = useToast()
  const [showAddServer, setShowAddServer] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [connecting, setConnecting] = useState<string | null>(null)

  async function handleSaveServer(config: ServerConfig) {
    try {
      await saveServer(config)
      toast.success('Server saved', config.name)
      setShowAddServer(false)
    } catch (err) {
      toast.error('Failed to save server', err instanceof Error ? err.message : 'Unknown error')
    }
  }

  async function handleConnect(serverId: string) {
    setConnecting(serverId)
    try {
      await connectToServer(serverId)
      toast.success('Connected')
    } catch (err) {
      toast.error('Connection failed', err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setConnecting(null)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    await deleteServer(deleteTarget)
    toast.success('Server removed')
    setDeleteTarget(null)
  }

  const sections = [
    { id: 'servers', label: 'Servers', icon: Server },
    { id: 'polling', label: 'Polling', icon: RefreshCw },
    { id: 'theme', label: 'Appearance', icon: Palette },
    { id: 'about', label: 'About', icon: Info },
  ]

  const [activeSection, setActiveSection] = useState('servers')

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <div className="w-48 border-r border-border p-4 shrink-0">
        <h2 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-3">Settings</h2>
        <nav className="space-y-0.5">
          {sections.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveSection(id)}
              className={cn(
                'nav-item w-full',
                activeSection === id && 'active'
              )}
            >
              <Icon size={15} />
              <span>{label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <motion.div
          key={activeSection}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2 }}
        >
          {activeSection === 'servers' && (
            <div className="max-w-2xl">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-lg font-bold text-text-primary">Server Connections</h2>
                  <p className="text-sm text-text-secondary mt-0.5">Manage your Proxmox VE servers</p>
                </div>
                <Button variant="primary" size="sm" icon={<Plus size={14} />} onClick={() => setShowAddServer(true)}>
                  Add Server
                </Button>
              </div>

              <div className="space-y-3">
                {servers.map((server) => (
                  <div key={server.id} className="card p-4 flex items-center gap-3">
                    <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', activeServerId === server.id ? 'bg-primary/10' : 'bg-surface-tertiary')}>
                      <Server size={17} className={activeServerId === server.id ? 'text-primary' : 'text-text-tertiary'} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-text-primary">{server.name}</p>
                        {activeServerId === server.id && <StatusBadge status="online" size="xs" />}
                      </div>
                      <p className="text-xs text-text-tertiary">{server.host}:{server.port} · {server.authType === 'token' ? 'API Token' : 'Password auth'}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {activeServerId === server.id ? (
                        <Button
                          variant="secondary"
                          size="sm"
                          icon={<WifiOff size={13} />}
                          onClick={() => disconnectFromServer(server.id)}
                        >
                          Disconnect
                        </Button>
                      ) : (
                        <Button
                          variant="primary"
                          size="sm"
                          icon={<Wifi size={13} />}
                          loading={connecting === server.id}
                          onClick={() => handleConnect(server.id)}
                        >
                          Connect
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={<Trash2 size={13} />}
                        className="text-danger"
                        onClick={() => setDeleteTarget(server.id)}
                      />
                    </div>
                  </div>
                ))}

                {servers.length === 0 && (
                  <div className="flex flex-col items-center py-12 text-text-tertiary border border-dashed border-border rounded-xl">
                    <Server size={32} className="mb-2 opacity-30" />
                    <p className="text-sm">No servers configured</p>
                    <Button variant="primary" size="sm" className="mt-3" icon={<Plus size={14} />} onClick={() => setShowAddServer(true)}>
                      Add Server
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeSection === 'polling' && (
            <div className="max-w-md">
              <h2 className="text-lg font-bold text-text-primary mb-1">Polling Interval</h2>
              <p className="text-sm text-text-secondary mb-5">How often to refresh data from the Proxmox API</p>

              <div className="space-y-2">
                {POLLING_OPTIONS.map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => setPollingInterval(value)}
                    className={cn(
                      'w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all text-left',
                      pollingInterval === value
                        ? 'border-primary/50 bg-primary/10 text-primary'
                        : 'border-border bg-surface hover:border-border-bright text-text-secondary'
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <Clock size={15} />
                      <span className="text-sm font-medium">{label}</span>
                    </div>
                    {pollingInterval === value && (
                      <div className="w-2 h-2 rounded-full bg-primary" />
                    )}
                  </button>
                ))}
              </div>

              <p className="text-xs text-text-tertiary mt-4">
                Lower intervals provide more real-time data but increase API load on the Proxmox server.
              </p>
            </div>
          )}

          {activeSection === 'theme' && (
            <div className="max-w-md">
              <h2 className="text-lg font-bold text-text-primary mb-1">Appearance</h2>
              <p className="text-sm text-text-secondary mb-5">Customize the look and feel</p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-3">Accent Color</label>
                  <div className="flex gap-3">
                    {([
                      { id: 'blue', label: 'Blue', color: '#4DA3FF' },
                      { id: 'purple', label: 'Purple', color: '#7B61FF' },
                      { id: 'green', label: 'Green', color: '#22C55E' },
                    ] as const).map(({ id, label, color }) => (
                      <button
                        key={id}
                        onClick={() => setAccentColor(id)}
                        className={cn(
                          'flex flex-col items-center gap-2 p-3 rounded-xl border transition-all',
                          accentColor === id ? 'border-2' : 'border-border hover:border-border-bright'
                        )}
                        style={{ borderColor: accentColor === id ? color : undefined }}
                      >
                        <div className="w-8 h-8 rounded-full" style={{ background: color }} />
                        <span className="text-xs text-text-secondary">{label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'about' && (
            <div className="max-w-md">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-purple flex items-center justify-center shadow-glow-blue-strong">
                  <Zap size={30} className="text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold font-display text-text-primary">ProxmoxGuru</h2>
                  <p className="text-sm text-text-secondary">Version 1.0.0</p>
                  <p className="text-xs text-text-tertiary mt-0.5">Production-grade Proxmox VE management</p>
                </div>
              </div>

              <div className="space-y-3">
                {[
                  { label: 'Framework', value: 'Electron 28 + React 18' },
                  { label: 'UI', value: 'Tailwind CSS + Framer Motion' },
                  { label: 'State', value: 'Zustand + TanStack Query' },
                  { label: 'Charts', value: 'Recharts' },
                  { label: 'Storage', value: 'electron-store (encrypted)' },
                  { label: 'License', value: 'MIT' },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <span className="text-sm text-text-tertiary">{label}</span>
                    <span className="text-sm font-medium text-text-primary">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Add server modal */}
      <Modal
        open={showAddServer}
        onClose={() => setShowAddServer(false)}
        title="Add Server"
        size="md"
      >
        <ServerForm
          onSave={handleSaveServer}
          onCancel={() => setShowAddServer(false)}
        />
      </Modal>

      <ConfirmModal
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Remove Server"
        message="Remove this server? Your credentials will be deleted."
        confirmLabel="Remove"
      />
    </div>
  )
}
