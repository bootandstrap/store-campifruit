import { NextResponse } from 'next/server'

function getMessage(error: unknown): string | null {
    return error instanceof Error ? error.message : null
}

export function toPanelErrorResponse(
    error: unknown,
    _fallbackMessage = 'Internal error'
): NextResponse | null {
    const message = getMessage(error)

    if (!message) {
        return null
    }

    if (message === 'Not authenticated') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (
        message === 'Insufficient permissions'
        || message.includes('requires a tenant_id')
        || message.startsWith('Feature "')
    ) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (message.startsWith('Plan limit reached:')) {
        return NextResponse.json({ error: 'Plan limit reached' }, { status: 429 })
    }

    return null
}
