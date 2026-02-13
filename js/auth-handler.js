/* CIRCLE D FLOW - AUTHENTICATION HANDLER
    Central Module for Login, Register, and Session Management
*/

// --- HELPER: PATH RESOLVER ---
function getRedirectPath(target) {
    const isPages = window.location.pathname.includes('/pages/');
    
    // Scenario 1: Target is in Root (e.g. master_dashboard.html)
    if (!target.includes('/')) {
        return isPages ? '../' + target : target;
    }
    
    // Scenario 2: Target is in Pages (e.g. pages/beta-initiation.html)
    if (target.startsWith('pages/')) {
        return isPages ? target.replace('pages/', '') : target;
    }
    
    return target;
}

// --- 1. LOGIN LOGIC ---
async function handleLogin(argEmail, argPassword) {
    showFeedback("Authenticating...", "neutral"); // Visual Feedback immediately
    
    // Ensure Client is Ready
    if (!window.supabaseClient) {
        showFeedback("System Error: Neural Link Offline (Supabase Client Missing).", "error");
        console.error("Critical: window.supabaseClient is undefined.");
        return;
    }

    // Support for both new Multilingual Modal IDs and old IDs
    const email = argEmail || getValue('login-email') || getValue('auth-email');
    const password = argPassword || getValue('login-password') || getValue('auth-password');

    if (!email || !password) {
        showFeedback("Please enter email and password / Bitte Email und Passwort eingeben.", "error");
        return;
    }

    try {
        const { data, error } = await window.supabaseClient.auth.signInWithPassword({
            email: email,
            password: password,
        });

        if (error) {
            showFeedback("Access Denied / Zugriff verweigert: " + error.message, "error");
        } else {
            const target = getRedirectPath('master_dashboard.html');
            showFeedback(`Identity Confirmed. <a href="${target}" style="color:#00ff00;text-decoration:underline;">Click here</a> if not redirected...`, "success");
            
            setTimeout(() => {
                console.log("Auto-Redirecting to:", target);
                window.location.replace(target);
            }, 1000);
        }
    } catch (err) {
        showFeedback("System Error: " + err.message, "error");
        console.error(err);
    }
}

// --- 2. REGISTER LOGIC ---
async function handleRegister(argEmail, argPassword, argUsername) {
    showFeedback("Encoding Agent Profile...", "neutral");

    // Ensure Client is Ready
    if (!window.supabaseClient) {
        showFeedback("System Error: Neural Link Offline (Supabase Client Missing).", "error");
        return;
    }

    const email = argEmail || getValue('reg-email') || getValue('auth-email');
    const password = argPassword || getValue('reg-password') || getValue('auth-password');
    const username = argUsername || getValue('reg-username') || getValue('auth-username');

    if (!email || !password || !username) {
        showFeedback("Complete data required / Vollständige Daten erforderlich.", "error");
        return;
    }

    try {
        const { data, error } = await window.supabaseClient.auth.signUp({
            email: email,
            password: password,
            options: {
                data: { username: username }
            }
        });

        if (error) {
            showFeedback("Registration failed: " + error.message, "error");
        } else {
            const target = getRedirectPath('pages/beta-initiation.html');
            showFeedback(`Profile Created. <a href="${target}" style="color:#00ff00;text-decoration:underline;">Click here</a> to enter...`, "success");
            
            setTimeout(() => {
                console.log("Auto-Redirecting to:", target);
                window.location.replace(target);
            }, 1000);
        }
    } catch (err) {
         showFeedback("System Error: " + err.message, "error");
         console.error(err);
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

// --- 4. SESSION CHECK (Protection for internal pages) ---
async function checkUserSession() {
    if(typeof supabase === 'undefined') {
        console.warn("Supabase not loaded yet.");
        return;
    }
    const { data: { session } } = await supabase.auth.getSession();
    
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


