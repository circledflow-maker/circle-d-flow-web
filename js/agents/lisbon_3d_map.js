/**
 * Agent: Lisbon 3D Map (Maptalks WebGL Engine)
 * Purpose: Renders a 3D isometric view of Lisbon with real GPS coordinates.
 * Aesthetic: Benin Kingdom / Adinkra (Warm Gold, Sepia, Deep Purple).
 */

class Lisbon3DMap {
    constructor() {
        this.containerId = 'dmap-3d-container';
        
        // Ensure container exists
        if (!document.getElementById(this.containerId)) {
            console.error("[3D Map] Container not found.");
            return;
        }

        // Apply Benin/Adinkra CSS filter to the whole map
        document.getElementById(this.containerId).style.filter = "sepia(0.6) hue-rotate(340deg) brightness(0.9) contrast(1.2)";

        this.initMap();
    }

    initMap() {
        // Initialize Maptalks
        this.map = new maptalks.Map(this.containerId, {
            center: [-9.1393, 38.7223], // Lisbon Center
            zoom: 14,
            pitch: 60,   // Isometric 3D Gaming View
            bearing: -20, // Slight rotation
            zoomControl: false,
            attributionControl: false,
            baseLayer: new maptalks.TileLayer('base', {
                // Using CartoDB Dark Matter for the tech/underground vibe
                urlTemplate: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
                subdomains: ['a','b','c','d']
            })
        });

        // Layer for our 3D Event Beacons
        this.vectorLayer = new maptalks.VectorLayer('vector').addTo(this.map);

        this.initDynamicMarkers();
        
        console.log("🌍 [Lisbon 3D Map] Topographic Data Synchronized.");
    }

    async initDynamicMarkers() {
        // 1. Load static partners (Neutral Zones)
        this.plotPartners();

        // 2. Load system events (Hardcoded for stability)
        this.plotHardcodedEvents();

        // 3. Load dynamic quests from Supabase
        if (window.supabaseClient) {
            this.loadSupabaseMarkers();
            this.subscribeToUpdates();
        }
    }

    plotHardcodedEvents() {
        const events = [
            {
                id: 'circle-d-flow-2026',
                title: 'Circle D Flow 2026',
                date: '27 June 2026',
                desc: 'The main ritual. Automated role assignments for artists go live.',
                lat: 38.7310, lng: -9.1510,
                color: '#D4AF37',
                icon: 'auto_awesome',
                type: 'event',
                flyer: 'assets/images/circle-d-flow-flyer.png',
                reel: 'assets/images/circle-d-flow-reel.mp4',
                merchant: 'assets/images/skills_mentor.png',
                merchantName: 'The High Architect',
                welcome: 'Welcome to the Great Ritual. Are you ready to sync your frequency?'
            },
            {
                id: 'c-riz-party',
                title: 'C-Riz Listening Party',
                date: '02 June 2026',
                desc: 'The genesis of the new wave. Exclusive early preview of the album.',
                lat: 38.7223, lng: -9.1393,
                color: '#8A2BE2',
                icon: 'auto_awesome',
                type: 'event',
                flyer: 'assets/images/c-riz-flyer.jpg',
                merchant: 'assets/images/dj_qter_merchant.png',
                merchantName: 'C-Riz',
                welcome: 'Yo! You found the secret frequency. Enter the zone for the first listen.'
            }
        ];
        events.forEach(e => this.createMarker(e));
    }

    plotPartners() {
        const partners = [
            {
                id: 'hempyroots',
                title: 'Hempy Roots',
                desc: 'Healing Area & Community Bar. Recharge your Flow here.',
                lat: 38.7405, lng: -9.1605,
                color: '#10b981', // Healing Green
                icon: 'diamond', // Gem design
                type: 'healing',
                insta: 'https://www.instagram.com/hempyrootslisboa',
                merchant: 'assets/images/healing_oracle.png',
                merchantName: 'The Hempy Oracle',
                welcome: 'Greetings, seeker of balance. Let the green wisdom restore your flow.'
            },
            {
                id: 'casa-mocambo',
                title: 'Casa Mocambo',
                desc: 'African Heritage & Culture Hub. Authentic healing vibes.',
                lat: 38.7180, lng: -9.1350,
                color: '#10b981',
                icon: 'spa',
                type: 'healing',
                insta: 'https://www.instagram.com/mocambocasa',
                merchant: 'assets/images/casa_mocambo_merchant.png',
                merchantName: 'Mocambo Elder',
                welcome: 'African heritage in every beat. Feel the rhythm of the heart.'
            },
            {
                id: 'hempy-roots',
                title: 'Hempy Roots',
                desc: 'Lisbon Community Hub for herbal healing and urban culture.',
                lat: 38.7230, lng: -9.1380,
                color: '#10b981',
                icon: 'spa',
                type: 'healing',
                insta: 'https://www.instagram.com/hempyrootslisboa',
                merchant: 'assets/images/hempy_roots_merchant.png',
                merchantName: 'Baptista (Hempy Guide)',
                welcome: 'Welcome to the Green Zone. Relax, your Flow is safe here.'
            },
            {
                id: 'secret-garden',
                title: 'Secret Garden LX',
                desc: 'Creative hub and jam session sanctuary.',
                lat: 38.7150, lng: -9.1300,
                color: '#8A2BE2',
                icon: 'yard',
                type: 'event',
                insta: 'https://www.instagram.com/secretgarden_lx',
                merchant: 'assets/images/secret_garden_merchant.png',
                merchantName: 'Garden Keeper',
                welcome: 'The garden is open. Join the resonance.'
            },
            {
                id: 'the-seedge',
                title: 'The Seedge',
                desc: 'Planting the seeds of future culture in Lisbon.',
                lat: 38.7120, lng: -9.1330,
                color: '#D4AF37',
                icon: 'potted_plant',
                type: 'healing',
                insta: 'https://www.instagram.com/the_seedge',
                merchant: 'assets/images/seedge_merchant.png',
                merchantName: 'Seed Master',
                welcome: 'Planting the seeds of the future. Will you help us grow?'
            }
        ];

        partners.forEach(p => this.createMarker(p));
    }

    async loadSupabaseMarkers() {
        const { data: quests, error } = await window.supabaseClient.from('user_quests').select('*');
        if (error) return console.error("[3D Map] Fetch error:", error);
        
        quests.forEach(q => {
            this.createMarker({
                id: q.id,
                title: q.title,
                desc: q.description,
                lat: q.latitude,
                lng: q.longitude,
                color: (q.type === 'event' ? '#8A2BE2' : '#D4AF37'),
                icon: (q.type === 'event' ? 'auto_awesome' : 'castle'),
                type: q.type,
                flyer: q.metadata?.flyer,
                reel: q.metadata?.reel
            });
        });
    }

    subscribeToUpdates() {
        window.supabaseClient.channel('public:user_quests')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'user_quests' }, payload => {
                this.createMarker(payload.new);
            })
            .subscribe();
    }



    createMarker(e) {
        if (this.mapMarkers?.[e.id]) return; // Prevent duplicates

        // Custom animation based on type
        let animation = "pulseMap 2s infinite";
        if (e.type === 'healing') animation = "healingGlow 3s infinite";

        const markerHTML = `
            <div style="position:relative; width:50px; height:70px; display:flex; flex-direction:column; align-items:center;">
                <div style="position:absolute; bottom:0; left:10px; width:30px; height:10px; background:${e.color}; border-radius:50%; filter:blur(8px); animation: ${animation};"></div>
                <div style="width:2px; height:30px; background:linear-gradient(to top, transparent, ${e.color}); margin-bottom:5px;"></div>
                <div style="background:#1a1005; border:2px solid ${e.color}; border-radius:50%; width:36px; height:36px; display:flex; justify-content:center; align-items:center; box-shadow:0 0 20px ${e.color}; cursor:pointer; transform: rotateX(-20deg); animation: ${e.type === 'healing' ? 'gemRotate 4s linear infinite' : 'none'};" title="${e.title}">
                    <span class="material-symbols-outlined" style="color:${e.color}; font-size:20px; font-weight:bold;">${e.icon || 'star'}</span>
                </div>
            </div>
            <style>
                @keyframes pulseMap {
                    0% { transform: scale(1); opacity: 0.8; }
                    50% { transform: scale(2.5); opacity: 0; }
                    100% { transform: scale(1); opacity: 0; }
                }
                @keyframes healingGlow {
                    0%, 100% { transform: scale(1); opacity: 0.6; filter: blur(10px); }
                    50% { transform: scale(2); opacity: 1; filter: blur(16px); }
                }
                @keyframes gemRotate {
                    from { transform: rotateX(-20deg) rotateY(0deg); }
                    to { transform: rotateX(-20deg) rotateY(360deg); }
                }
            </style>
        `;

        const marker = new maptalks.ui.UIMarker([e.lng, e.lat], {
            content: markerHTML,
            verticalAlignment: 'bottom',
            horizontalAlignment: 'middle'
        });

        marker.addTo(this.map).show();
        this.mapMarkers = this.mapMarkers || {};
        this.mapMarkers[e.id] = marker;

        marker.on('click', () => {
            if (e.type === 'healing') {
                if (window.VitalityAgent) {
                    window.VitalityAgent.setResting(true); 
                    if (window.Flowee) window.Flowee.talk(true, `Resting at ${e.title}... Flow Energy recharging.`, "success");
                }
            } else {
                if (window.VitalityAgent) window.VitalityAgent.setResting(false);
            }
            
            if(typeof openLightbox === 'function') {
                openLightbox({
                    title: e.title,
                    date: e.date || 'Active Node',
                    desc: e.desc,
                    flyer: e.flyer,
                    reel: e.reel,
                    insta: e.insta,
                    type: e.type,
                    merchant: e.merchant,
                    merchantName: e.merchantName,
                    welcome: e.welcome
                });
            }
        });
    }

    // Optional: Add a method to fly to a specific coordinate
    flyTo(lat, lng) {
        this.map.animateTo({
            center: [lng, lat],
            zoom: 16,
            pitch: 65,
            bearing: 0
        }, {
            duration: 2000
        });
    }
}

// Auto Initialize
window.addEventListener('DOMContentLoaded', () => {
    window.LisbonMapEngine = new Lisbon3DMap();
});
