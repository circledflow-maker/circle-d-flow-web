-- ==========================================
-- STORAGE & CHRONICLES RLS FIX
-- ==========================================

-- 1. Freigabe für Datei-Uploads im 'flow_media' Bucket
-- (Supabase Storage nutzt die interne Tabelle storage.objects)

-- Jeder darf die Dateien sehen/lesen
CREATE POLICY "Public Read Access for flow_media"
ON storage.objects FOR SELECT
USING ( bucket_id = 'flow_media' );

-- Jeder (auch ohne Login) darf Dateien in flow_media hochladen
-- (Wenn du nur eingeloggten Usern Uploads erlauben willst, ersetze "true" durch "auth.uid() IS NOT NULL")
CREATE POLICY "Public Upload Access for flow_media"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'flow_media' AND true );


-- 2. Chronicles Tabelle: Erlaube Gast-Uploads
-- (Damit auch "Voyager" (Gäste) kommentieren können)
DROP POLICY IF EXISTS "Authenticated users can insert chronicles" ON public.chronicles;

CREATE POLICY "Anyone can insert chronicles" 
ON public.chronicles FOR INSERT 
WITH CHECK (true);
