-- ============================================================================
-- Base storefront table for tenant carousel slides.
-- Restores the missing data-plane table that later migrations and runtime
-- already assume exists.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.carousel_slides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('product', 'image', 'offer')),
    title TEXT NOT NULL,
    subtitle TEXT,
    image TEXT,
    cta_text TEXT,
    cta_url TEXT,
    medusa_product_id TEXT,
    active BOOLEAN NOT NULL DEFAULT true,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_carousel_slides_tenant
    ON public.carousel_slides(tenant_id);

CREATE INDEX IF NOT EXISTS idx_carousel_slides_tenant_sort
    ON public.carousel_slides(tenant_id, sort_order);

ALTER TABLE public.carousel_slides ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "carousel_slides_select_public" ON public.carousel_slides;
CREATE POLICY "carousel_slides_select_public" ON public.carousel_slides
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "carousel_slides_insert_admin" ON public.carousel_slides;
CREATE POLICY "carousel_slides_insert_admin" ON public.carousel_slides
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.profiles
            WHERE profiles.id = auth.uid()
              AND (
                  profiles.role = 'super_admin'
                  OR (profiles.role = 'owner' AND profiles.tenant_id = carousel_slides.tenant_id)
              )
        )
    );

DROP POLICY IF EXISTS "carousel_slides_update_admin" ON public.carousel_slides;
CREATE POLICY "carousel_slides_update_admin" ON public.carousel_slides
    FOR UPDATE USING (
        EXISTS (
            SELECT 1
            FROM public.profiles
            WHERE profiles.id = auth.uid()
              AND (
                  profiles.role = 'super_admin'
                  OR (profiles.role = 'owner' AND profiles.tenant_id = carousel_slides.tenant_id)
              )
        )
    );

DROP POLICY IF EXISTS "carousel_slides_delete_admin" ON public.carousel_slides;
CREATE POLICY "carousel_slides_delete_admin" ON public.carousel_slides
    FOR DELETE USING (
        EXISTS (
            SELECT 1
            FROM public.profiles
            WHERE profiles.id = auth.uid()
              AND (
                  profiles.role = 'super_admin'
                  OR (profiles.role = 'owner' AND profiles.tenant_id = carousel_slides.tenant_id)
              )
        )
    );
