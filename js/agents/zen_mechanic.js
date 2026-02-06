/**
 * Agent: Zen Mechanic (Debugger & Pusher)
 * Purpose: Diagnose and Force State for Zen-Zentral Dashboard.
 * "I fix what's broken. I push what's stuck."
 */

class ZenMechanicAgent {
    constructor() {
        this.name = "Zen Mechanic";
        this.context = "Dashboard";
        
        console.log(`[${this.name}] Online. Monitoring Zen frequencies...`);
        
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.runDiagnostics());
        } else {
            this.runDiagnostics();
        }

        // Expose global helper
        window.forceZenOpen = () => this.forceOpen();
    }

    runDiagnostics() {
        console.group(`[${this.name}] Running Diagnostic Scan`);
        
        const menu = document.getElementById('prisma-menu');
        const flowPoint = document.getElementById('flow-point');
        const core = document.getElementById('zen-core');
        const overlay = document.getElementById('detail-overlay');

        this.logElementStatus('Prisma Menu', menu);
        this.logElementStatus('Flow Point', flowPoint);
        this.logElementStatus('Zen Core', core);
        this.logElementStatus('Detail Overlay', overlay);

        // Check if Event Listener is working
        if (flowPoint) {
            console.log(`[${this.name}] Flow Point found. Attempting to Simulate Click in 3 seconds...`);
            setTimeout(() => {
                console.log(`[${this.name}] Simulating Click on Flow Point...`);
                flowPoint.click();
                this.checkPostClickState();
            }, 3000);
        } else {
            console.error(`[${this.name}] CRITICAL: Flow Point (#flow-point) NOT FOUND.`);
        }

        console.groupEnd();
    }

    logElementStatus(label, el) {
        if (!el) {
            console.error(`${label}: MISSING ❌`);
        } else {
            const style = window.getComputedStyle(el);
            console.log(`${label}: FOUND ✅`);
            console.log(`   - Visible: ${style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0'}`);
            console.log(`   - Classes: ${el.className}`);
            console.log(`   - PointerEvents: ${style.pointerEvents}`);
            console.log(`   - Z-Index: ${style.zIndex}`);
        }
    }

    checkPostClickState() {
        const menu = document.getElementById('prisma-menu');
        const isActive = menu.classList.contains('active');
        console.log(`[${this.name}] Post-Click Check: Menu Active? ${isActive ? 'YES ✅' : 'NO ❌'}`);
        
        if (!isActive) {
            console.warn(`[${this.name}] Click failed to activate menu. Attempting FORCE OPEN.`);
            this.forceOpen();
            this.showRepairTool();
        } else {
             // Even if active, check visibility
             setTimeout(() => {
                 this.verifyVisibility();
             }, 1000);
        }
    }

    verifyVisibility() {
        // Check if branches moved
        const branch = document.querySelector('.menu-branch');
        if (branch) {
            const rect = branch.getBoundingClientRect();
            // Assuming center is roughly screen center. 
            // If rect is still near center, CSS unavailable.
            console.log(`[${this.name}] Branch 1 Position:`, rect);
        }
    }

    forceOpen() {
        console.log(`[${this.name}] ⚠️ INITIATING FORCE OPEN PROTOCOL`);
        const menu = document.getElementById('prisma-menu');
        const flowPoint = document.getElementById('flow-point');

        if (menu) {
            menu.classList.add('active');
            // Direct Style Injection as fail-safe
            menu.style.opacity = '1'; 
            menu.style.pointerEvents = 'auto';
        }

        if (flowPoint) {
            flowPoint.classList.add('bg-electric/20', 'border-electric');
            const icon = flowPoint.querySelector('span');
            if(icon) icon.textContent = 'keyboard_arrow_down';
        }
    }

    showRepairTool() {
        if (document.getElementById('zen-repair-tool')) return;

        const btn = document.createElement('button');
        btn.id = 'zen-repair-tool';
        btn.innerHTML = `<span class="material-symbols-outlined">build</span> REPAIR UI`;
        btn.className = 'fixed top-24 right-4 z-[999] bg-red-500 text-white font-bold p-3 rounded-full shadow-lg hover:bg-red-400 flex items-center gap-2 text-xs uppercase tracking-widest';
        btn.onclick = () => {
            this.forceOpen();
            alert("Forced Menu Open State. Check layout.");
        };
        document.body.appendChild(btn);
        console.log(`[${this.name}] Repair Tool Injected.`);
    }
}

// Instantiate
window.ZenMechanic = new ZenMechanicAgent();
