-- 1. Add stock_count column to market_items
ALTER TABLE public.market_items 
ADD COLUMN IF NOT EXISTS stock_count INTEGER DEFAULT 1;

-- 2. Drop the old view
DROP VIEW IF EXISTS public.market_items_with_vendor;

-- 3. Recreate the view with the new column
CREATE OR REPLACE VIEW public.market_items_with_vendor AS
SELECT 
    m.id, 
    m.title, 
    m.description, 
    m.price_fiat, 
    m.price_credits as price_flow, 
    m.image_url, 
    m.guild_category as category, 
    m.is_active, 
    m.stock_count,
    m.created_at, 
    p.full_name as vendor_name, 
    p.xp as vendor_karma, 
    p.id as vendor_id
FROM public.market_items m
JOIN public.profiles p ON m.creator_id = p.id;
