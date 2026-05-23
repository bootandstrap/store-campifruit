import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { CRM_MODULE } from "../../../../modules/crm"
import type CrmModuleService from "../../../../modules/crm/service"

type CrmSource = "organic" | "referral" | "social" | "ads" | "direct" | "other"
type CrmStage = "lead" | "prospect" | "customer" | "churned" | "vip"

const CRM_SOURCES = new Set<CrmSource>(["organic", "referral", "social", "ads", "direct", "other"])
const CRM_STAGES = new Set<CrmStage>(["lead", "prospect", "customer", "churned", "vip"])

function normalizeCrmSource(value?: string): CrmSource {
    return value && CRM_SOURCES.has(value as CrmSource) ? (value as CrmSource) : "other"
}

function normalizeCrmStage(value?: string): CrmStage {
    return value && CRM_STAGES.has(value as CrmStage) ? (value as CrmStage) : "lead"
}

/**
 * GET /admin/crm/contacts
 * List CRM contacts with optional filters
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
    const { stage, source } = req.query as Record<string, string>
    const service = req.scope.resolve(CRM_MODULE) as CrmModuleService

    const filters: Record<string, unknown> = {}
    if (stage) filters.stage = stage
    if (source) filters.source = source

    const contacts = await service.listCrmContacts(filters, {
        order: { created_at: "DESC" },
        take: 200,
    })

    res.json({ contacts })
}

/**
 * POST /admin/crm/contacts
 * Create a new CRM contact
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
    const body = req.body as {
        first_name?: string
        last_name?: string
        email?: string
        phone?: string
        company?: string
        source?: string
        stage?: string
        tags?: string[]
    }

    if (!body.email?.trim()) {
        return res.status(400).json({ message: "email is required" })
    }

    const service = req.scope.resolve(CRM_MODULE) as CrmModuleService

    const fullName = [body.first_name?.trim(), body.last_name?.trim()].filter(Boolean).join(" ")
    const contact = await service.createCrmContacts({
        email: body.email.trim(),
        full_name: fullName || null,
        phone: body.phone?.trim() || null,
        company: body.company?.trim() || null,
        source: normalizeCrmSource(body.source),
        stage: normalizeCrmStage(body.stage),
        tags: (body.tags ?? null) as unknown as Record<string, unknown> | null,
    })

    res.status(201).json({ contact })
}
