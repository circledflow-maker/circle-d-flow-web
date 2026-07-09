/* CIRCLE D FLOW - AUTHENTICATION HANDLER
    Central Module for Login, Register, and Session Management
*/

// --- HELPER: PATH RESOLVER ---
function getRedirectPath(target) {
    const isPages = window.location.pathname.includes('/pages/');
    
    // Scenario 1: Target is in Root (e.g. /pages/dashboard.html)
    if (!target.includes('/')) {
        return isPages ? '../' + target : target;
    }
    
    // Scenario 2: Target is in Pages (e.g. pages/beta-initiation.html)
    if (target.startsWith('pages/')) {
        return isPages ? target.replace('pages/', '') : target;
    }
    
    return target;
}

// --- 0. ERROR HANDLING (URL Hash) ---
window.addEventListener('load', checkAuthErrors);

function checkAuthErrors() {
    const hash = window.location.hash;
    if (!hash) return;

    // Handle Expired Token / Access Denied
    if (hash.includes('error=access_denied') && hash.includes('otp_expired')) {
        console.warn("Auth Error: Link Expired");
        setTimeout(() => {
            showFeedback(`⚠️ Security Link Expired. <a href="#" onclick="document.getElementById('auth-modal').style.display='flex'; document.getElementById('login-email').focus(); return false;">Click here</a> to log in and trigger a new code.`, "error");
        }, 1000); // Wait for UI
    }
}

// --- RESEND CONFIRMATION ---
async function handleResendConfirmation(email) {
    if(!email) return;
    showFeedback("Requesting new security link...", "neutral");
    
    const { error } = await window.supabaseClient.auth.resend({
        type: 'signup',
        email: email,
        options: {
            emailRedirectTo: window.location.origin
        }
    });

    if (error) {
        showFeedback("Error: " + error.message, "error");
    } else {
        showFeedback("✅ New Link Sent! Check your email immediately.", "success");
    }
}

// --- HELPER: POST-LOGIN ROUTING ---
function resolvePostLoginPath(session) {
    const meta = session?.user?.user_metadata || {};
    const flowClass = meta.flow_class || localStorage.getItem('userClass') || '';
    const isVisual = ['CREATOR', 'PATHFINDER', 'visionary'].includes(flowClass);
    const page = isVisual ? 'pages/photographer_hub.html' : 'pages/dashboard.html';
    return getRedirectPath(page).replace('.html', '');
}

// --- 1. LOGIN LOGIC ---
// --- HELPER: WAIT FOR STORAGE (The Fix for "No Token" bug) ---
async function waitForSessionAndRedirect(target) {
    console.log("⏳ Verifying Session persistence...");
    let retries = 0;
    
    const check = async () => {
        const { data: { session } } = await window.supabaseClient.auth.getSession();
        const token = localStorage.getItem('sb-agkmbaephgsnunlarntm-auth-token'); 
        
        if (session && token) {
            console.log("✅ Session persisted. Redirecting.");
            const username = session.user?.user_metadata?.username || session.user?.email?.split('@')[0] || "Flow_Initiate";
            localStorage.setItem('cdf_user_username', username);
            if (!localStorage.getItem('cdf_balance')) {
                localStorage.setItem('cdf_balance', 0);
            }
            window.location.replace(target);
        } else {
            retries++;
            if (retries > 20) { // 2 seconds max
                console.warn("⚠️ Persistence slow. Forcing redirect anyway.");
                window.location.replace(target);
            } else {
                setTimeout(check, 100);
            }
        }
    };
    check();
}

// --- 1. LOGIN LOGIC ---
async function handleLogin(argEmail, argPassword) {
    showFeedback("Authenticating...", "neutral"); 
    
    if (!window.supabaseClient) {
        showFeedback("System Error: Neural Link Offline.", "error");
        return;
    }

    const email = argEmail || getValue('login-email') || getValue('auth-email');
    const password = argPassword || getValue('login-password') || getValue('auth-password');

    if (!email || !password) {
        showFeedback("Please enter email and password.", "error");
        return;
    }

    try {
        const { data, error } = await window.supabaseClient.auth.signInWithPassword({
            email: email,
            password: password,
        });

        if (error) {
            // Check for unconfirmed email error
            if(error.message.includes("Email not confirmed")) {
                showFeedback(`⚠️ Email not verified. <a href="#" onclick="handleResendConfirmation('${email}'); return false;" style="color:var(--lisbon-gold); text-decoration:underline;">CLICK TO RESEND LINK</a>`, "error");
            } else {
                showFeedback("Access Denied: " + error.message, "error");
            }
        } else {
            const target = resolvePostLoginPath(data.session);
            localStorage.setItem('cqr_auth_state', 'logged_in');
            showFeedback(`Identity Confirmed. Calibrating...`, "success");
            waitForSessionAndRedirect(target); // USE NEW HELPER
        }
    } catch (err) {
        showFeedback("System Error: " + err.message, "error");
    }
}

// --- 2. REGISTER LOGIC ---
async function handleRegister(argEmail, argPassword, argUsername) {
    showFeedback("Encoding Agent Profile...", "neutral");

    if (!window.supabaseClient) {
        showFeedback("System Error: Neural Link Offline.", "error");
        return;
    }

    const email = argEmail || getValue('reg-email') || getValue('auth-email');
    const password = argPassword || getValue('reg-password') || getValue('auth-password');
    const username = argUsername || getValue('reg-username') || getValue('auth-username');

    if (!email || !password || !username) {
        showFeedback("Complete data required.", "error");
        return;
    }

    try {
        const { data, error } = await window.supabaseClient.auth.signUp({
            email: email,
            password: password,
            options: { data: { username: username } }
        });

        if (error) {
            showFeedback("Registration failed: " + error.message, "error");
        } else {
            // Check if email confirmation is required (Supabase setting)
            if (data.user && !data.session) {
                showFeedback("Registration Success! Please CHECK YOUR EMAIL to confirm account.", "success");
                return; 
            }

            const target = getRedirectPath('pages/beta-initiation.html');
            showFeedback(`Profile Created. Initializing...`, "success");
            localStorage.removeItem('seen_command_trinity'); // Force welcome for new users
            localStorage.setItem('cqr_auth_state', 'logged_in'); // PERSIST FOR DASHBOARD SECURITY
            waitForSessionAndRedirect(target); // USE NEW HELPER
        }
    } catch (err) {
         showFeedback("System Error: " + err.message, "error");
    }
}

// Helper to safely get value
function getValue(id) {
    const el = document.getElementById(id);
    return el ? el.value : null;
}

// --- 3. LOGOUT LOGIC ---
async function handleLogout() {
    if (!window.supabaseClient) return;

    const { error } = await window.supabaseClient.auth.signOut();
    if (error) {
        console.error("Error logging out:", error.message);
    } else {
        window.location.href = getRedirectPath('index.html'); // Will resolve correctly
    }
}

// --- 3b. PASSWORD RESET LOGIC ---
async function handlePasswordReset() {
    const email = getValue('login-email');

    if (!email) {
        showFeedback("Please enter your EMAIL address above to reset password.", "error");
        document.getElementById('login-email').focus();
        document.getElementById('login-email').style.borderColor = "red";
        return;
    }

    // Reset style
    document.getElementById('login-email').style.borderColor = "#333";

    if (!window.supabaseClient) {
        showFeedback("System Error: Neural Link Offline.", "error");
        return;
    }

    try {
        const { data, error } = await window.supabaseClient.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin + window.location.pathname.replace('/pages/', '/') + '?reset=true',
        });

        if (error) {
            showFeedback("Reset Failed: " + error.message, "error");
        } else {
            showFeedback("Signal Sent. Check your comms (email) for the reset link.", "success");
        }
    } catch (err) {
        showFeedback("System Error: " + err.message, "error");
    }
}

// --- 4. SESSION CHECK (Protection for internal pages) ---
async function checkUserSession() {
    if(!window.supabaseClient) {
        console.warn("Supabase not loaded yet.");
        return;
    }
    const { data: { session } } = await window.supabaseClient.auth.getSession();
    
    if (session) {
        // Enforce Initiation for New Users
        const flowClass = session.user?.user_metadata?.flow_class;
        const currentPath = window.location.pathname;
        if (!flowClass && !currentPath.includes('beta-initiation')) {
            console.warn("Auth: User has no flow_class. Redirecting to initiation.");
            window.location.replace(getRedirectPath('pages/beta-initiation.html'));
            return session;
        }

        const username = session.user?.user_metadata?.username || session.user?.email?.split('@')[0] || "Flow_Initiate";
        localStorage.setItem('cdf_user_username', username);
        if (!localStorage.getItem('cdf_balance')) {
            localStorage.setItem('cdf_balance', 0);
        }
    }
    
    // Check if handling a password reset flow
    // Supabase redirects with #access_token=...&type=recovery
    const hash = window.location.hash;
    if (hash && hash.includes('type=recovery')) {
        console.log("Password Recovery Mode Detected");
        // Redirect to a password reset handling page or show a modal
        // For now, let's just log it. A full 'Update Password' UI is a separate task.
        showFeedback("Recovery Mode: Please go to Profile to change password.", "success");
    }

    // If not on Landing Page/Login Page and no session
    const path = window.location.pathname;
    const isPublic = path.endsWith('index.html') || path.endsWith('login.html');

    if (!session && !isPublic) {
        // Redirect to Landing Page if unauthorized
        // window.location.href = getRedirectPath('index.html'); 
    }
    
    return session;
}

// Helper function for visual feedback
function showFeedback(message, type) {
    const statusField = document.getElementById('auth-status');
    if (statusField) {
        statusField.innerHTML = message; // Allow HTML for links
        statusField.style.color = type === "error" ? "var(--error-red)" : "var(--gold)";
    } else {
        // Fallback for pages without the specific status field (like login.html might have different UI)
        // Try standard alert if quick fix needed, or log
        // alert(message); 
        console.log("Feedback:", message);
    }
}


// --- 5. OAUTH LOGIC ---
async function handleOAuthLogin(provider) {
    if (!window.supabaseClient) {
        showFeedback("System Error: Neural Link Offline.", "error");
        return;
    }
    showFeedback("Initiating Neural Link...", "neutral");
    
    // PERSIST FOR DASHBOARD SECURITY BEFORE REDIRECT
    localStorage.setItem('cqr_auth_state', 'logged_in');
    
    const { data, error } = await window.supabaseClient.auth.signInWithOAuth({
        provider: provider,
        options: {
            redirectTo: window.location.origin + '/pages/dashboard.html'
        }
    });
    if (error) {
        showFeedback("OAuth Error: " + error.message, "error");
        localStorage.removeItem('cqr_auth_state'); // Revert on failure
    }
}

window.handleLogin = handleLogin;
window.handleRegister = handleRegister;
window.handleOAuthLogin = handleOAuthLogin;
