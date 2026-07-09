/**
 * Agent: Zen Mechanic (Debugger & Pusher)
 * Purpose: Diagnose and Force State for Zen-Zentral Dashboard.
 * Only runs on pages that contain the Zen UI elements.
 */

class ZenMechanicAgent {
    constructor() {
        this.name = 'Zen Mechanic';
        console.log(`[${this.name}] Online. Monitoring Zen frequencies...`);

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.runDiagnostics());
        } else {
            this.runDiagnostics();
        }

        window.forceZenOpen = () => this.forceOpen();
    }

    isZenPage() {
        return !!(document.getElementById('flow-point')
            || document.getElementById('prisma-menu')
            || document.getElementById('zen-core')
            || document.body.classList.contains('zen-dashboard')
            || /zen[-_]?central|zen_dashboard/i.test(window.location.pathname));
    }

    runDiagnostics() {
        if (!this.isZenPage()) {
            console.log(`[${this.name}] Standby — no Zen UI on this page.`);
            return;
        }

        console.group(`[${this.name}] Running Diagnostic Scan`);

        const menu = document.getElementById('prisma-menu');
        const flowPoint = document.getElementById('flow-point');
        const core = document.getElementById('zen-core');
        const overlay = document.getElementById('detail-overlay');

        this.logElementStatus('Prisma Menu', menu);
        this.logElementStatus('Flow Point', flowPoint);
        this.logElementStatus('Zen Core', core);
        this.logElementStatus('Detail Overlay', overlay);

        if (flowPoint) {
            setTimeout(() => {
                flowPoint.click();
                this.checkPostClickState();
            }, 3000);
        }

        console.groupEnd();
    }

    logElementStatus(label, el) {
        if (!el) {
            console.warn(`${label}: not present on this page`);
            return;
        }
        const style = window.getComputedStyle(el);
        console.log(`${label}: FOUND ✅ visible=${style.display !== 'none'}`);
    }

    checkPostClickState() {
        const menu = document.getElementById('prisma-menu');
        if (!menu) return;
        const isActive = menu.classList.contains('active');
        if (!isActive) {
            this.forceOpen();
            this.showRepairTool();
        }
    }

    forceOpen() {
        const menu = document.getElementById('prisma-menu');
        const flowPoint = document.getElementById('flow-point');
        if (menu) {
            menu.classList.add('active');
            menu.style.opacity = '1';
            menu.style.pointerEvents = 'auto';
        }
        if (flowPoint) {
            flowPoint.classList.add('bg-electric/20', 'border-electric');
            const icon = flowPoint.querySelector('span');
            if (icon) icon.textContent = 'keyboard_arrow_down';
        }
    }

    showRepairTool() {
        if (document.getElementById('zen-repair-tool')) return;
        const btn = document.createElement('button');
        btn.id = 'zen-repair-tool';
        btn.innerHTML = '<span class="material-symbols-outlined">build</span> REPAIR UI';
        btn.className = 'fixed top-24 right-4 z-[999] bg-red-500 text-white font-bold p-3 rounded-full shadow-lg hover:bg-red-400 flex items-center gap-2 text-xs uppercase tracking-widest';
        btn.onclick = () => {
            this.forceOpen();
            alert('Forced Menu Open State. Check layout.');
        };
        document.body.appendChild(btn);
    }
}

window.ZenMechanic = new ZenMechanicAgent();
