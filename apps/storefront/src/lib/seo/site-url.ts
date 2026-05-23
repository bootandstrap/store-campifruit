import 'server-only'

import { headers } from 'next/headers'

function stripTrailingSlash(value: string): string {
    return value.replace(/\/+$/, '')
}

export function normalizeSiteUrl(value: string | null | undefined): string {
    if (!value) return ''

    const trimmed = value.trim()
    if (!trimmed) return ''

    try {
        return stripTrailingSlash(new URL(trimmed).toString())
    } catch {
        return ''
    }
}

export function resolveSiteUrlFromHeaders(
    headerSource: Pick<Headers, 'get'>,
): string {
    const forwardedHost = headerSource.get('x-forwarded-host')
    const host = forwardedHost || headerSource.get('host')

    if (!host) return ''

    const protoHeader = headerSource.get('x-forwarded-proto')
    const protocol = protoHeader === 'http' ? 'http' : 'https'

    return normalizeSiteUrl(`${protocol}://${host}`)
}

export async function getCanonicalSiteUrl(): Promise<string> {
    const envUrl = normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL)
    if (envUrl) return envUrl

    const headerStore = await headers()
    return resolveSiteUrlFromHeaders(headerStore)
}

export function appendPath(siteUrl: string, path: string): string {
    const normalizedBase = normalizeSiteUrl(siteUrl)
    if (!normalizedBase) return ''

    const normalizedPath = path.startsWith('/') ? path : `/${path}`
    return `${normalizedBase}${normalizedPath}`
}
