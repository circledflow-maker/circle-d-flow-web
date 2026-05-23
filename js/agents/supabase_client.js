
/**
 * SUPABASE CLIENT INITIALIZATION
 * Connects to the Circle D Flow backend.
 */

const SUPABASE_URL = 'https://agkmbaephgsnunlarntm.supabase.co';
const SUPABASE_KEY = 'sb_publishable_VwT4qFpNCgNizSXMILBcKQ_aevHvWvM'; // Key from config

// Auto-init if library present
if(window.supabase) {
    try {
        window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
            auth: {
                persistSession: true,
                autoRefreshToken: true,
                detectSessionInUrl: true
            }
        });
        console.log("[Supabase] Client Initialized Successfully.");
        
        // Test Connection
        window.supabaseClient.from('profiles').select('count', { count: 'exact', head: true })
            .then(({ count, error }) => {
                if(error) console.warn("[Supabase] Connection Test Warning:", error);
                else console.log("[Supabase] Connection Verified. Profiles:", count);
            });
            
    } catch (e) {
        console.error("[Supabase] Initialization Failed:", e);
    }
} else {
    console.error("[Supabase] Critical: Library not loaded.");
}
