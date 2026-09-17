/**
 * SUPABASE CLIENT INITIALIZATION
 * Connects to the Circle D Flow backend.
 */

// Public anon bootstrap (RLS-protected). Prefer js/cdf_runtime_config.js loaded first.
if (!window.__CDF_CONFIG__ || !window.__CDF_CONFIG__.supabaseKey) {
    window.__CDF_CONFIG__ = Object.assign({}, window.__CDF_CONFIG__ || {}, {
        supabaseUrl: 'https://agkmbaephgsnunlarntm.supabase.co',
        supabaseKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFna21iYWVwaGdzbnVubGFybnRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5MTAwNjEsImV4cCI6MjA4NjQ4NjA2MX0.XTuM8TTPWgbe65OzNnD8YQkfXY_nTAiYH_Cu-oiRM-k'
    });
}
const runtimeCfg = window.__CDF_CONFIG__ || {};
const SUPABASE_URL = runtimeCfg.supabaseUrl || window.CDF_SUPABASE_URL;
const SUPABASE_KEY = runtimeCfg.supabaseKey || window.CDF_SUPABASE_KEY;

// Auto-init if library present
if(window.supabase && SUPABASE_URL && SUPABASE_KEY) {
    try {
        window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
            auth: {
                persistSession: true,
                autoRefreshToken: true,
                detectSessionInUrl: true
            }
        });
        console.log("[Supabase] Client Initialized Successfully.");
        
        // Test Connection (only if session exists or handle RLS gracefully)
        window.supabaseClient.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                window.supabaseClient.from('profiles').select('count', { count: 'exact', head: true })
                    .then(({ count, error }) => {
                        if(error) console.log("[Supabase] Connection Test (RLS):", error.message);
                        else console.log("[Supabase] Connection Verified. Profiles:", count);
                    });
            }
        });
            
    } catch (e) {
        console.error("[Supabase] Initialization Failed:", e);
    }
} else {
    console.error("[Supabase] Critical: Library not loaded or runtime config missing.");
}

// --- OAUTH LOGIC (THE SYNAPSE GATE) ---
window.handleOAuthLogin = async function(provider) {
    if(!window.supabaseClient) {
        alert('Backend disconnected.');
        return;
    }
    
    const btn = typeof event !== 'undefined' && event?.target ? event.target : null;
    const oldText = btn ? btn.innerHTML : '';
    if (btn) btn.innerHTML = 'Connecting...';

    try {
        try {
            const next = new URLSearchParams(window.location.search || '').get('next');
            if (next && next.startsWith('/') && !next.startsWith('//')) {
                sessionStorage.setItem('cdf_auth_next', next);
            } else if (!sessionStorage.getItem('cdf_auth_next')) {
                sessionStorage.setItem(
                    'cdf_auth_next',
                    '/pages/artist_sanctuary.html?welcome=register'
                );
            }
        } catch (_) { /* ignore */ }

        const { data, error } = await window.supabaseClient.auth.signInWithOAuth({
            provider: provider,
            options: {
                // Prefer auth_callback; dashboard.html also bridges (legacy allowlist)
                redirectTo: window.location.origin + '/pages/auth_callback'
            }
        });
        if (error) throw error;
    } catch(err) {
        console.error('OAuth Error:', err);
        alert('Authentication failed: ' + err.message);
        if (btn) btn.innerHTML = oldText;
    }
};

// --- IDENTITY MERGE (SHADOW PROFILES) ---
if(window.supabaseClient) {
    window.supabaseClient.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
            console.log('[Supabase] Auth state changed to SIGNED_IN');
            
            // Extract Discord handle from metadata if available
            const metadata = session.user.user_metadata;
            const socialHandle = metadata.preferred_username || metadata.user_name || null;
            
            // Only attempt merge if we have a handle
            if (socialHandle && window.localStorage.getItem('cdf_merged_' + session.user.id) !== 'true') {
                try {
                    // Call the RPC function we defined in Supabase
                    const { data, error } = await window.supabaseClient.rpc('merge_shadow_profile', {
                        p_auth_user_id: session.user.id,
                        p_discord_handle: socialHandle
                    });
                    
                    if (!error && data && data.merged) {
                        console.log('Identity Merged!', data.message);
                        alert(data.message); // Temporary UI feedback
                    }
                    
                    // Mark as merged locally so we don't spam RPC calls on every refresh
                    window.localStorage.setItem('cdf_merged_' + session.user.id, 'true');
                } catch(e) {
                    console.error('Merge Error:', e);
                }
            }
        }
    });
}

// --- ENFORCE STRICT AUTHENTICATION ---
window.enforceAuth = async function() {
    if(!window.supabaseClient) {
        console.warn("Supabase not loaded yet.");
        setTimeout(window.enforceAuth, 500);
        return;
    }
    const { data: { session } } = await window.supabaseClient.auth.getSession();
    if (!session) {
        console.warn("Auth Enforced: User not logged in. Redirecting to login...");
        window.location.replace('../pages/login.html');
    }
    return session;
};
