import { motion } from 'framer-motion'
import { cn, getUsageColor } from '@/lib/utils'

interface ProgressBarProps {
  value?: number
  max?: number
  percentage?: number
  label?: string
  sublabel?: string
  showValue?: boolean
  size?: 'xs' | 'sm' | 'md' | 'lg'
  animated?: boolean
  className?: string
  colorOverride?: string
}

const sizeMap = {
  xs: 'h-0.5',
  sm: 'h-1',
  md: 'h-1.5',
  lg: 'h-2.5',
}

export function ProgressBar({
  value = 0,
  max,
  percentage,
  label,
  sublabel,
  showValue = false,
  size = 'sm',
  animated = true,
  className,
  colorOverride,
}: ProgressBarProps) {
  const pct = percentage !== undefined ? percentage : max ? Math.min((value / max) * 100, 100) : value
  const clampedPct = Math.min(Math.max(pct, 0), 100)
  const color = colorOverride ?? getUsageColor(clampedPct)

  return (
    <div className={cn('w-full', className)}>
      {(label || showValue) && (
        <div className="flex items-center justify-between mb-1.5">
          {label && <span className="text-xs text-text-secondary font-medium">{label}</span>}
          {sublabel && <span className="text-xs text-text-tertiary">{sublabel}</span>}
          {showValue && !sublabel && (
            <span className="text-xs font-mono font-medium" style={{ color }}>
              {clampedPct.toFixed(1)}%
            </span>
          )}
        </div>
      )}
      <div className={cn('w-full rounded-full bg-surface-tertiary overflow-hidden', sizeMap[size])}>
        <motion.div
          className="h-full rounded-full relative overflow-hidden"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${clampedPct}%` }}
          transition={{
            duration: animated ? 0.6 : 0,
            ease: [0.4, 0, 0.2, 1],
          }}
        >
          {animated && clampedPct > 0 && (
            <div
              className="absolute inset-0 opacity-30"
              style={{
                background: `linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)`,
                animation: 'shimmer 2s infinite',
                backgroundSize: '200% 100%',
              }}
            />
          )}
        </motion.div>
      </div>
    </div>
  )
}

interface CircularProgressProps {
  percentage: number
  size?: number
  strokeWidth?: number
  label?: string
  sublabel?: string
  colorOverride?: string
  className?: string
}

export function CircularProgress({
  percentage,
  size = 80,
  strokeWidth = 6,
  label,
  sublabel,
  colorOverride,
  className,
}: CircularProgressProps) {
  const clampedPct = Math.min(Math.max(percentage, 0), 100)
  const color = colorOverride ?? getUsageColor(clampedPct)
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (clampedPct / 100) * circumference

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(42,43,54,0.8)"
          strokeWidth={strokeWidth}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
          style={{
            filter: `drop-shadow(0 0 4px ${color}60)`,
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {label && (
          <span className="text-sm font-bold text-text-primary font-mono">
            {label}
          </span>
        )}
        {sublabel && (
          <span className="text-2xs text-text-tertiary mt-0.5">{sublabel}</span>
        )}
      </div>
    </div>
  )
}
