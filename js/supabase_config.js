/**
 * SUPABASE CONFIGURATION
 * Centralized connection logic for Circle D Flow.
 */

const SUPABASE_URL = 'https://agkmbaephgsnunlarntm.supabase.co';
const SUPABASE_KEY = 'sb_publishable_VwT4qFpNCgNizSXMILBcKQ_aevHvWvM'; // Key provided by user

// Initialize Client if Library is loaded
if (window.supabase && window.supabase.createClient) {
    window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    console.log("[SupabaseConfig] Client Initialized: window.supabaseClient");
} else {
    console.error("[SupabaseConfig] Critical Error: Supabase Library not found. Ensure CDN is loaded.");
}
