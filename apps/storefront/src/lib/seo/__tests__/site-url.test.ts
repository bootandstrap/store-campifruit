import { describe, expect, it } from 'vitest'

import { appendPath, normalizeSiteUrl, resolveSiteUrlFromHeaders } from '../site-url'

describe('site-url helpers', () => {
    it('normalizes valid absolute URLs and strips trailing slashes', () => {
        expect(normalizeSiteUrl('https://campifruit.bootandstrap.com/')).toBe(
            'https://campifruit.bootandstrap.com',
        )
    })

    it('rejects invalid or relative URLs', () => {
        expect(normalizeSiteUrl('/es')).toBe('')
        expect(normalizeSiteUrl('')).toBe('')
    })

    it('builds canonical URLs from forwarded headers', () => {
        const headerSource = new Headers({
            'x-forwarded-host': 'campifruit.bootandstrap.com',
            'x-forwarded-proto': 'https',
        })

        expect(resolveSiteUrlFromHeaders(headerSource)).toBe(
            'https://campifruit.bootandstrap.com',
        )
    })

    it('falls back to host header and defaults protocol to https', () => {
        const headerSource = new Headers({
            host: 'campifruit.bootandstrap.com',
        })

        expect(resolveSiteUrlFromHeaders(headerSource)).toBe(
            'https://campifruit.bootandstrap.com',
        )
    })

    it('appends paths without duplicating slashes', () => {
        expect(appendPath('https://campifruit.bootandstrap.com/', '/es/productos')).toBe(
            'https://campifruit.bootandstrap.com/es/productos',
        )
    })
})
