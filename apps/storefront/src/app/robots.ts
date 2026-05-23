import type { MetadataRoute } from 'next'
import { appendPath, getCanonicalSiteUrl } from '@/lib/seo/site-url'

export default async function robots(): Promise<MetadataRoute.Robots> {
    const baseUrl = await getCanonicalSiteUrl()

    return {
        rules: [
            {
                userAgent: '*',
                allow: '/',
                disallow: [
                    '/api/',
                    '/auth/',
                    '/*/carrito',
                    '/*/checkout',
                    '/*/cuenta/',
                    '/*/panel/',
                ],
            },
        ],
        sitemap: appendPath(baseUrl, '/sitemap.xml') || undefined,
    }
}
