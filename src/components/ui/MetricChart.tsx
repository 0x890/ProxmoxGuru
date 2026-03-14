import { ReactNode } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  TooltipProps,
} from 'recharts'
import { cn } from '@/lib/utils'

interface ChartDataPoint {
  time: number
  [key: string]: number
}

interface MetricSeries {
  key: string
  label: string
  color: string
  unit?: string
  format?: (value: number) => string
}

interface MetricChartProps {
  data: ChartDataPoint[]
  series: MetricSeries[]
  title?: string
  height?: number
  className?: string
  loading?: boolean
  emptyMessage?: string
  rightLabel?: ReactNode
  showGrid?: boolean
  showXAxis?: boolean
  formatXAxis?: (value: number) => string
}

function CustomTooltip({ active, payload, label, series }: TooltipProps<number, string> & { series: MetricSeries[] }) {
  if (!active || !payload || payload.length === 0) return null

  return (
    <div className="glass-panel rounded-lg px-3 py-2.5 min-w-28">
      <p className="text-xs text-text-tertiary mb-1.5">
        {typeof label === 'number'
          ? new Date(label * 1000).toLocaleTimeString()
          : label}
      </p>
      {payload.map((entry) => {
        const s = series.find((s) => s.key === entry.dataKey)
        const value = entry.value as number
        const formatted = s?.format ? s.format(value) : `${value?.toFixed(1)}${s?.unit ?? ''}`
        return (
          <div key={entry.dataKey} className="flex items-center gap-2 text-xs">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: s?.color }} />
            <span className="text-text-secondary">{s?.label ?? entry.dataKey}:</span>
            <span className="font-mono font-medium text-text-primary ml-auto">{formatted}</span>
          </div>
        )
      })}
    </div>
  )
}

export function MetricChart({
  data,
  series,
  title,
  height = 180,
  className,
  loading = false,
  emptyMessage = 'No data available',
  rightLabel,
  showGrid = true,
  showXAxis = true,
  formatXAxis,
}: MetricChartProps) {
  const defaultFormatX = (ts: number) =>
    new Date(ts * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  if (loading) {
    return (
      <div className={cn('rounded-xl border border-border bg-surface p-4', className)}>
        {title && <div className="h-4 w-32 rounded shimmer mb-4" />}
        <div className="shimmer rounded" style={{ height }} />
      </div>
    )
  }

  return (
    <div className={cn('rounded-xl border border-border bg-surface p-4', className)}>
      {(title || rightLabel) && (
        <div className="flex items-center justify-between mb-4">
          {title && <h3 className="text-sm font-semibold text-text-primary">{title}</h3>}
          {rightLabel && <div>{rightLabel}</div>}
        </div>
      )}

      {data.length === 0 ? (
        <div className="flex items-center justify-center text-text-tertiary text-sm" style={{ height }}>
          {emptyMessage}
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={height}>
          <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
            <defs>
              {series.map((s) => (
                <linearGradient key={s.key} id={`grad-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={s.color} stopOpacity={0.2} />
                  <stop offset="95%" stopColor={s.color} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>

            {showGrid && (
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(42,43,54,0.8)"
                vertical={false}
              />
            )}

            {showXAxis && (
              <XAxis
                dataKey="time"
                tickFormatter={formatXAxis ?? defaultFormatX}
                tick={{ fill: '#5C5D6E', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
                minTickGap={60}
              />
            )}

            <YAxis
              tick={{ fill: '#5C5D6E', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => {
                const s = series[0]
                if (s?.format) return s.format(v)
                return `${v}${s?.unit ?? ''}`
              }}
              width={40}
            />

            <Tooltip
              content={(props: TooltipProps<number, string>) => <CustomTooltip {...props} series={series} />}
              cursor={{ stroke: 'rgba(255,255,255,0.05)', strokeWidth: 1 }}
            />

            {series.map((s) => (
              <Area
                key={s.key}
                type="monotone"
                dataKey={s.key}
                stroke={s.color}
                strokeWidth={2}
                fill={`url(#grad-${s.key})`}
                dot={false}
                activeDot={{ r: 4, fill: s.color, stroke: 'none' }}
                isAnimationActive={false}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
