/**
 * Agent: Orbital Menu (The Aura-Bar)
 * Purpose: Provides a global, minimalist navigation menu on all sub-pages.
 * Behavior: Floats in top-right, expands on hover/click into a "Fan" of options.
 */

class OrbitalMenuAgent {
    constructor() {
        this.name = "OrbitalMenu";
        const path = window.location.pathname.toLowerCase();
        this.isDashboard = path.includes('dashboard.html') || path.endsWith('dashboard/');
        this.isIndex = path.includes('index.html') || path === '/' || path.endsWith('beta-initiation.html');
        
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    init() {
        // Skip on Dashboard/Index (they have their own Nav)
        if (this.isDashboard || this.isIndex) return;

        console.log(`[${this.name}] Injecting Global Navigation...`);
        this.injectStyles();
        this.renderMenu();
    }

    injectStyles() {
        const style = document.createElement('style');
        style.innerHTML = `
            .orbital-menu-container {
                position: fixed;
                top: 2rem;
                right: 2rem;
                z-index: 1000;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            /* RELEASE TRIGGER (The Orb) */
            .orbital-trigger {
                width: 50px;
                height: 50px;
                background: rgba(0, 0, 0, 0.8);
                border: 2px solid rgba(255, 255, 255, 0.2);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                box-shadow: 0 0 15px rgba(0,0,0,0.5);
                position: relative;
                z-index: 20;
            }
            .orbital-trigger:hover {
                transform: scale(1.1);
                border-color: var(--theme-color, #FBBF24);
                box-shadow: 0 0 25px var(--theme-color, rgba(251, 191, 36, 0.4));
            }
            .orbital-trigger.active {
                transform: rotate(45deg);
                border-color: #EF4444;
            }

            /* XP RING (SVG) */
            .xp-ring-svg {
                position: absolute;
                top: -4px; right: -4px; bottom: -4px; left: -4px;
                width: calc(100% + 8px);
                height: calc(100% + 8px);
                transform: rotate(-90deg);
                pointer-events: none;
            }
            .xp-ring-circle {
                fill: none;
                stroke: var(--theme-color, #FBBF24);
                stroke-width: 2;
                stroke-dasharray: 100, 100; /* Mock full */
                stroke-linecap: round;
                opacity: 0.5;
            }

            /* SATELLITE NODES (The Fan) */
            .orbital-node {
                position: absolute;
                width: 40px;
                height: 40px;
                background: rgba(20, 20, 25, 0.9);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                opacity: 0;
                transform: translate(0, 0) scale(0.5);
                transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
                pointer-events: none;
                z-index: 10;
                cursor: pointer;
            }
            .orbital-node:hover {
                background: var(--node-bg, #333);
                transform: translate(var(--tx), var(--ty)) scale(1.2) !important;
                z-index: 30;
            }

            /* ACTIVE STATE (Fan Out) */
            .orbital-menu-container.open .orbital-node {
                opacity: 1;
                pointer-events: auto;
            }
            
            /* POSITIONS (Relative to Trigger) */
            .orbital-menu-container.open .node-north { transform: translate(0, -70px) scale(1); } /* Settings */
            .orbital-menu-container.open .node-west  { transform: translate(-70px, 0) scale(1); } /* Vault */
            .orbital-menu-container.open .node-south { transform: translate(0, 70px) scale(1); } /* Dashboard */
            .orbital-menu-container.open .node-east  { transform: translate(70px, 0) scale(1); } /* Social */
            .orbital-menu-container.open .node-exit  { transform: translate(50px, -50px) scale(0.8); } /* Logout */

            /* TOOLTIP */
            .orbital-tooltip {
                position: absolute;
                background: black;
                color: white;
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 10px;
                text-transform: uppercase;
                pointer-events: none;
                opacity: 0;
                transition: opacity 0.2s;
                white-space: nowrap;
                border: 1px solid rgba(255,255,255,0.2);
            }
            .orbital-node:hover .orbital-tooltip { opacity: 1; }
        `;
        document.head.appendChild(style);
    }

    renderMenu() {
        const container = document.createElement('div');
        container.className = 'orbital-menu-container';
        container.innerHTML = `
            <!-- SATELLITES -->
            <div class="orbital-node node-north" style="--node-bg: #4B5563" onclick="window.location.href='dashboard.html?view=settings'">
                <span class="material-symbols-outlined text-[18px]">settings</span>
                <div class="orbital-tooltip" style="bottom: 100%; margin-bottom: 5px;">Settings</div>
            </div>

            <div class="orbital-node node-west" style="--node-bg: #F59E0B" onclick="window.location.href='marketplace.html'">
                <span class="material-symbols-outlined text-[18px]">inventory_2</span>
                <div class="orbital-tooltip" style="right: 100%; margin-right: 5px;">Vault</div>
            </div>

            <div class="orbital-node node-south" style="--node-bg: #8B5CF6" onclick="window.location.href='dashboard.html'">
                <span class="material-symbols-outlined text-[18px]">explore</span>
                <div class="orbital-tooltip" style="top: 100%; margin-top: 5px;">Dashboard</div>
            </div>

            <div class="orbital-node node-east" style="--node-bg: #10B981" onclick="window.location.href='navigators_log.html'">
                <span class="material-symbols-outlined text-[18px]">diversity_3</span>
                <div class="orbital-tooltip" style="left: 100%; margin-left: 5px;">Crew</div>
            </div>

            <div class="orbital-node node-exit" style="--node-bg: #EF4444" onclick="window.location.href='logout.html'">
                <span class="material-symbols-outlined text-[18px]">power_settings_new</span>
                <div class="orbital-tooltip" style="left: 100%; margin-left: 5px;">Log Out</div>
            </div>

            <!-- CORE TRIGGER -->
            <div class="orbital-trigger" onclick="this.parentElement.classList.toggle('open'); this.classList.toggle('active')">
                <img src="../Assets/images/logo.png" class="w-full h-full object-cover rounded-full opacity-90">
                
                <!-- XP RING SVG -->
                <svg class="xp-ring-svg" viewBox="0 0 36 36">
                    <path class="xp-ring-circle"
                        d="M18 2.0845
                           a 15.9155 15.9155 0 0 1 0 31.831
                           a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                </svg>
            </div>
        `;
        document.body.appendChild(container);
    }
}

new OrbitalMenuAgent();
