-- WhatsApp ↔ Flowee signal bridge (run in Supabase SQL editor)

CREATE TABLE IF NOT EXISTS public.whatsapp_signals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
    sender TEXT,
    recipient TEXT,
    body TEXT,
    raw JSONB,
    consumed BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS whatsapp_signals_inbound_poll
    ON public.whatsapp_signals (created_at DESC)
    WHERE direction = 'inbound' AND consumed = false;

ALTER TABLE public.whatsapp_signals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "whatsapp_signals_read" ON public.whatsapp_signals;
CREATE POLICY "whatsapp_signals_read" ON public.whatsapp_signals
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "whatsapp_signals_insert" ON public.whatsapp_signals;
CREATE POLICY "whatsapp_signals_insert" ON public.whatsapp_signals
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "whatsapp_signals_update" ON public.whatsapp_signals;
CREATE POLICY "whatsapp_signals_update" ON public.whatsapp_signals
    FOR UPDATE USING (true);
