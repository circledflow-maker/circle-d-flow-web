/* ANTIGRAVITY SYSTEM - IRON CONSTITUTION PROTOCOL
   Status: FAIL-SAFE MODE (Windows Edit)
   Rule: UI must work even if Logic fails.
*/

document.addEventListener('DOMContentLoaded', () => {
    console.log("🚀 System initializing in Fail-Safe Mode...");

    // 1. SICHERHEITS-CHECK: Maus sichtbar machen
    document.body.style.cursor = 'auto'; 
    document.body.classList.add('js-loaded');

    // 2. NAVIGATIONS-LOGIK (Die "Harte" Methode)
    const interactiveButtons = document.querySelectorAll('button, .lang-btn, .login-btn, a');

    interactiveButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Wenn es ein Link ist (<a>), lassen wir ihn normal arbeiten
            if (btn.tagName === 'A') return;

            // Visuelles Feedback für Buttons
            btn.style.opacity = '0.5';
            console.log("Button clicked:", btn.innerText);

            // PRÜFUNG: Ist es ein Sprach-Button?
            const text = btn.innerText.toUpperCase();
            if (text.includes('DE') || text.includes('EN') || text.includes('PT') || text.includes('FR') || btn.classList.contains('lang-btn')) {
                // Sofortiger Redirect
                console.log("Redirecting to Dashboard...");
                localStorage.setItem('user_lang', text);
                
                // WICHTIG: Pfad prüfen. Falls pages/dashboard.html existiert:
                setTimeout(() => {
                    // Wir versuchen beide Pfade sicherheitshalber
                    if (window.location.href.includes('pages')) {
                        window.location.href = 'dashboard.html';
                    } else {
                        window.location.href = 'pages/dashboard.html';
                    }
                }, 100);
            }
        });
    });

    // 3. FEHLER-MELDER
    window.onerror = function(msg, url, line) {
        console.error("System Error: " + msg + " Line: " + line);
        return false;
    };

    console.log("✅ System ready. Navigation unlocked.");
});