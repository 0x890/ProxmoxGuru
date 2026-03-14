import { cn } from '@/lib/utils'

type StatusType = 'online' | 'offline' | 'warning' | 'error' | 'running' | 'stopped' | 'paused' | 'suspended' | 'unknown'

interface StatusBadgeProps {
  status: StatusType | string
  label?: string
  size?: 'xs' | 'sm' | 'md'
  showDot?: boolean
  className?: string
}

const statusConfig: Record<string, { color: string; bg: string; border: string; label: string; pulse: boolean }> = {
  online: {
    color: 'text-success',
    bg: 'bg-success/10',
    border: 'border-success/25',
    label: 'Online',
    pulse: true,
  },
  running: {
    color: 'text-success',
    bg: 'bg-success/10',
    border: 'border-success/25',
    label: 'Running',
    pulse: true,
  },
  offline: {
    color: 'text-text-secondary',
    bg: 'bg-surface-tertiary',
    border: 'border-border',
    label: 'Offline',
    pulse: false,
  },
  stopped: {
    color: 'text-text-secondary',
    bg: 'bg-surface-tertiary',
    border: 'border-border',
    label: 'Stopped',
    pulse: false,
  },
  warning: {
    color: 'text-warning',
    bg: 'bg-warning/10',
    border: 'border-warning/25',
    label: 'Warning',
    pulse: false,
  },
  paused: {
    color: 'text-warning',
    bg: 'bg-warning/10',
    border: 'border-warning/25',
    label: 'Paused',
    pulse: false,
  },
  suspended: {
    color: 'text-warning',
    bg: 'bg-warning/10',
    border: 'border-warning/25',
    label: 'Suspended',
    pulse: false,
  },
  error: {
    color: 'text-danger',
    bg: 'bg-danger/10',
    border: 'border-danger/25',
    label: 'Error',
    pulse: false,
  },
  unknown: {
    color: 'text-text-tertiary',
    bg: 'bg-surface-tertiary',
    border: 'border-border',
    label: 'Unknown',
    pulse: false,
  },
}

const dotColors: Record<string, string> = {
  online: 'bg-success',
  running: 'bg-success',
  offline: 'bg-text-tertiary',
  stopped: 'bg-text-tertiary',
  warning: 'bg-warning',
  paused: 'bg-warning',
  suspended: 'bg-warning',
  error: 'bg-danger',
  unknown: 'bg-text-tertiary',
}

const sizeStyles = {
  xs: 'text-2xs px-1.5 py-0.5 gap-1',
  sm: 'text-xs px-2 py-0.5 gap-1.5',
  md: 'text-sm px-2.5 py-1 gap-1.5',
}

const dotSizes = {
  xs: 'w-1.5 h-1.5',
  sm: 'w-2 h-2',
  md: 'w-2 h-2',
}

export function StatusBadge({
  status,
  label,
  size = 'sm',
  showDot = true,
  className,
}: StatusBadgeProps) {
  const key = status?.toLowerCase() ?? 'unknown'
  const config = statusConfig[key] ?? statusConfig.unknown
  const dotColor = dotColors[key] ?? 'bg-text-tertiary'
  const displayLabel = label ?? config.label

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border font-medium',
        sizeStyles[size],
        config.color,
        config.bg,
        config.border,
        className
      )}
    >
      {showDot && (
        <span className="relative flex shrink-0">
          <span className={cn('rounded-full', dotSizes[size], dotColor)} />
          {config.pulse && (
            <span
              className={cn(
                'absolute inset-0 rounded-full animate-ping opacity-75',
                dotColor
              )}
            />
          )}
        </span>
      )}
      {displayLabel}
    </span>
  )
}

export function StatusDot({ status, size = 8 }: { status: string; size?: number }) {
  const key = status?.toLowerCase() ?? 'unknown'
  const dotColor = dotColors[key] ?? 'bg-text-tertiary'
  const config = statusConfig[key] ?? statusConfig.unknown

  return (
    <span className="relative flex shrink-0" style={{ width: size, height: size }}>
      <span className={cn('rounded-full w-full h-full', dotColor)} />
      {config.pulse && (
        <span
          className={cn('absolute inset-0 rounded-full animate-ping opacity-75', dotColor)}
        />
      )}
    </span>
  )
}
