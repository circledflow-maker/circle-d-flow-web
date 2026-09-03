/**
 * SUPABASE CONFIGURATION
 * Centralized connection logic for Circle D Flow.
 */

if (!window.__CDF_CONFIG__ || !window.__CDF_CONFIG__.supabaseKey) {
    window.__CDF_CONFIG__ = Object.assign({}, window.__CDF_CONFIG__ || {}, {
        supabaseUrl: 'https://agkmbaephgsnunlarntm.supabase.co',
        supabaseKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFna21iYWVwaGdzbnVubGFybnRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5MTAwNjEsImV4cCI6MjA4NjQ4NjA2MX0.XTuM8TTPWgbe65OzNnD8YQkfXY_nTAiYH_Cu-oiRM-k'
    });
}
const cfg = window.__CDF_CONFIG__ || {};
const metaUrl = document.querySelector('meta[name="supabase-url"]')?.content;
const metaKey = document.querySelector('meta[name="supabase-key"]')?.content;
const SUPABASE_URL = cfg.supabaseUrl || window.CDF_SUPABASE_URL || metaUrl;
const SUPABASE_KEY = cfg.supabaseKey || window.CDF_SUPABASE_KEY || metaKey;

// Initialize Client if Library is loaded
if (window.supabase && window.supabase.createClient) {
    if (SUPABASE_URL && SUPABASE_KEY) {
        window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
        console.log("[SupabaseConfig] Client Initialized: window.supabaseClient");
    } else {
        console.error("[SupabaseConfig] Missing Supabase URL/Key. Provide via window.__CDF_CONFIG__ or meta tags.");
    }
} else {
    console.error("[SupabaseConfig] Critical Error: Supabase Library not found. Ensure CDN is loaded.");
}
