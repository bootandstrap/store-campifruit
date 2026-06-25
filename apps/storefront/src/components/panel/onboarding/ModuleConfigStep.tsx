'use client'

/**
 * ModuleConfigStep — Per-module meaningful first-time configuration
 *
 * Shows a horizontal carousel/paginator of active module config cards.
 * Every module now has MEANINGFUL config or informational context:
 *   - ecommerce: currency, tax, stock, min order, free shipping, low stock + split limit bars + features
 *   - chatbot: name, tone (SOTA preview), welcome, knowledge scope, auto-open + msg limit
 *   - crm: auto-tag toggle, customer tag, notify toggle, email, export format + limits + features
 *   - email_marketing: sender name, email, reply-to, announcement bar, footer, cart delay + limits + features
 *   - i18n: (handled in Language Step — limit bars only)
 *   - pos: receipt header+footer, address, payment, tax display, tips, sound + limits + features
 *   - rrss: social links (Instagram, Facebook, TikTok, Twitter) + features
 *   - seo: meta title, meta description, GA ID, FB Pixel + features
 *   - auth_advanced: tier-aware auth provider matrix
 *   - automation: webhook notification email + info + features
 *   - capacidad: alert email, warning+critical thresholds, auto-upgrade + split limit bars
 *   - sales_channels: whatsapp, greeting, phone, preferred contact, hours, free shipping + limits + features
 *
 * New field types: 'limit_bar' (visual limit display), 'feature_list' (tier features)
 */

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, ChevronLeft, ChevronRight, ArrowRight, Settings2 } from 'lucide-react'
import { saveOnboardingConfigAction } from '@/app/[lang]/(panel)/panel/actions'
import type { ModuleInfo } from './types'
import { logger } from '@/lib/logger'
import { getModuleConfigFields } from './module-config-definitions'

interface ModuleConfigStepProps {
    modules: ModuleInfo[]
    config: Record<string, unknown>
    currency: string
    featureFlags: Record<string, boolean>
    planLimits: Record<string, number | string | null>
    onContinue: () => void
    onBack: () => void
    t: (key: string, fallback?: string) => string
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ModuleConfigStep({
    modules,
    config,
    currency,
    featureFlags,
    planLimits,
    onContinue,
    onBack,
    t,
}: ModuleConfigStepProps) {
    const [currentIdx, setCurrentIdx] = useState(0)
    const [direction, setDirection] = useState(0)
    const [values, setValues] = useState<Record<string, string>>(() => {
        // Pre-populate from current config
        const init: Record<string, string> = {}
        for (const [k, v] of Object.entries(config)) {
            if (typeof v === 'string') init[k] = v
            else if (typeof v === 'number') init[k] = String(v)
            else if (typeof v === 'boolean') init[k] = v ? 'true' : 'false'
        }
        return init
    })
    const [saving, setSaving] = useState(false)
    const [savedModules, setSavedModules] = useState<Set<string>>(new Set())

    const mod = modules[currentIdx]
    const fields = mod
        ? getModuleConfigFields(mod.key, t, planLimits as Record<string, number | string | null>, mod.tierFeatures)
        : []
    const hasEditableFields = fields.some(f => f.type !== 'info' && f.type !== 'limit_bar' && f.type !== 'feature_list')

    const handleFieldChange = useCallback((key: string, value: string) => {
        setValues(prev => ({ ...prev, [key]: value }))
    }, [])

    const handleToggle = useCallback((key: string) => {
        setValues(prev => ({
            ...prev,
            [key]: prev[key] === 'true' ? 'false' : 'true',
        }))
    }, [])

    const handleSaveModule = useCallback(async () => {
        if (!hasEditableFields) return // Info-only modules don't need saving

        setSaving(true)
        try {
            const updates: Record<string, unknown> = {}
            for (const field of fields) {
                if (field.type === 'info' || field.type === 'limit_bar' || field.type === 'feature_list') continue
                if (values[field.key] === undefined) continue

                if (field.type === 'toggle') {
                    updates[field.key] = values[field.key] === 'true'
                } else {
                    updates[field.key] = values[field.key]
                }
            }
            if (Object.keys(updates).length > 0) {
                await saveOnboardingConfigAction(updates)
            }
            setSavedModules(prev => new Set(prev).add(mod.key))
        } catch (err) {
            logger.warn('[ModuleConfigStep] Save failed:', err)
        }
        setSaving(false)
    }, [fields, values, hasEditableFields, mod?.key])

    const goNextModule = useCallback(async () => {
        // Auto-save if there are editable fields
        if (hasEditableFields && !savedModules.has(mod?.key)) {
            await handleSaveModule()
        }

        if (currentIdx < modules.length - 1) {
            setDirection(1)
            setCurrentIdx(prev => prev + 1)
        } else {
            onContinue()
        }
    }, [currentIdx, modules.length, hasEditableFields, savedModules, mod?.key, handleSaveModule, onContinue])

    const goPrevModule = useCallback(() => {
        if (currentIdx > 0) {
            setDirection(-1)
            setCurrentIdx(prev => prev - 1)
        } else {
            onBack()
        }
    }, [currentIdx, onBack])

    if (!mod) {
        onContinue()
        return null
    }

    return (
        <div className="px-6 py-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-brand-subtle flex items-center justify-center">
                        <Settings2 className="w-5 h-5 text-brand" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold font-display text-tx">
                            {t('onboarding.config.title', 'Configuración inicial')}
                        </h2>
                        <p className="text-xs text-tx-muted">
                            {t('onboarding.config.subtitle', 'Módulo {{current}} de {{total}}')
                                .replace('{{current}}', String(currentIdx + 1))
                                .replace('{{total}}', String(modules.length))}
                        </p>
                    </div>
                </div>

                {/* Module dots */}
                <div className="flex gap-1">
                    {modules.map((m, idx) => (
                        <div
                            key={m.key}
                            className={`w-2 h-2 rounded-full transition-all ${
                                idx === currentIdx
                                    ? 'bg-brand w-4'
                                    : savedModules.has(m.key)
                                        ? 'bg-brand/40'
                                        : 'bg-sf-3'
                            }`}
                        />
                    ))}
                </div>
            </div>

            {/* Module card */}
            <AnimatePresence initial={false} custom={direction} mode="wait">
                <motion.div
                    key={mod.key}
                    custom={direction}
                    initial={{ x: direction > 0 ? 200 : -200, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: direction < 0 ? 200 : -200, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    className="rounded-xl border border-sf-3 bg-sf-2/30 p-5 mb-4"
                >
                    {/* Module header */}
                    <div className="flex items-center gap-3 mb-4 pb-3 border-b border-sf-3">
                        <span className="text-2xl">{mod.icon}</span>
                        <div className="flex-1">
                            <div className="flex items-center gap-2">
                                <h3 className="text-base font-bold text-tx">{mod.name}</h3>
                                {mod.tierName && (
                                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-brand/10 text-brand">
                                        {mod.tierName}
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-tx-muted">{t(`onboarding.modules.desc.${mod.key}`, mod.description)}</p>
                        </div>
                        {savedModules.has(mod.key) && (
                            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/10 border border-green-500/20">
                                <Check className="w-3 h-3 text-green-500" />
                                <span className="text-[10px] font-medium text-green-500">
                                    {t('onboarding.config.saved', 'Guardado')}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Config fields — scrollable with gradient fade */}
                    <div className="space-y-3 max-h-[45vh] overflow-y-auto pr-1 scroll-smooth">
                        {fields.map((field) => {
                            // Info panel
                            if (field.type === 'info') {
                                return (
                                    <div
                                        key={field.key}
                                        className="p-3 rounded-lg bg-sf-2 border border-sf-3 text-xs text-tx-muted leading-relaxed"
                                    >
                                        {field.infoText}
                                    </div>
                                )
                            }

                            // Limit bar — visual plan limit display
                            if (field.type === 'limit_bar') {
                                return (
                                    <div
                                        key={field.key}
                                        className="p-3 rounded-lg bg-gradient-to-r from-brand-subtle/60 to-sf-2 border border-brand/10"
                                    >
                                        <p className="text-[10px] font-semibold text-tx-muted uppercase tracking-wider mb-1">
                                            {field.label}
                                        </p>
                                        <p className="text-xs font-medium text-tx tabular-nums">
                                            {field.limitLabel}
                                        </p>
                                    </div>
                                )
                            }

                            // Feature list — tier features display
                            if (field.type === 'feature_list') {
                                return (
                                    <div key={field.key}>
                                        <p className="text-[10px] font-semibold text-tx-muted uppercase tracking-wider mb-1.5">
                                            {field.label}
                                        </p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {field.features?.map(feat => (
                                                <span
                                                    key={feat}
                                                    className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-brand/5 border border-brand/10 text-[10px] font-medium text-tx-sec"
                                                >
                                                    <Check className="w-2.5 h-2.5 text-brand" />
                                                    {feat}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )
                            }

                            // Toggle
                            if (field.type === 'toggle') {
                                const isOn = values[field.key] === 'true'
                                return (
                                    <div key={field.key} className="flex items-center gap-3">
                                        <div
                                            role="switch"
                                            aria-checked={isOn}
                                            tabIndex={0}
                                            onClick={() => handleToggle(field.key)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' || e.key === ' ') handleToggle(field.key)
                                            }}
                                            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30 ${
                                                isOn ? 'bg-brand' : 'bg-sf-3'
                                            }`}
                                        >
                                            <span
                                                className={`inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                                                    isOn ? 'translate-x-5' : 'translate-x-0'
                                                }`}
                                            />
                                        </div>
                                        <label
                                            className="text-xs font-semibold text-tx-sec cursor-pointer"
                                            onClick={() => handleToggle(field.key)}
                                        >
                                            {field.label}
                                        </label>
                                    </div>
                                )
                            }

                            // Select
                            if (field.type === 'select') {
                                return (
                                    <div key={field.key}>
                                        <label className="block text-xs font-semibold text-tx-sec mb-1.5">
                                            {field.label}
                                        </label>
                                        <select
                                            value={values[field.key] || ''}
                                            onChange={e => handleFieldChange(field.key, e.target.value)}
                                            className="w-full px-3 py-2 rounded-lg border border-sf-3 bg-sf-1 text-sm text-tx focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
                                        >
                                            {field.options?.map(opt => (
                                                <option key={opt.value} value={opt.value}>
                                                    {opt.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )
                            }

                            // Number input
                            if (field.type === 'number') {
                                return (
                                    <div key={field.key}>
                                        <label className="block text-xs font-semibold text-tx-sec mb-1.5">
                                            {field.label}
                                        </label>
                                        <input
                                            type="number"
                                            inputMode="decimal"
                                            min="0"
                                            step="any"
                                            value={values[field.key] || ''}
                                            onChange={e => handleFieldChange(field.key, e.target.value)}
                                            placeholder={field.placeholder}
                                            className="w-full px-3 py-2 rounded-lg border border-sf-3 bg-sf-1 text-sm text-tx placeholder:text-tx-faint focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand tabular-nums"
                                        />
                                    </div>
                                )
                            }

                            // Text input (default)
                            return (
                                <div key={field.key}>
                                    <label className="block text-xs font-semibold text-tx-sec mb-1.5">
                                        {field.label}
                                    </label>
                                    <input
                                        type="text"
                                        value={values[field.key] || ''}
                                        onChange={e => handleFieldChange(field.key, e.target.value)}
                                        placeholder={field.placeholder}
                                        className="w-full px-3 py-2 rounded-lg border border-sf-3 bg-sf-1 text-sm text-tx placeholder:text-tx-faint focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
                                    />
                                </div>
                            )
                        })}
                    </div>
                </motion.div>
            </AnimatePresence>

            {/* Footer nav */}
            <div className="flex justify-between items-center">
                <button
                    type="button"
                    onClick={goPrevModule}
                    className="inline-flex items-center gap-1 text-sm text-tx-muted hover:text-tx transition-colors"
                >
                    <ChevronLeft className="w-4 h-4" />
                    {currentIdx === 0
                        ? t('onboarding.back', 'Volver')
                        : modules[currentIdx - 1]?.name
                    }
                </button>

                <div className="flex items-center gap-2">
                    {hasEditableFields && !savedModules.has(mod.key) && (
                        <button
                            type="button"
                            onClick={() => {
                                // Skip this module without saving
                                if (currentIdx < modules.length - 1) {
                                    setDirection(1)
                                    setCurrentIdx(prev => prev + 1)
                                } else {
                                    onContinue()
                                }
                            }}
                            className="text-xs text-tx-faint hover:text-tx-muted transition-colors"
                        >
                            {t('onboarding.config.skip', 'Configurar después')}
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={goNextModule}
                        disabled={saving}
                        className="btn btn-primary inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                    >
                        {saving ? (
                            t('onboarding.saving', 'Guardando...')
                        ) : currentIdx === modules.length - 1 ? (
                            <>{t('onboarding.finish', 'Finalizar')} <ArrowRight className="w-4 h-4" /></>
                        ) : (
                            <>{t('onboarding.next', 'Siguiente')} <ChevronRight className="w-4 h-4" /></>
                        )}
                    </button>
                </div>
            </div>
        </div>
    )
}
