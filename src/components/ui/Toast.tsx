import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react'
import { useUIStore, type Toast } from '@/store/uiStore'
import { cn } from '@/lib/utils'

const icons = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
}

const colorMap = {
  success: {
    border: 'border-success/30',
    icon: 'text-success',
    bg: 'bg-success/5',
  },
  error: {
    border: 'border-danger/30',
    icon: 'text-danger',
    bg: 'bg-danger/5',
  },
  warning: {
    border: 'border-warning/30',
    icon: 'text-warning',
    bg: 'bg-warning/5',
  },
  info: {
    border: 'border-primary/30',
    icon: 'text-primary',
    bg: 'bg-primary/5',
  },
}

function ToastItem({ toast }: { toast: Toast }) {
  const removeToast = useUIStore((s) => s.removeToast)
  const Icon = icons[toast.type]
  const colors = colorMap[toast.type]

  return (
    <motion.div
      initial={{ opacity: 0, x: 80, scale: 0.92 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 80, scale: 0.92 }}
      transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
      className={cn(
        'flex items-start gap-3 p-3.5 rounded-xl border bg-surface',
        'shadow-glass-lg min-w-72 max-w-80',
        colors.border,
        colors.bg
      )}
    >
      <Icon size={16} className={cn('shrink-0 mt-0.5', colors.icon)} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text-primary">{toast.title}</p>
        {toast.message && (
          <p className="text-xs text-text-secondary mt-0.5 leading-relaxed">{toast.message}</p>
        )}
      </div>
      <button
        onClick={() => removeToast(toast.id)}
        className="shrink-0 p-0.5 rounded text-text-tertiary hover:text-text-secondary transition-colors"
      >
        <X size={13} />
      </button>
    </motion.div>
  )
}

export function ToastContainer() {
  const toasts = useUIStore((s) => s.toasts)

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      <div className="flex flex-col gap-2 pointer-events-auto">
        <AnimatePresence mode="popLayout">
          {toasts.map((toast) => (
            <ToastItem key={toast.id} toast={toast} />
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}

// Hook for easy toast usage
export function useToast() {
  const addToast = useUIStore((s) => s.addToast)

  return {
    success: (title: string, message?: string) =>
      addToast({ type: 'success', title, message }),
    error: (title: string, message?: string) =>
      addToast({ type: 'error', title, message }),
    warning: (title: string, message?: string) =>
      addToast({ type: 'warning', title, message }),
    info: (title: string, message?: string) =>
      addToast({ type: 'info', title, message }),
  }
}
