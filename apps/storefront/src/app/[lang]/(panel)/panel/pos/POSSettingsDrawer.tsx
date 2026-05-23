'use client'

/**
 * POSSettingsDrawer — Slide-over drawer for POS-specific config
 *
 * Phase 6A: Allows editing receipt header/footer, default payment method,
 * tax display, tips, and sounds from within the POS interface.
 * Uses the same governance pipeline (saveOnboardingConfigAction).
 */

import { useState, useCallback, useTransition, type ReactNode } from 'react'
import { X, Settings, Save, Loader2, Check, Receipt, Volume2, Timer, BarChart3, Wifi, Lock } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { saveOnboardingConfigAction } from '@/app/[lang]/(panel)/panel/actions'
import { posLabel } from '@/lib/pos/pos-i18n'

// ── Config field definitions — loaded from centralized SSOT registry ──
import { POS_SETTINGS_SCHEMA, type ConfigFieldDefWithGroup } from '@/lib/registries/module-config-schemas'

const ICON_MAP: Record<string, typeof Receipt> = { Receipt, Volume2 }

const POS_SETTINGS_FIELDS = POS_SETTINGS_SCHEMA.map(f => ({
    ...f,
    icon: f.iconKey ? ICON_MAP[f.iconKey] : undefined,
}))

// ── Props ──────────────────────────────────────────────────────────

interface Props {
    isOpen: boolean
    onClose: () => void
    initialValues: Record<string, unknown>
    labels: Record<string, string>
    kioskFlags?: {
        enable_kiosk_idle_timer: boolean
        enable_kiosk_analytics: boolean
        enable_kiosk_remote_management: boolean
    }
}

function POSSettingsField({
    field,
    value,
    onChange,
}: {
    field: ConfigFieldDefWithGroup & { icon?: typeof Receipt }
    value: unknown
    onChange: (value: unknown) => void
}) {
    const inputId = `pos-cfg-${field.key}`

    if (field.type === 'text') {
        return (
            <>
                <label htmlFor={inputId} className="block text-xs font-semibold text-tx-muted mb-1.5">
                    {field.label}
                </label>
                <input
                    id={inputId}
                    type="text"
                    value={String(value ?? '')}
                    onChange={e => onChange(e.target.value)}
                    placeholder={field.placeholder}
                    className="w-full px-4 py-2.5 min-h-[44px] rounded-xl glass text-tx text-sm focus:ring-2 focus:ring-soft transition-all outline-none"
                />
            </>
        )
    }

    if (field.type === 'textarea') {
        return (
            <>
                <label htmlFor={inputId} className="block text-xs font-semibold text-tx-muted mb-1.5">
                    {field.label}
                </label>
                <textarea
                    id={inputId}
                    value={String(value ?? '')}
                    onChange={e => onChange(e.target.value)}
                    placeholder={field.placeholder}
                    rows={3}
                    className="w-full px-4 py-3 min-h-[80px] rounded-xl glass text-tx text-sm focus:ring-2 focus:ring-soft transition-all outline-none resize-none"
                />
            </>
        )
    }

    if (field.type === 'select' && field.options) {
        return (
            <>
                <label htmlFor={inputId} className="block text-xs font-semibold text-tx-muted mb-1.5">
                    {field.label}
                </label>
                <select
                    id={inputId}
                    value={String(value ?? '')}
                    onChange={e => onChange(e.target.value)}
                    className="w-full px-4 py-2.5 min-h-[44px] rounded-xl glass text-tx text-sm focus:ring-2 focus:ring-soft transition-all outline-none appearance-none cursor-pointer"
                >
                    {field.options.map(opt => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </select>
            </>
        )
    }

    return (
        <div className="flex items-center justify-between">
            <label htmlFor={inputId} className="text-sm font-medium text-tx cursor-pointer">
                {field.label}
            </label>
            <button
                id={inputId}
                role="switch"
                aria-checked={Boolean(value)}
                onClick={() => onChange(!value)}
                className={`relative w-11 h-6 rounded-full transition-colors ${
                    value ? 'bg-brand' : 'bg-sf-3'
                }`}
            >
                <motion.div
                    className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
                    animate={{ x: value ? 24 : 4 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
            </button>
        </div>
    )
}

function KioskFeatureCard({
    icon: Icon,
    title,
    enabled,
    activeLabel,
    lockedLabel,
    description,
    children,
}: {
    icon: typeof Timer
    title: string
    enabled: boolean
    activeLabel?: string
    lockedLabel: string
    description: string
    children?: ReactNode
}) {
    return (
        <div className={`rounded-xl border p-4 transition-all ${
            enabled ? 'border-sf-3 bg-sf-0' : 'border-sf-3 bg-sf-0 opacity-50'
        }`}>
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-brand" />
                    <span className="text-sm font-medium text-tx">{title}</span>
                </div>
                {enabled ? (
                    activeLabel ? <span className="text-xs text-emerald-500 font-medium">{activeLabel}</span> : null
                ) : (
                    <span className="flex items-center gap-1 text-xs text-tx-muted">
                        <Lock className="w-3 h-3" /> {lockedLabel}
                    </span>
                )}
            </div>
            <p className="text-xs text-tx-muted mb-2">{description}</p>
            {children}
        </div>
    )
}

// ── Component ─────────────────────────────────────────────────────

export default function POSSettingsDrawer({ isOpen, onClose, initialValues, labels, kioskFlags }: Props) {
    const [values, setValues] = useState<Record<string, unknown>>(initialValues)
    const [isPending, startTransition] = useTransition()
    const [saved, setSaved] = useState(false)

    const hasChanges = POS_SETTINGS_FIELDS.some(f => {
        const initial = initialValues[f.key]
        const current = values[f.key]
        return String(initial ?? '') !== String(current ?? '')
    })

    const updateValue = (key: string, value: unknown) => {
        setValues(prev => ({ ...prev, [key]: value }))
        setSaved(false)
    }

    const handleSave = useCallback(() => {
        const updates: Record<string, unknown> = {}
        for (const field of POS_SETTINGS_FIELDS) {
            const current = values[field.key]
            const initial = initialValues[field.key]
            if (String(current ?? '') !== String(initial ?? '')) {
                updates[field.key] = current
            }
        }
        if (Object.keys(updates).length === 0) return

        startTransition(async () => {
            const result = await saveOnboardingConfigAction(updates)
            if (result.success) {
                setSaved(true)
                setTimeout(() => setSaved(false), 2500)
            }
        })
    }, [values, initialValues])

    const groups = [
        { key: 'receipt', label: '🧾 Receipt', icon: Receipt },
        { key: 'payment', label: '💳 Payment' },
        { key: 'experience', label: '✨ Experience' },
    ] as const

    const showKioskSection = kioskFlags && (
        kioskFlags.enable_kiosk_idle_timer ||
        kioskFlags.enable_kiosk_analytics ||
        kioskFlags.enable_kiosk_remote_management
    )

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
                    />

                    {/* Drawer */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                        className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-sf-0 shadow-2xl flex flex-col"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-sf-2">
                            <div className="flex items-center gap-2">
                                <Settings className="w-5 h-5 text-brand" />
                                <h2 className="text-lg font-bold text-tx">
                                    {posLabel('panel.pos.settings', labels) || 'POS Settings'}
                                </h2>
                            </div>
                            <button
                                onClick={onClose}
                                className="w-8 h-8 rounded-full bg-sf-1 flex items-center justify-center hover:bg-sf-2 transition-colors"
                                aria-label="Close"
                            >
                                <X className="w-4 h-4 text-tx-muted" />
                            </button>
                        </div>

                        {/* Settings body */}
                        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
                            {groups.map(group => {
                                const groupFields = POS_SETTINGS_FIELDS.filter(f => f.group === group.key)
                                if (groupFields.length === 0) return null

                                return (
                                    <div key={group.key}>
                                        <h3 className="text-xs font-bold text-tx-muted uppercase tracking-wider mb-3">
                                            {group.label}
                                        </h3>
                                        <div className="space-y-3">
                                            {groupFields.map(field => (
                                                <div key={field.key}>
                                                    <POSSettingsField
                                                        field={field}
                                                        value={values[field.key]}
                                                        onChange={(value) => updateValue(field.key, value)}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )
                            })}

                            {/* Kiosk Settings Section */}
                            {showKioskSection && (
                                <div>
                                    <h3 className="text-xs font-bold text-tx-muted uppercase tracking-wider mb-3">
                                        📱 Kiosk
                                    </h3>
                                    <div className="space-y-3">
                                        {/* Idle Timer */}
                                        <KioskFeatureCard
                                            icon={Timer}
                                            title="Temporizador inactividad"
                                            enabled={kioskFlags!.enable_kiosk_idle_timer}
                                            lockedLabel="Pro"
                                            description="Tiempo antes de mostrar pantalla de atracción"
                                        >
                                            {kioskFlags!.enable_kiosk_idle_timer ? (
                                                <div className="flex gap-2">
                                                    {[30, 60, 120, 300].map(sec => (
                                                        <button
                                                            key={sec}
                                                            onClick={() => updateValue('kiosk_idle_timeout', sec)}
                                                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                                                (values.kiosk_idle_timeout ?? 60) === sec
                                                                    ? 'bg-brand text-white'
                                                                    : 'bg-sf-1 text-tx-sec hover:bg-sf-2'
                                                            }`}
                                                        >
                                                            {sec < 60 ? `${sec}s` : `${sec / 60}m`}
                                                        </button>
                                                    ))}
                                                </div>
                                            ) : null}
                                        </KioskFeatureCard>

                                        {/* Kiosk Analytics */}
                                        <KioskFeatureCard
                                            icon={BarChart3}
                                            title="Analíticas de kiosco"
                                            enabled={kioskFlags!.enable_kiosk_analytics}
                                            activeLabel="Activo"
                                            lockedLabel="Enterprise"
                                            description={
                                                kioskFlags!.enable_kiosk_analytics
                                                    ? 'Sesiones, duración media, productos más vistos en kiosco'
                                                    : 'Métricas de uso del kiosco disponibles en Enterprise'
                                            }
                                        />

                                        {/* Remote Management */}
                                        <KioskFeatureCard
                                            icon={Wifi}
                                            title="Gestión remota"
                                            enabled={kioskFlags!.enable_kiosk_remote_management}
                                            activeLabel="Activo"
                                            lockedLabel="Enterprise"
                                            description={
                                                kioskFlags!.enable_kiosk_remote_management
                                                    ? 'Controla dispositivos kiosco remotamente, reinicia sesiones y actualiza menú'
                                                    : 'Control remoto de dispositivos kiosco disponible en Enterprise'
                                            }
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer — Save */}
                        <div className="px-6 py-4 border-t border-sf-2">
                            <motion.button
                                onClick={handleSave}
                                disabled={isPending || !hasChanges}
                                className="w-full btn btn-primary inline-flex items-center justify-center gap-2 text-sm min-h-[48px] disabled:opacity-40"
                                whileTap={{ scale: 0.97 }}
                            >
                                {isPending ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : saved ? (
                                    <Check className="w-4 h-4" />
                                ) : (
                                    <Save className="w-4 h-4" />
                                )}
                                {isPending ? 'Saving...' : saved ? '✓ Saved' : 'Save Settings'}
                            </motion.button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}
