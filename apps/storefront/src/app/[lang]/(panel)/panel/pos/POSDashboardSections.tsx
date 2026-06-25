'use client'

import { motion } from 'framer-motion'
import { Check, ArrowUpRight, ArrowDownRight, Package } from 'lucide-react'
import type { DailyStats } from '@/lib/pos/pos-config'

export function KPICard({
    icon,
    label,
    value,
    gradient,
    iconBg,
    highlight,
    delta,
}: {
    icon: React.ReactNode
    label: string
    value: string
    gradient: string
    iconBg: string
    highlight?: boolean
    delta?: { value: number; isUp: boolean }
}) {
    return (
        <div className={`relative rounded-2xl p-4 space-y-2.5 overflow-hidden
                         bg-gradient-to-br ${gradient} border border-sf-2
                         hover:border-brand-soft transition-all duration-300 group`}>
            <div className="absolute -top-4 -right-4 w-16 h-16 rounded-full bg-brand-subtle group-hover:bg-brand-subtle transition-colors" />

            <div className="flex items-center justify-between">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${iconBg}`}>
                    {icon}
                </div>
                {delta && delta.value > 0 && (
                    <div className={`flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-md
                                    ${delta.isUp
                            ? 'bg-emerald-500/10 text-emerald-600'
                            : 'bg-rose-500/10 text-rose-600'
                        }`}>
                        {delta.isUp
                            ? <ArrowUpRight className="w-3 h-3" />
                            : <ArrowDownRight className="w-3 h-3" />
                        }
                        {delta.value}%
                    </div>
                )}
                {!delta && highlight && (
                    <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
            </div>
            <div className="text-[11px] text-tx-muted font-medium">{label}</div>
            <div className={`font-bold text-tx ${highlight ? 'text-lg' : 'text-base'}`}>
                {value}
            </div>
        </div>
    )
}

export function TopProducts({
    products,
    formatCurrency,
    labels,
}: {
    products: { title: string; quantity: number; revenue: number }[]
    formatCurrency: (n: number) => string
    labels: Record<string, string>
}) {
    const maxRevenue = products[0]?.revenue || 1

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="rounded-2xl bg-glass-heavy border border-sf-2 p-4"
        >
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-tx-sec uppercase tracking-wider">
                    {labels['panel.pos.topProducts'] || 'Top productos'}
                </h3>
                <Package className="w-3.5 h-3.5 text-tx-muted" />
            </div>
            <div className="space-y-2">
                {products.slice(0, 5).map((prod, idx) => {
                    const barPct = (prod.revenue / maxRevenue) * 100
                    return (
                        <motion.div
                            key={prod.title}
                            className="group relative"
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.5 + idx * 0.06 }}
                        >
                            <motion.div
                                className="absolute inset-0 rounded-xl bg-brand-subtle group-hover:bg-brand-subtle transition-colors"
                                initial={{ width: 0 }}
                                animate={{ width: `${barPct}%` }}
                                transition={{ delay: 0.6 + idx * 0.06, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                            />
                            <div className="relative flex items-center justify-between p-2.5 pr-3">
                                <div className="flex items-center gap-2.5">
                                    <span className="w-6 h-6 rounded-lg bg-sf-0 border border-sf-2 flex items-center justify-center
                                                       text-[10px] font-bold text-tx-muted flex-shrink-0 shadow-sm">
                                        {idx + 1}
                                    </span>
                                    <span className="text-xs font-medium text-tx truncate max-w-[160px]">
                                        {prod.title}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] text-tx-muted bg-sf-0 px-1.5 py-0.5 rounded-md">
                                        ×{prod.quantity}
                                    </span>
                                    <span className="text-xs font-bold text-tx">
                                        {formatCurrency(prod.revenue)}
                                    </span>
                                </div>
                            </div>
                        </motion.div>
                    )
                })}
            </div>
        </motion.div>
    )
}

export function WeekKPI({
    label,
    value,
    color,
    highlight,
}: {
    label: string
    value: string
    color: 'blue' | 'emerald' | 'violet'
    highlight?: boolean
}) {
    const colors = {
        blue: 'from-blue-500/10 to-blue-500/5 text-blue-700',
        emerald: 'from-emerald-500/10 to-emerald-500/5 text-emerald-700',
        violet: 'from-violet-500/10 to-violet-500/5 text-violet-700',
    }

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className={`rounded-2xl p-3 bg-gradient-to-br ${colors[color]} border border-sf-2 text-center`}
        >
            <div className="text-[10px] font-medium opacity-70">{label}</div>
            <div className={`font-bold tabular-nums mt-1 ${highlight ? 'text-base' : 'text-sm'}`}>
                {value}
            </div>
        </motion.div>
    )
}

export function DaySummaryCard({
    label,
    day,
    formatCurrency,
    variant,
}: {
    label: string
    day: DailyStats
    formatCurrency: (n: number) => string
    variant: 'success' | 'muted'
}) {
    const styles = variant === 'success'
        ? 'bg-emerald-50/50 border-emerald-200/40'
        : 'bg-sf-1 border-sf-2'
    const dateStr = new Date(day.date).toLocaleDateString(undefined, {
        weekday: 'short', day: 'numeric', month: 'short'
    })

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className={`rounded-2xl border p-3.5 ${styles}`}
        >
            <div className="text-[10px] text-tx-muted font-medium">{label}</div>
            <div className="text-xs font-bold text-tx mt-1">{dateStr}</div>
            <div className="flex items-center justify-between mt-2 text-xs">
                <span className="text-tx-muted">{day.totalSales} ventas</span>
                <span className="font-bold text-tx tabular-nums">
                    {formatCurrency(day.totalRevenue)}
                </span>
            </div>
        </motion.div>
    )
}

export function DashboardSkeleton() {
    return (
        <div className="p-5 space-y-5">
            <div className="grid grid-cols-2 gap-3">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="rounded-2xl p-4 space-y-2.5 border border-sf-2 bg-glass">
                        <div className="w-8 h-8 rounded-xl bg-sf-2 animate-pulse" />
                        <div className="h-2.5 w-16 bg-glass rounded animate-pulse" />
                        <div className="h-5 w-24 bg-sf-2 rounded animate-pulse" />
                    </div>
                ))}
            </div>
            <div className="rounded-2xl border border-sf-2 bg-glass p-4 space-y-3">
                <div className="h-3 w-28 bg-sf-2 rounded animate-pulse" />
                <div className="h-[180px] bg-sf-1 rounded-xl animate-pulse" />
            </div>
            <div className="rounded-2xl border border-sf-2 bg-glass p-4">
                <div className="h-3 w-32 bg-sf-2 rounded animate-pulse mb-3" />
                <div className="flex items-center gap-4">
                    <div className="w-[140px] h-[140px] rounded-full bg-sf-1 animate-pulse" />
                    <div className="flex-1 space-y-3">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="h-3 bg-sf-1 rounded animate-pulse" />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
