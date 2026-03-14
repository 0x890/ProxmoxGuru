import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Zap,
  Server,
  Plus,
  Trash2,
  Wifi,
  WifiOff,
  Loader2,
  Shield,
  Key,
  Eye,
  EyeOff,
  ChevronRight,
} from 'lucide-react'
import { useServerStore } from '@/store/serverStore'
import { useUIStore } from '@/store/uiStore'
import { Button } from '@/components/ui/Button'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { cn, generateId } from '@/lib/utils'
import type { ServerConfig } from '@/types/proxmox'

type AuthType = 'token' | 'password'

interface FormState {
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

const defaultForm: FormState = {
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

export default function ConnectPage() {
  const servers = useServerStore((s) => s.servers)
  const connectToServer = useServerStore((s) => s.connectToServer)
  const saveServer = useServerStore((s) => s.saveServer)
  const deleteServer = useServerStore((s) => s.deleteServer)
  const connectionStatus = useServerStore((s) => s.connectionStatus)
  const connectionError = useServerStore((s) => s.connectionError)
  const addToast = useUIStore((s) => s.addToast)

  const [showForm, setShowForm] = useState(servers.length === 0)
  const [form, setForm] = useState<FormState>(defaultForm)
  const [showSecret, setShowSecret] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [connecting, setConnecting] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  function setField<K extends keyof FormState>(key: K, val: FormState[K]) {
    setForm((f) => ({ ...f, [key]: val }))
  }

  async function handleSaveAndConnect() {
    if (!form.name || !form.host) return
    setSaving(true)
    try {
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
      const server = await saveServer(config)
      setShowForm(false)
      setForm(defaultForm)
      setConnecting(server.id)
      await connectToServer(server.id)
      addToast({ type: 'success', title: 'Connected', message: `Connected to ${server.name}` })
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Connection failed',
        message: err instanceof Error ? err.message : 'Unknown error',
      })
    } finally {
      setSaving(false)
      setConnecting(null)
    }
  }

  async function handleConnect(serverId: string) {
    setConnecting(serverId)
    try {
      await connectToServer(serverId)
      addToast({ type: 'success', title: 'Connected' })
    } catch {
      addToast({ type: 'error', title: 'Connection failed', message: connectionError ?? 'Unknown error' })
    } finally {
      setConnecting(null)
    }
  }

  async function handleDelete(serverId: string) {
    await deleteServer(serverId)
    addToast({ type: 'info', title: 'Server removed' })
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-purple/5 blur-3xl" />
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.03) 1px, transparent 0)',
          backgroundSize: '32px 32px',
        }} />
      </div>

      <div className="relative z-10 w-full max-w-lg">
        {/* Logo */}
        <motion.div
          className="text-center mb-10"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-purple shadow-glow-blue-strong mb-4 animate-float">
            <Zap size={32} className="text-white" />
          </div>
          <h1 className="text-4xl font-bold font-display text-text-primary">
            Proxmox<span className="text-gradient">Guru</span>
          </h1>
          <p className="text-text-secondary mt-2">
            Production-grade Proxmox VE management
          </p>
        </motion.div>

        {/* Saved servers */}
        {servers.length > 0 && (
          <motion.div
            className="mb-6"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <h2 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-3">
              Saved Servers
            </h2>
            <div className="space-y-2">
              {servers.map((server) => (
                <div
                  key={server.id}
                  className="glass-panel rounded-xl px-4 py-3 flex items-center gap-3"
                >
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Server size={16} className="text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-text-primary">{server.name}</p>
                    <p className="text-xs text-text-tertiary">
                      {server.host}:{server.port} · {server.authType === 'token' ? 'API Token' : 'Password'}
                    </p>
                  </div>
                  <StatusBadge status={server.connected ? 'online' : 'offline'} size="xs" />
                  <div className="flex items-center gap-1">
                    <Button
                      variant="primary"
                      size="sm"
                      loading={connecting === server.id}
                      onClick={() => handleConnect(server.id)}
                      icon={connecting === server.id ? undefined : <ChevronRight size={14} />}
                      iconPosition="right"
                    >
                      Connect
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(server.id)}
                      icon={<Trash2 size={13} />}
                      className="text-danger hover:text-danger"
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Add server form toggle */}
        {!showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <Button
              variant="secondary"
              size="md"
              className="w-full"
              icon={<Plus size={16} />}
              onClick={() => setShowForm(true)}
            >
              Add New Server
            </Button>
          </motion.div>
        )}

        {/* Connection form */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              className="glass-panel rounded-2xl p-6"
              initial={{ opacity: 0, height: 0, y: 10 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0, y: 10 }}
              transition={{ duration: 0.3 }}
            >
              <h2 className="text-base font-semibold text-text-primary mb-5 flex items-center gap-2">
                <Plus size={16} className="text-primary" />
                Add Server
              </h2>

              <div className="space-y-4">
                {/* Server name & host */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1.5">
                      Display Name
                    </label>
                    <input
                      type="text"
                      className="input"
                      placeholder="My Proxmox"
                      value={form.name}
                      onChange={(e) => setField('name', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1.5">
                      Port
                    </label>
                    <input
                      type="text"
                      className="input"
                      placeholder="8006"
                      value={form.port}
                      onChange={(e) => setField('port', e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">
                    Host / IP Address
                  </label>
                  <input
                    type="text"
                    className="input"
                    placeholder="192.168.1.100"
                    value={form.host}
                    onChange={(e) => setField('host', e.target.value)}
                  />
                </div>

                {/* Auth type tabs */}
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-2">
                    Authentication
                  </label>
                  <div className="flex gap-1 p-1 rounded-lg bg-surface-secondary border border-border">
                    {(['password', 'token'] as const).map((t) => (
                      <button
                        key={t}
                        onClick={() => setField('authType', t)}
                        className={cn(
                          'flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-all',
                          form.authType === t
                            ? 'bg-primary text-white shadow-glow-blue'
                            : 'text-text-secondary hover:text-text-primary'
                        )}
                      >
                        {t === 'password' ? <Shield size={12} /> : <Key size={12} />}
                        {t === 'password' ? 'Username/Password' : 'API Token'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Password auth */}
                {form.authType === 'password' && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-3"
                  >
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
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary"
                        >
                          {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Token auth */}
                {form.authType === 'token' && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-3"
                  >
                    <div>
                      <label className="block text-xs font-medium text-text-secondary mb-1.5">
                        Token ID
                        <span className="ml-1 text-text-muted font-normal">(user@realm!tokenname)</span>
                      </label>
                      <input
                        className="input"
                        placeholder="root@pam!mytoken"
                        value={form.tokenId}
                        onChange={(e) => setField('tokenId', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-text-secondary mb-1.5">Token Secret</label>
                      <div className="relative">
                        <input
                          type={showSecret ? 'text' : 'password'}
                          className="input pr-10 font-mono"
                          placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                          value={form.tokenSecret}
                          onChange={(e) => setField('tokenSecret', e.target.value)}
                        />
                        <button
                          type="button"
                          onClick={() => setShowSecret(!showSecret)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary"
                        >
                          {showSecret ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* SSL */}
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <div
                    onClick={() => setField('verifySsl', !form.verifySsl)}
                    className={cn(
                      'w-9 h-5 rounded-full transition-colors relative',
                      form.verifySsl ? 'bg-primary' : 'bg-surface-tertiary border border-border'
                    )}
                  >
                    <div className={cn(
                      'absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform shadow-sm',
                      form.verifySsl ? 'translate-x-4' : 'translate-x-0.5'
                    )} />
                  </div>
                  <span className="text-xs text-text-secondary">Verify SSL certificate</span>
                </label>

                {/* Error */}
                {connectionError && (
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-danger/10 border border-danger/25">
                    <WifiOff size={14} className="text-danger mt-0.5 shrink-0" />
                    <p className="text-xs text-danger">{connectionError}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-1">
                  {servers.length > 0 && (
                    <Button variant="ghost" size="md" className="flex-1" onClick={() => setShowForm(false)}>
                      Cancel
                    </Button>
                  )}
                  <Button
                    variant="primary"
                    size="md"
                    className="flex-1"
                    loading={saving}
                    onClick={handleSaveAndConnect}
                    disabled={!form.name || !form.host}
                    icon={saving ? undefined : <Wifi size={15} />}
                  >
                    {saving ? 'Connecting...' : 'Connect'}
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Features */}
        {servers.length === 0 && !showForm && (
          <motion.div
            className="mt-8 grid grid-cols-3 gap-3 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {[
              { icon: '⚡', label: 'Real-time\nMetrics' },
              { icon: '🛡️', label: 'Encrypted\nStorage' },
              { icon: '🖥️', label: 'Multi-server\nSupport' },
            ].map((f) => (
              <div key={f.label} className="glass-panel rounded-xl p-3">
                <div className="text-xl mb-1">{f.icon}</div>
                <p className="text-2xs text-text-tertiary whitespace-pre-line leading-tight">{f.label}</p>
              </div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  )
}
