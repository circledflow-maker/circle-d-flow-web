/**
 * Agent: Architect's Note (Beta Log Overlay)
 * Purpose: Allows the Master User to send feedback directly to the "Brain" from the Dashboard.
 */

(function() {
    // 1. Inject Styles
    const style = document.createElement('style');
    style.innerHTML = `
        #beta-log-overlay {
            position: fixed; bottom: 20px; right: 20px; z-index: 9999;
            font-family: 'Rajdhani', sans-serif;
        }
        #beta-log-btn {
            background: #D4AF37; /* AQ Gold */
            border-radius: 50%; width: 50px; height: 50px;
            border: none; cursor: pointer;
            box-shadow: 0 0 15px rgba(212, 175, 55, 0.5);
            display: flex; align-items: center; justify-content: center;
            transition: transform 0.2s;
        }
        #beta-log-btn:hover { transform: scale(1.1); }
        #log-form {
            display: none;
            background: rgba(10, 15, 20, 0.95);
            border: 1px solid #D4AF37;
            padding: 15px; margin-bottom: 10px;
            width: 300px; border-radius: 10px;
            backdrop-filter: blur(10px);
            box-shadow: 0 0 20px rgba(0,0,0,0.8);
        }
        #log-form h4 { color: #D4AF37; margin-top: 0; margin-bottom: 2px; text-transform: uppercase; letter-spacing: 2px; font-weight: bold; }
        .log-input {
            width: 100%; background: #222; color: white; border: 1px solid #444;
            padding: 8px; margin-top: 8px; border-radius: 4px; font-size: 12px;
        }
        .log-btn {
            width: 100%; margin-top: 10px; background: #D4AF37; color: black;
            font-weight: bold; padding: 10px; border: none; border-radius: 4px;
            cursor: pointer; text-transform: uppercase;
        }
        .log-btn:hover { background: white; }
    `;
    document.head.appendChild(style);

    // 2. Inject HTML
    const overlay = document.createElement('div');
    overlay.id = 'beta-log-overlay';
    overlay.innerHTML = `
        <div id="log-form">
            <h4>Master Feedback</h4>
            <div class="text-[10px] text-white/50 mb-2">Direct Uplink to Core</div>
            
            <select id="log-type" class="log-input">
                <option value="BUG">🐛 Bug Report</option>
                <option value="DESIGN">🎨 Design Idea</option>
                <option value="LORE">📜 Lore Update</option>
                <option value="FLOW">🌊 Flow Break</option>
            </select>
            
            <input type="text" id="log-loc" class="log-input" value="${window.location.pathname.split('/').pop()}" disabled>
            
            <textarea id="log-text" class="log-input" placeholder="What did you find, Captain?" style="height: 80px; resize: none;"></textarea>
            
            <div class="mt-2 flex items-center justify-between text-[10px] text-white/50">
                <span>Priority</span>
                <input type="range" id="log-prio" min="1" max="5" value="1" class="w-16">
            </div>

            <button onclick="window.BetaLogger.send()" class="log-btn">SEND TO BRAIN</button>
        </div>
        <button id="beta-log-btn" onclick="window.BetaLogger.toggle()">
            <span class="material-symbols-outlined text-black font-bold text-xl">edit_note</span>
        </button>
    `;
    document.body.appendChild(overlay);

    // 3. Logic
    window.BetaLogger = {
        toggle: function() {
            const form = document.getElementById('log-form');
            form.style.display = form.style.display === 'block' ? 'none' : 'block';
        },
        
        send: function() {
            const type = document.getElementById('log-type').value;
            const text = document.getElementById('log-text').value;
            const prio = document.getElementById('log-prio').value;
            const loc = window.location.pathname;

            if(!text) return alert("Captain, the message is empty!");

            const logEntry = {
                timestamp: new Date().toISOString(),
                type: type,
                location: loc,
                priority: prio,
                message: text,
                user: "Master-Architect"
            };

            // 1. Log to Console (Mock Backend)
            console.log("🟦 [Imperial Log]", logEntry);

            // 2. Persist to LocalStorage (Fake DB)
            const logs = JSON.parse(localStorage.getItem('cdf_beta_master_logs') || '[]');
            logs.push(logEntry);
            localStorage.setItem('cdf_beta_master_logs', JSON.stringify(logs));

            // 3. Feedback
            alert("The Brain has received your vision, Captain! 🏴CQR");
            document.getElementById('log-text').value = '';
            this.toggle();

            // 4. Notify BetaObserver if active
            if(window.BetaObserver) {
                window.BetaObserver.logEvent('MASTER_FEEDBACK', logEntry);
            }
        }
    };

    console.log("[BetaLogger] Architect's Note Overlay Injected.");
})();
