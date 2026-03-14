import { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { AreaChart, Area, ResponsiveContainer } from 'recharts'
import { cn } from '@/lib/utils'

interface SparklineData {
  value: number
}

interface MetricCardProps {
  icon: ReactNode
  title: string
  value: string | number
  unit?: string
  subtitle?: string
  trend?: number
  sparklineData?: SparklineData[]
  sparklineColor?: string
  className?: string
  glowColor?: 'blue' | 'purple' | 'green' | 'red' | 'yellow'
  onClick?: () => void
  loading?: boolean
}

const glowMap = {
  blue: 'hover:shadow-glow-blue',
  purple: 'hover:shadow-glow-purple',
  green: 'hover:shadow-glow-green',
  red: 'hover:shadow-glow-red',
  yellow: '',
}

const glowColorMap = {
  blue: '#4DA3FF',
  purple: '#7B61FF',
  green: '#22C55E',
  red: '#EF4444',
  yellow: '#F59E0B',
}

export function MetricCard({
  icon,
  title,
  value,
  unit,
  subtitle,
  trend,
  sparklineData,
  sparklineColor = '#4DA3FF',
  className,
  glowColor = 'blue',
  onClick,
  loading = false,
}: MetricCardProps) {
  const hasTrend = trend !== undefined
  const trendPositive = hasTrend && trend > 0
  const trendNegative = hasTrend && trend < 0
  const trendNeutral = hasTrend && trend === 0

  if (loading) {
    return (
      <div className={cn('card p-4', className)}>
        <div className="animate-pulse space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg shimmer" />
            <div className="h-3 w-24 rounded shimmer" />
          </div>
          <div className="h-8 w-32 rounded shimmer" />
          <div className="h-2 w-full rounded shimmer" />
        </div>
      </div>
    )
  }

  return (
    <motion.div
      className={cn(
        'card p-4 relative overflow-hidden transition-all duration-200',
        onClick && 'cursor-pointer card-hover',
        glowColor && glowMap[glowColor],
        className
      )}
      onClick={onClick}
      whileHover={onClick ? { y: -2 } : {}}
      transition={{ duration: 0.15 }}
    >
      {/* Background glow */}
      <div
        className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-5 blur-2xl pointer-events-none"
        style={{ background: glowColorMap[glowColor] }}
      />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: `${glowColorMap[glowColor]}18` }}
            >
              <span style={{ color: glowColorMap[glowColor] }} className="[&>svg]:w-4 [&>svg]:h-4">
                {icon}
              </span>
            </div>
            <span className="text-xs font-medium text-text-secondary uppercase tracking-wider">
              {title}
            </span>
          </div>

          {hasTrend && (
            <div
              className={cn(
                'flex items-center gap-0.5 text-xs font-medium',
                trendPositive && 'text-success',
                trendNegative && 'text-danger',
                trendNeutral && 'text-text-tertiary'
              )}
            >
              {trendPositive && <TrendingUp size={12} />}
              {trendNegative && <TrendingDown size={12} />}
              {trendNeutral && <Minus size={12} />}
              {trend !== 0 && <span>{Math.abs(trend).toFixed(1)}%</span>}
            </div>
          )}
        </div>

        {/* Value */}
        <div className="flex items-baseline gap-1.5 mb-1">
          <span className="text-2xl font-bold text-text-primary font-display">
            {value}
          </span>
          {unit && (
            <span className="text-sm text-text-secondary font-medium">{unit}</span>
          )}
        </div>

        {/* Subtitle */}
        {subtitle && (
          <p className="text-xs text-text-tertiary mb-3">{subtitle}</p>
        )}

        {/* Sparkline */}
        {sparklineData && sparklineData.length > 0 && (
          <div className="h-10 mt-2 -mx-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparklineData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id={`sparkGrad-${title}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={sparklineColor} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={sparklineColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={sparklineColor}
                  strokeWidth={1.5}
                  fill={`url(#sparkGrad-${title})`}
                  dot={false}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </motion.div>
  )
}
