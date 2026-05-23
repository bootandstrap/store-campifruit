/**
 * Analytics API route — server-side proxy
 *
 * Replaces direct client-side Supabase inserts with a validated server endpoint.
 * Benefits:
 *   - tenant_id injected server-side (trusted, not from client)
 *   - event_type whitelisted
 *   - payload size limited
 *   - basic rate-limiting by IP
 */

import { NextRequest, NextResponse } from 'next/server'
import { getClientIp } from '@/lib/security/get-client-ip'
import { createSmartRateLimiter } from '@/lib/security/rate-limit-factory'
import { createAdminClient } from '@/lib/supabase/admin'
import { ANALYTICS_EVENT_SET } from '@/lib/registries/analytics-events'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const MAX_PROPERTIES_SIZE = 4096 // bytes
const MAX_BATCH_SIZE = 50
const analyticsLimiter = createSmartRateLimiter({
    limit: 60,
    windowMs: 60_000,
    name: 'api-analytics',
})

type IncomingAnalyticsEvent = {
    event_type?: unknown
    properties?: unknown
    page_url?: unknown
    referrer?: unknown
}

// ---------------------------------------------------------------------------
// POST /api/analytics
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
    try {
        // Rate limit by IP
        const ip = getClientIp(request)

        if (await analyticsLimiter.isLimited(ip)) {
            return NextResponse.json(
                { error: 'rate_limited' },
                { status: 429 }
            )
        }

        // Parse body
        const body = await request.json().catch(() => null)
        if (!body || typeof body !== 'object') {
            return NextResponse.json(
                { error: 'invalid_body' },
                { status: 400 }
            )
        }

        const events = Array.isArray((body as { events?: unknown[] }).events)
            ? (body as { events: IncomingAnalyticsEvent[] }).events
            : [body as IncomingAnalyticsEvent]

        if (events.length === 0 || events.length > MAX_BATCH_SIZE) {
            return NextResponse.json(
                { error: 'invalid_batch_size' },
                { status: 400 }
            )
        }

        // Server-side tenant_id injection (trusted)
        const tenantId = process.env.TENANT_ID
        if (!tenantId) {
            return NextResponse.json(
                { error: 'analytics_unavailable' },
                { status: 503 }
            )
        }

        // Use service-role client for trusted insert.
        const supabase = createAdminClient()

        const rows = []
        for (const event of events) {
            if (!ANALYTICS_EVENT_SET.has(String(event.event_type ?? ''))) {
                return NextResponse.json(
                    { error: 'invalid_event_type' },
                    { status: 400 }
                )
            }

            const properties = event.properties && typeof event.properties === 'object'
                ? event.properties
                : {}
            const propsStr = JSON.stringify(properties)
            if (propsStr.length > MAX_PROPERTIES_SIZE) {
                return NextResponse.json(
                    { error: 'properties_too_large' },
                    { status: 400 }
                )
            }

            rows.push({
                event_type: String(event.event_type),
                properties,
                page_url: typeof event.page_url === 'string' ? event.page_url.slice(0, 2048) : null,
                referrer: typeof event.referrer === 'string' ? event.referrer.slice(0, 2048) : null,
                tenant_id: tenantId,
            })
        }

        const { error: insertError } = await supabase.from('analytics_events').insert(rows as never)

        if (insertError) {
            logger.error('[analytics] insert failed:', insertError.message)
            return NextResponse.json(
                { error: 'analytics_insert_failed' },
                { status: 500 }
            )
        }

        return NextResponse.json({ ok: true })
    } catch (err) {
        logger.error('[analytics] request failed:', err)
        return NextResponse.json(
            { error: 'analytics_unavailable' },
            { status: 503 }
        )
    }
}

// Support GET for telemetry health/probe checks (avoid 405)
export async function GET() {
    return NextResponse.json({ status: 'analytics_endpoint_ready' })
}
