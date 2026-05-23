/**
 * Internal Medusa Events Webhook
 *
 * Receives event payloads from Medusa subscribers (order.placed, order.shipped,
 * low-stock-alert) and dispatches emails via the tenant's configured provider.
 *
 * Architecture: Medusa runs in a separate container and has no access to tenant
 * email config (stored in Supabase). This route bridges that gap — Medusa
 * subscribers POST here, and the storefront sends emails via `sendEmailForTenant()`.
 *
 * Security: Protected by `MEDUSA_EVENTS_SECRET` shared between Medusa and storefront.
 * Falls back to checking that the request comes from localhost (same Docker network).
 *
 * Zone: 🔴 LOCKED — platform infrastructure
 */

import { NextRequest, NextResponse } from 'next/server'
import { sendEmailForTenant, sendEmail, type EmailTemplate } from '@/lib/email'
import { getConfig } from '@/lib/config'
import { logger } from '@/lib/logger'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface MedusaEventPayload {
    event_type: 'order.placed' | 'order.shipped' | 'inventory.low_stock'
    data: Record<string, unknown>
}

async function sendMedusaEventEmail(
    tenantId: string | undefined,
    payload: Parameters<typeof sendEmail>[0],
) {
    if (tenantId) {
        await sendEmailForTenant(tenantId, payload)
        return
    }

    await sendEmail(payload)
}

function buildStoreMetadata(defaultCurrency: string) {
    return {
        storeName: process.env.NEXT_PUBLIC_STORE_NAME || 'Store',
        storeUrl: process.env.NEXT_PUBLIC_SITE_URL || '',
        defaultCurrency: defaultCurrency.toUpperCase(),
    }
}

async function handleOrderPlacedEvent(
    tenantId: string | undefined,
    appConfig: Awaited<ReturnType<typeof getConfig>>,
    data: Record<string, unknown>,
) {
    const { customer_email, display_id, total, currency, customer_name } = data as {
        customer_email?: string
        display_id?: number
        total?: number
        currency?: string
        customer_name?: string
    }

    if (!customer_email) {
        logger.warn('[medusa-events] order.placed: no customer email')
        return
    }

    const store = buildStoreMetadata(appConfig.config.default_currency)
    await sendMedusaEventEmail(tenantId, {
        to: customer_email,
        subject: `🎉 Order #${display_id || ''} Confirmed!`,
        template: 'order_confirmation' as EmailTemplate,
        data: {
            customerName: customer_name || customer_email.split('@')[0],
            orderId: String(display_id || ''),
            total: typeof total === 'number' ? (total / 100).toFixed(2) : '0.00',
            currency: currency?.toUpperCase() || store.defaultCurrency,
            storeName: store.storeName,
            storeUrl: store.storeUrl,
        },
    })

    logger.info('[medusa-events] order.placed email sent', { customer_email })
}

async function handleOrderShippedEvent(
    tenantId: string | undefined,
    data: Record<string, unknown>,
) {
    const {
        customer_email,
        display_id,
        tracking_numbers,
        customer_name,
    } = data as {
        customer_email?: string
        display_id?: number
        tracking_numbers?: string[]
        customer_name?: string
    }

    if (!customer_email) {
        logger.warn('[medusa-events] order.shipped: no customer email')
        return
    }

    const store = buildStoreMetadata('usd')
    await sendMedusaEventEmail(tenantId, {
        to: customer_email,
        subject: `📦 Order #${display_id || ''} Has Shipped!`,
        template: 'order_shipped' as EmailTemplate,
        data: {
            customerName: customer_name || customer_email.split('@')[0],
            orderId: String(display_id || ''),
            trackingUrl: tracking_numbers?.[0]
                ? `https://track.aftership.com/${tracking_numbers[0]}`
                : undefined,
            storeName: store.storeName,
            storeUrl: store.storeUrl,
        },
    })

    logger.info('[medusa-events] order.shipped email sent', { customer_email })
}

async function handleLowStockEvent(
    tenantId: string | undefined,
    data: Record<string, unknown>,
) {
    const {
        sku,
        title,
        available_stock,
        out_of_stock,
        owner_email,
    } = data as {
        sku?: string
        title?: string
        available_stock?: number
        out_of_stock?: boolean
        owner_email?: string
    }

    const recipientEmail = owner_email || process.env.STORE_OWNER_EMAIL
    if (!recipientEmail) {
        logger.warn('[medusa-events] low_stock: no owner email configured')
        return
    }

    await sendMedusaEventEmail(tenantId, {
        to: recipientEmail,
        subject: `📉 ${out_of_stock ? 'OUT OF STOCK' : 'Low Stock'}: ${title || sku || 'Unknown product'}`,
        template: 'low_stock_alert' as EmailTemplate,
        data: {
            title: title || 'Unknown',
            sku: sku || '',
            availableStock: available_stock ?? 0,
            outOfStock: out_of_stock || false,
            storeName: process.env.NEXT_PUBLIC_STORE_NAME || 'Store',
        },
    })

    logger.info('[medusa-events] low_stock alert sent', { recipientEmail, sku })
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
    // ── Auth: shared secret (MANDATORY) ──
    const secret = process.env.MEDUSA_EVENTS_SECRET
    if (!secret) {
        logger.error('[medusa-events] MEDUSA_EVENTS_SECRET is not configured — rejecting all requests')
        return NextResponse.json(
            { error: 'Webhook not configured. Set MEDUSA_EVENTS_SECRET.' },
            { status: 503 }
        )
    }

    const authHeader = request.headers.get('x-medusa-events-secret')
    if (authHeader !== secret) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let payload: MedusaEventPayload
    try {
        payload = await request.json()
    } catch {
        return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    if (!payload.event_type || !payload.data) {
        return NextResponse.json({ error: 'Missing event_type or data' }, { status: 400 })
    }

    const tenantId = process.env.TENANT_ID
    const appConfig = await getConfig()

    try {
        switch (payload.event_type) {
            case 'order.placed':
                await handleOrderPlacedEvent(tenantId, appConfig, payload.data)
                break

            case 'order.shipped':
                await handleOrderShippedEvent(tenantId, payload.data)
                break

            case 'inventory.low_stock':
                await handleLowStockEvent(tenantId, payload.data)
                break

            default:
                logger.warn('[medusa-events] Unhandled event type', { event_type: payload.event_type })
        }

        return NextResponse.json({ received: true })
    } catch (err) {
        logger.error('[medusa-events] Error processing event:', err)
        return NextResponse.json(
            { error: 'Processing error' },
            { status: 500 }
        )
    }
}
