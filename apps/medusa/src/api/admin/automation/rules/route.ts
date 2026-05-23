import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { AUTOMATION_MODULE } from "../../../../modules/automation"
import type AutomationModuleService from "../../../../modules/automation/service"

type AutomationActionType =
    | "send_email"
    | "send_webhook"
    | "update_crm"
    | "add_tag"
    | "create_note"
    | "notify_owner"
    | "custom"

const AUTOMATION_ACTION_TYPES = new Set<AutomationActionType>([
    "send_email",
    "send_webhook",
    "update_crm",
    "add_tag",
    "create_note",
    "notify_owner",
    "custom",
])

function normalizeAutomationStatus(status?: string): boolean | undefined {
    if (status === "active") return true
    if (status === "inactive") return false
    return undefined
}

function normalizeActionType(value: unknown): AutomationActionType {
    return typeof value === "string" && AUTOMATION_ACTION_TYPES.has(value as AutomationActionType)
        ? (value as AutomationActionType)
        : "custom"
}

/**
 * GET /admin/automation/rules
 * List automation rules with optional filters
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
    const { status, trigger_event } = req.query as Record<string, string>
    const service = req.scope.resolve(AUTOMATION_MODULE) as AutomationModuleService

    const filters: Record<string, unknown> = {}
    const isActive = normalizeAutomationStatus(status)
    if (isActive !== undefined) filters.is_active = isActive
    if (trigger_event) filters.trigger_event = trigger_event

    const rules = await service.listAutomationRules(filters, {
        order: { created_at: "DESC" },
        take: 100,
    })

    res.json({ rules })
}

/**
 * POST /admin/automation/rules
 * Create a new automation rule
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
    const body = req.body as {
        name: string
        trigger_event: string
        description?: string
        conditions?: Record<string, unknown>
        actions: Record<string, unknown>[]
    }

    if (!body.name || !body.trigger_event || !body.actions?.length) {
        return res.status(400).json({ message: "name, trigger_event, and actions are required" })
    }

    const service = req.scope.resolve(AUTOMATION_MODULE) as AutomationModuleService
    const primaryAction = body.actions[0] ?? {}

    const rule = await service.createAutomationRules({
        name: body.name,
        description: body.description ?? null,
        trigger_event: body.trigger_event,
        conditions: body.conditions ?? null,
        is_active: true,
        action_type: normalizeActionType(primaryAction.type),
        action_config: primaryAction,
    })

    res.status(201).json({ rule })
}
