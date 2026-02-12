/**
 * BETA PATCH v1.0
 * Purpose: Ensure the Auth UI and Launch System work robustly.
 * This runs after everything else to "patch" any holes.
 */

(function() {
    console.log("[BetaPatch] Running Diagnostics...");

    function forceShowAuth() {
        const auth = document.getElementById('auth-container');
        const map = document.getElementById('pirate-map-card');
        
        if(auth) {
            console.log("[BetaPatch] Forcing Auth Container Visibility");
            auth.style.display = 'flex';
            auth.style.opacity = '1';
            auth.style.zIndex = '10000';
        }
        
        if(map) {
             console.log("[BetaPatch] Triggering Map Animation");
             // Remove class to reset
             map.classList.remove('animate-unroll');
             map.classList.remove('scale-0'); // Remove the tailwind hide
             
             // Trigger Reflow
             void map.offsetWidth;
             
             // Add Animation
             map.classList.add('animate-unroll');
             map.style.opacity = '1'; 
        }
    }

    function checkBodyVisibility() {
        if(document.body.classList.contains('opacity-0')) {
             console.log("[BetaPatch] Body hidden. Revealing...");
             document.body.classList.remove('opacity-0');
             document.body.style.opacity = '1';
        }
    }

    // 1. Run immediately check
    checkBodyVisibility();

    // 2. Wait for Load
    window.addEventListener('load', () => {
        setTimeout(() => {
            console.log("[BetaPatch] Window Loaded. Checking State...");
            
            // Check if Matrix Overlay is stuck
            const overlay = document.getElementById('system-launch-overlay');
            if(overlay && overlay.offsetWidth > 0 && !sessionStorage.getItem('cdf_launched')) {
                 console.log("[BetaPatch] Launch Overlay Active. Waiting for user...");
            } else {
                 // If no overlay, or already launched, ensure Auth is visible if not logged in
                 if(localStorage.getItem('cqr_auth_state') !== 'logged_in') {
                     forceShowAuth();
                 }
            }
            
            checkBodyVisibility();

        }, 1500); // Wait 1.5s after load
    });

    // 3. Expose Debug
    window.BetaPatch = {
        forceShowAuth,
        reset: () => {
            localStorage.clear();
            sessionStorage.clear();
            location.reload();
        }
    };

})();
