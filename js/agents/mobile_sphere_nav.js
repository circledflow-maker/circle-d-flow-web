/**
 * Mobile Sphere Nav — swipe + prev/next between related pages (Taste, Bazaar, Vision, Sound)
 */
(function () {
    const SPHERE_ROUTES = {
        taste: [
            'taste_world_entry.html',
            'taste_world_hub.html',
            'akwaba_kitchen.html',
            'flavor_quest.html',
            'taste_radar.html',
            'kitchen_workspace.html',
        ],
        bazaar: [
            'marketplace.html',
            'marketplace_3d.html',
            'marketplace-stall.html',
            'marketplace-upload.html',
        ],
        vision: [
            'vision_sanctuary.html',
            'vision_oasis.html',
            'vision_studio.html',
            'goal_purpose.html',
            'memory_cave.html',
        ],
        sound: [
            'sound_dashboard.html',
            'sound_stall.html',
            'outbreak_tunes.html',
            'system_radio.html',
        ],
    };

    function currentFile() {
        const p = window.location.pathname.split('/').pop() || '';
        return p.split('?')[0];
    }

    function detectSphere() {
        const file = currentFile();
        for (const [sphere, routes] of Object.entries(SPHERE_ROUTES)) {
            if (routes.some((r) => r.split('?')[0] === file)) return sphere;
        }
        return null;
    }

    function navigate(delta) {
        const sphere = detectSphere();
        if (!sphere) return;
        const routes = SPHERE_ROUTES[sphere];
        const file = currentFile();
        const idx = routes.findIndex((r) => r.split('?')[0] === file);
        if (idx < 0) return;
        const next = routes[(idx + delta + routes.length) % routes.length];
        if (next.split('?')[0] !== file) window.location.href = next;
    }

    function injectUI() {
        if (window.innerWidth > 768 || document.getElementById('sphere-mobile-nav')) return;
        const sphere = detectSphere();
        if (!sphere) return;

        const bar = document.createElement('div');
        bar.id = 'sphere-mobile-nav';
        bar.innerHTML = `
            <button type="button" id="sphere-nav-prev" aria-label="Previous page">‹</button>
            <span id="sphere-nav-label">${sphere}</span>
            <button type="button" id="sphere-nav-next" aria-label="Next page">›</button>
        `;
        document.body.appendChild(bar);

        document.getElementById('sphere-nav-prev').onclick = () => navigate(-1);
        document.getElementById('sphere-nav-next').onclick = () => navigate(1);

        let touchX = null;
        const minSwipe = 70;
        document.body.addEventListener('touchstart', (e) => {
            if (e.touches.length !== 1) return;
            touchX = e.touches[0].clientX;
        }, { passive: true });
        document.body.addEventListener('touchend', (e) => {
            if (touchX == null || !e.changedTouches[0]) return;
            const dx = e.changedTouches[0].clientX - touchX;
            touchX = null;
            if (Math.abs(dx) < minSwipe) return;
            if (dx < 0) navigate(1);
            else navigate(-1);
        }, { passive: true });
    }

    document.addEventListener('DOMContentLoaded', injectUI);
    window.SphereMobileNav = { navigate, detectSphere, SPHERE_ROUTES };
})();
