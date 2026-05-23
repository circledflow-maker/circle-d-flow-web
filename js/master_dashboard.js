/**
 * THE GRAND ARCHITECT
 * System Logic for the Master Dashboard (Command Core)
 */

window.GrandArchitect = {
    map: null,
    mode: 'palace', // 'palace' | 'clean'

    init: function() {
        console.log("🏛️ GRAND ARCHITECT: Initializing Command Core...");
        
        // 1. Init Map
        this.initMap();
        
        // 2. Load Data
        this.loadNetworkInternal();

        // 3. Summon Flowee (Royal Mode)
        setTimeout(() => {
            if(window.Flowee) {
                window.Flowee.initRoyalMode();
                window.Flowee.talk(true, "Welcome home, Architect. The resonance is strong tonight.");
            }
            this.handleKineticUI();
        }, 1000);
    },

    handleKineticUI: function() {
        // Check if user is Kinetic
        const userClass = localStorage.getItem('userClass') || (window.userProfile ? window.userProfile.flow_class : null);
        const widgets = document.getElementById('kinetic-widgets');
        const node = document.getElementById('node-kinetic');
        
        if (userClass === 'KINETIC') {
            if(widgets) widgets.style.display = 'block';
            if(node) node.style.display = 'flex';
            console.log("🏃 KINETIC MODE ACTIVE: High-performance widgets and Arena node initialized.");
            
            // Pulse the recovery bar
            setInterval(() => {
                const bar = document.getElementById('recovery-bar');
                const percent = document.getElementById('recovery-percent');
                if(bar && percent) {
                    let val = parseInt(percent.innerText);
                    val = val > 98 ? 85 : val + 1;
                    percent.innerText = val + "%";
                    bar.style.width = val + "%";
                }
            }, 5000);
        }
    },

    initMap: function() {
        // Lisbon Coordinates
        const lisbon = [38.7223, -9.1393];
        
        this.map = L.map('resonance-map', {
            center: lisbon,
            zoom: 13,
            zoomControl: false,
            attributionControl: false
        });

        // Dark Matter Tiles (CartoDB Dark)
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            maxZoom: 19
        }).addTo(this.map);

        // Add "Palace" Marker (User Location)
        const palaceIcon = L.divIcon({
            className: 'custom-palace-icon',
            html: `<div class="w-4 h-4 bg-gold rounded-full shadow-[0_0_20px_#FFD700] animate-pulse"></div>`,
            iconSize: [20, 20]
        });
        L.marker(lisbon, {icon: palaceIcon}).addTo(this.map).bindPopup("The Palace (You)");
    },

    loadNetworkInternal: function() {
        // Simulate fetching nodes (Partners)
        const nodes = [
            { name: "Secret Garden", loc: [38.7100, -9.1400], status: "active" },
            { name: "Outbreak Studio", loc: [38.7300, -9.1500], status: "active" },
            { name: "African Queen", loc: [38.7000, -9.1300], status: "steady" },
            { name: "Malingua", loc: [38.7200, -9.1200], status: "issue" }
        ];

        const list = document.getElementById('active-nodes-list');
        list.innerHTML = '';

        nodes.forEach(node => {
            // Add Marker
            const color = node.status === 'active' ? '#00F0FF' : (node.status === 'issue' ? '#FF0055' : '#FFFFFF');
            
            const nodeIcon = L.divIcon({
                className: 'custom-node-icon',
                html: `<div class="w-3 h-3 rounded-full border border-white" style="background-color: ${color}; box-shadow: 0 0 10px ${color}"></div>`,
                iconSize: [12, 12]
            });
            
            const marker = L.marker(node.loc, {icon: nodeIcon}).addTo(this.map);
            marker.bindPopup(`<b style="color:${color}">${node.name}</b><br>Status: ${node.status.toUpperCase()}`);

            // Draw Line to Center (Resonance)
            const latlngs = [[38.7223, -9.1393], node.loc];
            const polyline = L.polyline(latlngs, {
                color: color,
                weight: 1,
                opacity: 0.5,
                dashArray: '5, 10'
            }).addTo(this.map);

            // Add to UI List
            const li = document.createElement('li');
            li.innerHTML = `<span class="inline-block w-2 h-2 rounded-full mr-2" style="background:${color}"></span>${node.name}`;
            list.appendChild(li);
        });
    },

    toggleView: function(targetMode) {
        const body = document.body;
        if(targetMode === 'clean' && this.mode !== 'clean') {
            // Enter Investor Mode
            body.classList.add('grayscale', 'contrast-125');
            document.getElementById('stained-glass-floor').style.display = 'none';
            document.getElementById('particle-container').style.display = 'none';
            this.mode = 'clean';
            NexusUI.notify("💼 INVESTOR MIRROR ACTIVE. Clean UI initialized.");
        } else {
            // Restore Palace Mode
            body.classList.remove('grayscale', 'contrast-125');
            document.getElementById('stained-glass-floor').style.display = 'block';
            document.getElementById('particle-container').style.display = 'block';
            this.mode = 'palace';
            NexusUI.notify("🏰 PALACE REALITY RESTORED.");
        }
    },

    pulse: function() {
        // Site-wide effect trigger
        alert("📡 KINGDOM PULSE INITIATED!\nSending [AURA_BOOST] to all connected nodes...");
        // In real app, this would update DB or fire websockets
        
        // Visual feedback on map
        const circle = L.circle([38.7223, -9.1393], {
            color: '#FFD700',
            fillColor: '#FFD700',
            fillOpacity: 0.3,
            radius: 50
        }).addTo(this.map);

        let r = 50;
        const anim = setInterval(() => {
            r += 100;
            circle.setRadius(r);
            if(r > 2000) {
                clearInterval(anim);
                this.map.removeLayer(circle);
            }
        }, 50);
    },

    summonArtist: function() {
        const name = prompt("CAST SUMMON: Enter Artist Name to Invoke:");
        if(name) {
            NexusUI.notify(`✨ SUMMONING RITUAL STARTED for [${name}]. Invitation dispatched.`);
        }
    },

    reforgeBrand: function() {
        alert("🛠️ REFORGE BRAND: Opening Brand Guidelines Editor...");
    }
};

// Start
document.addEventListener('DOMContentLoaded', () => {
    window.GrandArchitect.init();
});

// Mock NexusUI if missing (for standalone testing)
if(!window.NexusUI) {
    window.NexusUI = {
        notify: (msg) => console.log(`[NEXUS]: ${msg}`)
    };
}
