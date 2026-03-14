import { useState, useMemo, ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from './Button'

export interface Column<T> {
  key: keyof T | string
  header: string
  render?: (value: unknown, row: T, index: number) => ReactNode
  sortable?: boolean
  width?: string
  align?: 'left' | 'center' | 'right'
  className?: string
}

interface DataTableProps<T extends Record<string, unknown>> {
  data: T[]
  columns: Column<T>[]
  rowKey: keyof T
  onRowClick?: (row: T) => void
  selectedRowId?: unknown
  actions?: (row: T) => ReactNode
  searchable?: boolean
  searchPlaceholder?: string
  pageSize?: number
  loading?: boolean
  emptyState?: ReactNode
  className?: string
  stickyHeader?: boolean
}

type SortDir = 'asc' | 'desc' | null

export function DataTable<T extends Record<string, unknown>>({
  data,
  columns,
  rowKey,
  onRowClick,
  selectedRowId,
  actions,
  searchable = false,
  searchPlaceholder = 'Search...',
  pageSize = 25,
  loading = false,
  emptyState,
  className,
  stickyHeader = false,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<SortDir>(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  function handleSort(key: string) {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : sortDir === 'desc' ? null : 'asc')
      if (sortDir === 'desc') setSortKey(null)
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
    setPage(1)
  }

  const filtered = useMemo(() => {
    if (!search) return data
    const q = search.toLowerCase()
    return data.filter((row) =>
      Object.values(row).some((v) =>
        String(v ?? '').toLowerCase().includes(q)
      )
    )
  }, [data, search])

  const sorted = useMemo(() => {
    if (!sortKey || !sortDir) return filtered
    return [...filtered].sort((a, b) => {
      const av = a[sortKey as keyof T]
      const bv = b[sortKey as keyof T]
      if (av === bv) return 0
      if (av === null || av === undefined) return 1
      if (bv === null || bv === undefined) return -1
      const comp = String(av).localeCompare(String(bv), undefined, { numeric: true })
      return sortDir === 'asc' ? comp : -comp
    })
  }, [filtered, sortKey, sortDir])

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize))
  const paged = sorted.slice((page - 1) * pageSize, page * pageSize)

  const SortIcon = ({ colKey }: { colKey: string }) => {
    if (sortKey !== colKey) return <ChevronsUpDown size={13} className="text-text-muted" />
    if (sortDir === 'asc') return <ChevronUp size={13} className="text-primary" />
    return <ChevronDown size={13} className="text-primary" />
  }

  if (loading) {
    return (
      <div className={cn('rounded-xl border border-border overflow-hidden', className)}>
        <div className="divide-y divide-border">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3">
              {columns.map((col) => (
                <div key={String(col.key)} className="h-4 rounded shimmer flex-1" style={{ width: col.width }} />
              ))}
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className={cn('rounded-xl border border-border overflow-hidden flex flex-col', className)}>
      {searchable && (
        <div className="px-4 py-3 border-b border-border bg-surface-secondary">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              placeholder={searchPlaceholder}
              className="input pl-8 h-8"
            />
          </div>
        </div>
      )}

      <div className="overflow-auto flex-1">
        <table className="w-full text-sm">
          <thead className={cn('bg-surface-secondary', stickyHeader && 'sticky top-0 z-10')}>
            <tr>
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  style={{ width: col.width }}
                  className={cn(
                    'px-4 py-2.5 text-left text-xs font-semibold text-text-tertiary uppercase tracking-wider border-b border-border',
                    col.sortable && 'cursor-pointer hover:text-text-secondary select-none',
                    col.align === 'center' && 'text-center',
                    col.align === 'right' && 'text-right',
                    col.className
                  )}
                  onClick={col.sortable ? () => handleSort(String(col.key)) : undefined}
                >
                  <div className={cn('flex items-center gap-1', col.align === 'right' && 'justify-end', col.align === 'center' && 'justify-center')}>
                    {col.header}
                    {col.sortable && <SortIcon colKey={String(col.key)} />}
                  </div>
                </th>
              ))}
              {actions && <th className="px-4 py-2.5 text-right text-xs font-semibold text-text-tertiary uppercase tracking-wider border-b border-border w-10" />}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            <AnimatePresence initial={false}>
              {paged.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + (actions ? 1 : 0)} className="py-16 text-center">
                    {emptyState || (
                      <p className="text-sm text-text-tertiary">No data to display</p>
                    )}
                  </td>
                </tr>
              ) : (
                paged.map((row, idx) => {
                  const id = row[rowKey]
                  const isSelected = selectedRowId !== undefined && id === selectedRowId
                  return (
                    <motion.tr
                      key={String(id)}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className={cn(
                        'group transition-colors duration-100',
                        onRowClick && 'cursor-pointer',
                        isSelected
                          ? 'bg-primary/10 border-l-2 border-l-primary'
                          : 'hover:bg-surface-hover'
                      )}
                      onClick={onRowClick ? () => onRowClick(row) : undefined}
                    >
                      {columns.map((col) => {
                        const val = row[col.key as keyof T]
                        return (
                          <td
                            key={String(col.key)}
                            className={cn(
                              'px-4 py-3 text-text-secondary whitespace-nowrap',
                              col.align === 'center' && 'text-center',
                              col.align === 'right' && 'text-right',
                              col.className
                            )}
                          >
                            {col.render ? col.render(val, row, idx) : String(val ?? '—')}
                          </td>
                        )
                      })}
                      {actions && (
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {actions(row)}
                          </div>
                        </td>
                      )}
                    </motion.tr>
                  )
                })
              )}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-border bg-surface-secondary">
          <span className="text-xs text-text-tertiary">
            {sorted.length} item{sorted.length !== 1 ? 's' : ''}
            {search && ` (filtered from ${data.length})`}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="xs"
              icon={<ChevronLeft size={13} />}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            />
            <span className="text-xs text-text-secondary px-2">
              {page} / {totalPages}
            </span>
            <Button
              variant="ghost"
              size="xs"
              icon={<ChevronRight size={13} />}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            />
          </div>
        </div>
      )}
    </div>
  )
}
