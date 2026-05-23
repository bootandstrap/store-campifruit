import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { CRM_MODULE } from "../../../../modules/crm"
import type CrmModuleService from "../../../../modules/crm/service"

type CrmInteractionType = "order" | "email" | "call" | "note" | "support" | "visit" | "other"

const CRM_INTERACTION_TYPES = new Set<CrmInteractionType>([
    "order",
    "email",
    "call",
    "note",
    "support",
    "visit",
    "other",
])

function normalizeInteractionType(value: string): CrmInteractionType {
    return CRM_INTERACTION_TYPES.has(value as CrmInteractionType)
        ? (value as CrmInteractionType)
        : "note"
}

/**
 * GET /admin/crm/interactions
 * List interactions, optionally filtered by contact_id
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
    const { contact_id, type } = req.query as Record<string, string>
    const service = req.scope.resolve(CRM_MODULE) as CrmModuleService

    const filters: Record<string, unknown> = {}
    if (contact_id) filters.contact_id = contact_id
    if (type) filters.type = type

    const interactions = await service.listCrmInteractions(filters, {
        order: { created_at: "DESC" },
        take: 200,
    })

    res.json({ interactions })
}

/**
 * POST /admin/crm/interactions
 * Log a new CRM interaction
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
    const body = req.body as {
        contact_id: string
        type: string
        subject?: string
        notes?: string
        channel?: string
    }

    if (!body.contact_id || !body.type) {
        return res.status(400).json({ message: "contact_id and type are required" })
    }

    const service = req.scope.resolve(CRM_MODULE) as CrmModuleService
    const interactionType = normalizeInteractionType(body.type)

    const interaction = await service.createCrmInteractions({
        contact_id: body.contact_id,
        type: interactionType,
        summary: body.subject ?? interactionType,
        content: body.notes ?? null,
        initiated_by: "operator" as const,
    })

    res.status(201).json({ interaction })
}
