import { NextRequest, NextResponse } from 'next/server'
import { withPanelGuard } from '@/lib/panel-guard'
import { createAdminClient } from '@/lib/supabase/admin'
import { withRateLimit, PANEL_GUARD } from '@/lib/security/api-rate-guard'
import { getDashboardKPIs, getRevenueTimeline, getTopProducts } from '@/lib/analytics/dashboard-queries'
import { toPanelErrorResponse } from '@/lib/panel-api-errors'
import { logger } from '@/lib/logger'

type AnalyticsPeriod = '7d' | '30d' | '90d'

function normalizePeriod(rawPeriod: string | null): AnalyticsPeriod {
    return rawPeriod === '7d' || rawPeriod === '90d' ? rawPeriod : '30d'
}

function getDays(period: AnalyticsPeriod): number {
    return period === '7d' ? 7 : period === '90d' ? 90 : 30
}

/**
 * GET /api/panel/analytics
 *
 * Returns dashboard analytics for the authenticated tenant.
 * Rate limited via platform-wide API rate guard.
 */
export async function GET(req: NextRequest) {
    try {
        const rateLimitResult = await withRateLimit(req, PANEL_GUARD)
        if (rateLimitResult.limited) return rateLimitResult.response!

        const { tenantId } = await withPanelGuard()
        const admin = createAdminClient()
        const { searchParams } = new URL(req.url)
        const period = normalizePeriod(searchParams.get('period'))
        const days = getDays(period)
        const fallbackSince = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

        // Fetch in parallel
        const [kpis, revenueTimeline, topProducts, customerCount, storageUsage] =
            await Promise.allSettled([
                getDashboardKPIs(tenantId, period),
                getRevenueTimeline(tenantId, period),
                getTopProducts(tenantId, period),
                fetchCustomerCount(admin, tenantId),
                fetchStorageUsage(admin, tenantId),
            ])

        const periodSince = kpis.status === 'fulfilled' ? kpis.value.periodStart : fallbackSince
        const revenue = kpis.status === 'fulfilled'
            ? {
                total: kpis.value.revenue,
                orderCount: kpis.value.orders,
                averageOrderValue: kpis.value.averageOrderValue,
            }
            : null
        const orderTrend = revenueTimeline.status === 'fulfilled'
            ? revenueTimeline.value.map((point) => ({ date: point.date, orders: point.orderCount }))
            : []
        const topProductsData = topProducts.status === 'fulfilled'
            ? topProducts.value.map((product) => ({ name: product.productName, views: product.views }))
            : []

        return NextResponse.json({
            period: { days, since: periodSince },
            revenue,
            orderTrend,
            topProducts: topProductsData,
            customers: customerCount.status === 'fulfilled' ? customerCount.value : null,
            storage: storageUsage.status === 'fulfilled' ? storageUsage.value : null,
        })
    } catch (error) {
        const response = toPanelErrorResponse(error)
        if (response) return response

        logger.error('[analytics] Error:', error)
        return NextResponse.json({ error: 'Internal error' }, { status: 500 })
    }
}

async function fetchCustomerCount(admin: ReturnType<typeof createAdminClient>, tenantId: string) {
    const { count: total } = await (admin as any)
        .from('analytics_events')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .eq('event_type', 'customer_registered')

    // This month
    const monthStart = new Date()
    monthStart.setDate(1)
    monthStart.setHours(0, 0, 0, 0)
    const { count: thisMonth } = await (admin as any)
        .from('analytics_events')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .eq('event_type', 'customer_registered')
        .gte('created_at', monthStart.toISOString())

    return { total: total || 0, thisMonth: thisMonth || 0 }
}

async function fetchStorageUsage(admin: ReturnType<typeof createAdminClient>, tenantId: string) {
    try {
        const { data } = await (admin as any).rpc('get_tenant_storage_usage', {
            p_tenant_id: tenantId,
        })
        return data || null
    } catch {
        return null
    }
}
