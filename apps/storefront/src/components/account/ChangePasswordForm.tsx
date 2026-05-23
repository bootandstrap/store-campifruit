'use client'

import { useState, useCallback, type ReactNode } from 'react'
import { Lock, Eye, EyeOff, Check, AlertCircle, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useI18n } from '@/lib/i18n/provider'

function getPasswordStrength(password: string): number {
    if (!password) return 0
    let score = 0
    if (password.length >= 8) score++
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++
    if (/\d/.test(password)) score++
    if (/[^a-zA-Z0-9]/.test(password)) score++
    return score
}

function PasswordField({
    label,
    value,
    onChange,
    show,
    onToggle,
    autoComplete,
    minLength,
}: {
    label: string
    value: string
    onChange: (value: string) => void
    show: boolean
    onToggle: () => void
    autoComplete: string
    minLength?: number
}) {
    return (
        <div>
            <label className="text-xs text-tx-muted font-medium mb-1.5 block">
                {label}
            </label>
            <div className="relative">
                <input
                    type={show ? 'text' : 'password'}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm rounded-xl border border-sf-3 bg-sf-0 focus:outline-none focus:ring-1 focus:ring-brand pr-10"
                    autoComplete={autoComplete}
                    minLength={minLength}
                />
                <button
                    type="button"
                    onClick={onToggle}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-tx-muted hover:text-tx transition-colors"
                >
                    {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
            </div>
        </div>
    )
}

function PasswordStrengthMeter({
    password,
    strength,
    strengthColor,
    strengthLabel,
}: {
    password: string
    strength: number
    strengthColor: string
    strengthLabel: string
}) {
    if (!password) return null

    return (
        <div className="mt-2 space-y-1">
            <div className="flex gap-1">
                {[1, 2, 3, 4].map(i => (
                    <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-colors ${i <= strength ? strengthColor : 'bg-sf-3'}`}
                    />
                ))}
            </div>
            <p className="text-xs text-tx-muted">{strengthLabel}</p>
        </div>
    )
}

function StatusAlert({
    tone,
    icon,
    message,
}: {
    tone: 'error' | 'success'
    icon: ReactNode
    message: string
}) {
    const styles = tone === 'error'
        ? 'text-red-400 bg-red-500/10'
        : 'text-green-500 bg-green-500/10'

    return (
        <div className={`flex items-center gap-2 text-xs p-3 rounded-xl ${styles}`}>
            {icon}
            {message}
        </div>
    )
}

export default function ChangePasswordForm() {
    const { t } = useI18n()
    const [currentPassword, setCurrentPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showCurrent, setShowCurrent] = useState(false)
    const [showNew, setShowNew] = useState(false)
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const strength = getPasswordStrength(newPassword)
    const strengthLabel = ['', t('password.weak') || 'Weak', t('password.fair') || 'Fair', t('password.good') || 'Good', t('password.strong') || 'Strong'][strength] || ''
    const strengthColor = ['bg-sf-3', 'bg-red-500', 'bg-amber-500', 'bg-blue-500', 'bg-green-500'][strength]

    const isValid = newPassword.length >= 8 && newPassword === confirmPassword && currentPassword.length > 0
    const confirmPasswordMismatch = Boolean(confirmPassword && confirmPassword !== newPassword)

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault()
        if (!isValid) return

        setLoading(true)
        setError(null)
        setSuccess(false)

        try {
            const supabase = createClient()

            // Supabase does not expose "verify current password + update" in a single call.
            // We reauthenticate by signing in again with the current password, then update.
            const { data: { user } } = await supabase.auth.getUser()
            if (!user?.email) throw new Error('No user session')

            // Verify current password
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email: user.email,
                password: currentPassword,
            })

            if (signInError) {
                setError(t('password.currentIncorrect') || 'Current password is incorrect')
                return
            }

            // Update password
            const { error: updateError } = await supabase.auth.updateUser({
                password: newPassword,
            })

            if (updateError) throw new Error(updateError.message)

            setSuccess(true)
            setCurrentPassword('')
            setNewPassword('')
            setConfirmPassword('')
            setTimeout(() => setSuccess(false), 3000)
        } catch (err) {
            setError(err instanceof Error ? err.message : t('common.genericError') || 'Something went wrong')
        } finally {
            setLoading(false)
        }
    }, [isValid, currentPassword, newPassword, t])

    return (
        <div className="glass rounded-2xl p-6">
            <h2 className="text-sm font-semibold text-tx flex items-center gap-2 mb-4">
                <Lock className="w-4 h-4 text-brand" />
                {t('password.changeTitle') || 'Change Password'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
                <PasswordField
                    label={t('password.current') || 'Current Password'}
                    value={currentPassword}
                    onChange={setCurrentPassword}
                    show={showCurrent}
                    onToggle={() => setShowCurrent(!showCurrent)}
                    autoComplete="current-password"
                />

                <div>
                    <PasswordField
                        label={t('password.new') || 'New Password'}
                        value={newPassword}
                        onChange={setNewPassword}
                        show={showNew}
                        onToggle={() => setShowNew(!showNew)}
                        autoComplete="new-password"
                        minLength={8}
                    />
                    <PasswordStrengthMeter
                        password={newPassword}
                        strength={strength}
                        strengthColor={strengthColor}
                        strengthLabel={strengthLabel}
                    />
                </div>

                {/* Confirm password */}
                <div>
                    <label className="text-xs text-tx-muted font-medium mb-1.5 block">
                        {t('password.confirm') || 'Confirm New Password'}
                    </label>
                    <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className={`w-full px-3 py-2.5 text-sm rounded-xl border bg-sf-0 focus:outline-none focus:ring-1 focus:ring-brand ${
                            confirmPasswordMismatch
                                ? 'border-red-500'
                                : 'border-sf-3'
                        }`}
                        autoComplete="new-password"
                    />
                    {confirmPasswordMismatch && (
                        <p className="text-xs text-red-400 mt-1">
                            {t('password.mismatch') || 'Passwords do not match'}
                        </p>
                    )}
                </div>

                {/* Error / Success */}
                {error && (
                    <StatusAlert
                        tone="error"
                        icon={<AlertCircle className="w-4 h-4 shrink-0" />}
                        message={error}
                    />
                )}

                {success && (
                    <StatusAlert
                        tone="success"
                        icon={<Check className="w-4 h-4 shrink-0" />}
                        message={t('password.success') || 'Password changed successfully!'}
                    />
                )}

                {/* Submit */}
                <button
                    type="submit"
                    disabled={!isValid || loading}
                    className="btn btn-primary w-full text-sm"
                >
                    {loading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <Lock className="w-4 h-4" />
                    )}
                    {t('password.changeButton') || 'Update Password'}
                </button>
            </form>
        </div>
    )
}
