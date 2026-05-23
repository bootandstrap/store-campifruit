import { describe, expect, it } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'

const ROOT = join(__dirname, '..', '..')
const DICT_DIR = join(ROOT, 'lib', 'i18n', 'dictionaries')

function read(relPath: string): string {
    return readFileSync(join(ROOT, relPath), 'utf-8')
}

function loadDict(locale: string): Record<string, unknown> {
    return JSON.parse(readFileSync(join(DICT_DIR, `${locale}.json`), 'utf-8'))
}

const REQUIRED_PANEL_KEYS = [
    'panel.dashboard.viewStorefront',
    'panel.chart.last30',
    'panel.chart.noData',
    'panel.governance.modules',
    'panel.governance.limitAlerts',
    'panel.governance.allClear',
    'panel.governance.trial',
    'panel.governance.active',
    'panel.tabs.promotions',
    'panel.config.stockMode',
    'panel.config.stockAlwaysAvailable',
    'panel.config.stockAlwaysDesc',
    'panel.config.stockManaged',
    'panel.config.stockManagedDesc',
]

describe('panel/storefront audit regressions', () => {
    it('keeps the required owner-panel i18n keys in every shipped locale', () => {
        for (const locale of ['en', 'es', 'de', 'fr', 'it']) {
            const dict = loadDict(locale)
            for (const key of REQUIRED_PANEL_KEYS) {
                expect(dict[key], `${locale}.json is missing ${key}`).toBeTruthy()
            }
        }
    })

    it('does not hardcode the channel filter label in orders', () => {
        const ordersClient = read('app/[lang]/(panel)/panel/pedidos/OrdersClient.tsx')
        expect(ordersClient).not.toContain("label: 'All'")
        expect(ordersClient).toContain('labels.all')
    })

    it('falls back to a stable order id suffix when display_id is missing', () => {
        const ordersClient = read('app/[lang]/(panel)/panel/pedidos/OrdersClient.tsx')
        expect(ordersClient).toContain('function getOrderDisplayLabel')
        expect(ordersClient).toContain('return displayId || order.id.slice(-6)')
    })

    it('gates public WhatsApp contact links on a real configured number', () => {
        const header = read('components/layout/Header.tsx')
        expect(header).toContain('featureFlags.enable_whatsapp_contact && config.whatsapp_number')
    })

    it('computes sidebar readiness independently of onboarding completion', () => {
        const layout = read('app/[lang]/(panel)/layout.tsx')
        const readinessIdx = layout.indexOf('readiness = await calculateStoreReadiness(tenantId, lang)')
        const onboardingGateIdx = layout.indexOf('if (config.onboarding_completed) {')

        expect(readinessIdx).toBeGreaterThan(-1)
        expect(onboardingGateIdx).toBeGreaterThan(-1)
        expect(readinessIdx).toBeLessThan(onboardingGateIdx)
    })

    it('localizes the sidebar health label instead of hardcoding English text', () => {
        const sidebar = read('components/panel/PanelSidebar.tsx')
        expect(sidebar).toContain('{labels.health}')
        expect(sidebar).not.toContain('>Health<')
    })

    it('translates sidebar sub-item labels instead of rendering raw i18n keys', () => {
        const sidebar = read('components/panel/PanelSidebar.tsx')
        const layout = read('app/[lang]/(panel)/layout.tsx')

        expect(sidebar).toContain("translationMap[sub.label] ?? sub.label")
        expect(layout).toContain("key.startsWith('panel.tabs.')")
    })

    it('resolves achievement toast labels through the achievement registry', () => {
        const provider = read('components/panel/AchievementProvider.tsx')

        expect(provider).toContain("import { getAchievementDef } from '@/lib/achievements'")
        expect(provider).toContain('const definition = getAchievementDef(id)')
        expect(provider).toContain('title: (titleKey && achievementLabels[titleKey]) || id')
    })

    it('orders owner carousel data by sort_order instead of a legacy position field', () => {
        const dataFetcher = read('app/[lang]/(panel)/panel/mi-tienda/data.ts')

        expect(dataFetcher).toContain(".order('sort_order', { ascending: true })")
        expect(dataFetcher).not.toContain(".order('position', { ascending: true })")
    })

    it('ships a concrete base migration for carousel_slides', () => {
        const migration = readFileSync(
            join(ROOT, '..', '..', '..', 'supabase', 'migrations', '20260523_carousel_slides_base.sql'),
            'utf-8'
        )

        expect(migration).toContain('CREATE TABLE IF NOT EXISTS public.carousel_slides')
        expect(migration).toContain('CREATE POLICY "carousel_slides_select_public"')
        expect(migration).toContain('tenant_id UUID NOT NULL')
        expect(migration).toContain('sort_order INTEGER NOT NULL DEFAULT 0')
    })

    it('prepares a writable next cache directory for the runtime user', () => {
        const dockerfile = readFileSync(
            join(ROOT, '..', '..', '..', 'apps', 'storefront', 'Dockerfile'),
            'utf-8'
        )

        expect(dockerfile).toContain('COPY --from=builder --chown=nextjs:nodejs')
        expect(dockerfile).toContain('mkdir -p ./apps/storefront/.next/cache')
        expect(dockerfile).toContain('chown -R nextjs:nodejs /app')
    })

    it('runs Lighthouse from the storefront package in the monorepo', () => {
        const lhci = readFileSync(
            join(ROOT, '..', '..', '..', 'apps', 'storefront', 'lighthouserc.json'),
            'utf-8'
        )

        expect(lhci).toContain('cd apps/storefront/.next/standalone')
        expect(lhci).toContain('cp -R ../static apps/storefront/.next/static')
        expect(lhci).toContain('cp -R ../../public apps/storefront/public')
        expect(lhci).toContain('node apps/storefront/server.js')
        expect(lhci).not.toContain('"startServerCommand": "pnpm start"')
    })

    it('keeps GitHub workflow guards in a single valid if expression', () => {
        const ciWorkflow = readFileSync(
            join(ROOT, '..', '..', '..', '.github', 'workflows', 'ci.yml'),
            'utf-8'
        )
        const medusaWorkflow = readFileSync(
            join(ROOT, '..', '..', '..', '.github', 'workflows', 'build-medusa.yml'),
            'utf-8'
        )
        const lighthouseWorkflow = readFileSync(
            join(ROOT, '..', '..', '..', '.github', 'workflows', 'lighthouse-ci.yml'),
            'utf-8'
        )

        expect(ciWorkflow).toContain("if: github.repository != 'bootandstrap/storefront-template' && github.event_name == 'pull_request'")
        expect(ciWorkflow).toContain("if: github.repository != 'bootandstrap/storefront-template' && failure()")
        expect(medusaWorkflow).toContain('DOKPLOY_MEDUSA_APP_ID not configured')
        expect(medusaWorkflow).not.toContain("if: ${{ secrets.DOKPLOY_MEDUSA_APP_ID != '' }}")
        expect(lighthouseWorkflow).toContain("workflows: ['Build & Deploy Storefront']")
        expect(lighthouseWorkflow).toContain("github.repository != 'bootandstrap/storefront-template' && (github.event_name == 'workflow_dispatch' || github.event.workflow_run.conclusion == 'success')")
        expect(lighthouseWorkflow).toContain('configPath: ./apps/storefront/lighthouserc.deploy.json')
        expect(lighthouseWorkflow).toContain('steps.lighthouse.outputs.assertionResults')
    })
})
