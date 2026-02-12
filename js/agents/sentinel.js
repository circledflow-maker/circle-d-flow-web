/**
 * Agent: The Sentinel (System Guardian)
 * Purpose: Automated Site Verification & Self-Healing.
 * "I watch. I report. I protect."
 */

class SentinelAgent extends Agent {
    constructor() {
        super("The Sentinel");
        this.version = "1.0.0";
        this.issues = [];
        this.isScanning = false;
    }

    init() {
        console.log(`[${this.name}] Online. Initializing Defense Grid...`);
        this.createUI();
        this.startScan();

        // Watchdog for Console Errors
        this.interceptConsole();
    }

    createUI() {
        if (document.getElementById('sentinel-eye')) return;

        const ui = document.createElement('div');
        ui.id = 'sentinel-eye';
        ui.className = 'fixed bottom-4 right-4 z-[9999] flex items-center gap-2 font-mono transition-all duration-300';
        ui.innerHTML = `
            <div id="sentinel-icon" class="w-12 h-12 bg-black/90 border-2 border-green-500 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(0,255,0,0.3)] cursor-pointer hover:scale-110 transition-transform">
                <span class="material-symbols-outlined text-green-500 text-2xl animate-pulse">security</span>
            </div>
            <div id="sentinel-report" class="hidden absolute bottom-16 right-0 w-80 bg-black/95 border border-white/10 rounded-lg p-4 shadow-2xl backdrop-blur-xl max-h-96 overflow-y-auto custom-scrollbar">
                <h3 class="text-xs font-bold uppercase tracking-widest text-white mb-2 border-b border-white/10 pb-2 flex justify-between">
                    <span>System Status</span>
                    <span id="sentinel-count" class="text-green-400">NOMINAL</span>
                </h3>
                <ul id="sentinel-list" class="space-y-2 text-[10px] text-gray-300">
                    <!-- Issues injected here -->
                </ul>
                <div class="mt-4 pt-2 border-t border-white/10 flex gap-2">
                    <button onclick="Sentinel.scan()" class="flex-1 py-1 bg-white/10 hover:bg-white/20 rounded text-white font-bold uppercase">Re-Scan</button>
                    <button onclick="Sentinel.toggleReport()" class="px-3 py-1 bg-red-500/20 hover:bg-red-500/40 text-red-400 rounded font-bold uppercase">Close</button>
                </div>
            </div>
        `;
        document.body.appendChild(ui);

        // Bind Toggle
        document.getElementById('sentinel-icon').onclick = () => this.toggleReport();
        
        // Expose global
        window.Sentinel = this;
    }

    toggleReport() {
        const report = document.getElementById('sentinel-report');
        report.classList.toggle('hidden');
    }

    interceptConsole() {
        const originalError = console.error;
        let isLogging = false;

        console.error = (...args) => {
            if (isLogging) {
                originalError.apply(console, args);
                return;
            }

            isLogging = true;
            try {
                this.logIssue('CONSOLE', `Error: ${args.join(' ')}`, 'high');
                originalError.apply(console, args);
                this.updateStatus();
            } catch (e) {
                originalError.call(console, "Sentinel Failed to Log Error:", e);
            } finally {
                isLogging = false;
            }
        };

        const originalWarn = console.warn;
        console.warn = (...args) => {
            if (isLogging) {
                 originalWarn.apply(console, args);
                 return;
            }
            
            isLogging = true;
            try {
                // Ignore benign warnings if needed
                this.logIssue('CONSOLE', `Warning: ${args.join(' ')}`, 'medium');
                originalWarn.apply(console, args);
                this.updateStatus();
            } catch (e) {
                originalError.call(console, "Sentinel Failed to Log Warning:", e);
            } finally {
                isLogging = false;
            }
        };
    }

    startScan() {
        this.isScanning = true;
        this.issues = []; // Reset
        this.updateUIState('scanning');

        setTimeout(() => {
            this.scanLinks();
            this.scanImages();
            this.scanScripts();
            this.isScanning = false;
            this.updateStatus();
        }, 1000); // Slight delay to allow framework loads
    }

    scanLinks() {
        const links = document.querySelectorAll('a');
        links.forEach(link => {
            const href = link.getAttribute('href');
            if (!href || href === '#') {
                this.logIssue('LINK', `Empty or Placeholder Link: "${link.textContent.trim() || 'Icon'}"`, 'low');
                // Auto-Fix suggestion: Add visual cue?
                link.classList.add('sentinel-highlight-warn');
            }
            // Future: Check 404s via fetch (head)
        });
    }

    scanImages() {
        const imgs = document.querySelectorAll('img');
        imgs.forEach(img => {
            if (!img.complete || img.naturalWidth === 0) {
                // Check if it's supposed to be hidden?
                this.logIssue('ASSET', `Broken Image: ${img.src.split('/').pop()}`, 'high');
                img.style.border = '2px solid red'; // Visual Flag
            }
        });
    }

    scanScripts() {
        // Hard to detect loaded scripts without events, but we can check if expected globals exist
        // Example: Check if CommunityLog is defined if likely needed
    }

    logIssue(type, msg, severity) {
        // De-dupe
        if (this.issues.some(i => i.msg === msg)) return;

        this.issues.push({ type, msg, severity, timestamp: new Date() });
    }

    updateStatus() {
        const icon = document.getElementById('sentinel-icon');
        const iconSpan = icon.querySelector('span');
        const count = document.getElementById('sentinel-count');
        const list = document.getElementById('sentinel-list');
        
        // Clear List
        list.innerHTML = '';

        if (this.issues.length === 0) {
            // ALL GOOD
            icon.className = 'w-12 h-12 bg-black/90 border-2 border-green-500 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(0,255,0,0.3)] cursor-pointer hover:scale-110 transition-transform';
            iconSpan.className = 'material-symbols-outlined text-green-500 text-2xl';
            iconSpan.textContent = 'security';
            count.textContent = 'NOMINAL';
            count.className = 'text-green-400';
            
            list.innerHTML = '<li class="text-center text-green-400 italic py-4">No anomalies detected.</li>';
        } else {
            // ISSUES FOUND
            const highSev = this.issues.filter(i => i.severity === 'high').length;
            const color = highSev > 0 ? 'red' : 'yellow';

            icon.className = `w-12 h-12 bg-black/90 border-2 border-${color}-500 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(255,0,0,0.3)] cursor-pointer hover:scale-110 transition-transform animate-pulse`;
            iconSpan.className = `material-symbols-outlined text-${color}-500 text-2xl`;
            iconSpan.textContent = highSev > 0 ? 'warning' : 'info';
            
            count.textContent = `${this.issues.length} ALERT(S)`;
            count.className = `text-${color}-500 font-bold`;

            // Populate List
            this.issues.forEach(issue => {
                const li = document.createElement('li');
                li.className = `p-2 rounded bg-white/5 border-l-2 border-${issue.severity === 'high' ? 'red' : 'yellow'}-500`;
                li.innerHTML = `
                    <span class="block text-[8px] uppercase tracking-widest opacity-50">${issue.type}</span>
                    <span class="text-white">${issue.msg}</span>
                    ${issue.severity === 'high' ? '<button class="block mt-1 text-[8px] bg-red-500/20 px-2 py-0.5 rounded text-red-300 hover:bg-red-500/40">ATTEMPT FIX</button>' : ''}
                `;
                list.appendChild(li);
            });
            
            // Auto open report if high severity
            if (highSev > 0) {
                document.getElementById('sentinel-report').classList.remove('hidden');
            }
        }
    }

    updateUIState(state) {
        const iconSpan = document.getElementById('sentinel-icon').querySelector('span');
        if (state === 'scanning') {
            iconSpan.textContent = 'radar';
            iconSpan.classList.add('animate-spin');
        } else {
            iconSpan.classList.remove('animate-spin');
        }
    }
}

// Auto-Start
window.Sentinel = new SentinelAgent();
