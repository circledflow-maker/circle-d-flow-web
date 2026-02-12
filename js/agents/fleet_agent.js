/**
 * AGENT: FLEET AGENT (The Imperial Dispatcher)
 * Role: Manages the TukTuk Fleet, Driver Status, and Booking Logic.
 */

window.FleetAgent = {
    name: "FleetAgent",
    STORAGE_KEY: "cdf_fleet_status",
    
    // Config
    RANK_REQ: "Voyager", // Min rank to apply
    
    init: function() {
        console.log(`[${this.name}] Signal Online.`);
        this.renderMapMarkers();
    },

    // --- 1. DRIVER VERIFICATION ---
    
    // Simulate Image Analysis API
    verifyDriver: function(photoFile) {
        return new Promise((resolve) => {
            console.log(`[${this.name}] analyzing_seal_pattern...`);
            setTimeout(() => {
                // Mock Success
                const isVerified = true; 
                if(isVerified) {
                    this.setDriverStatus(true);
                    this.saveFleetData({ verifiedAt: new Date().toISOString() });
                    resolve(true);
                }
            }, 2000);
        });
    },

    setDriverStatus: function(isVerified) {
        const user = JSON.parse(localStorage.getItem('user_gamification_data') || '{}');
        user.is_fleet_member = isVerified;
        localStorage.setItem('user_gamification_data', JSON.stringify(user));
        
        // Notify System
        if(window.Pusher) window.Pusher.broadcast('FLEET_UPDATE', { msg: "New Courier Verified" });
    },

    isDriver: function() {
        const user = JSON.parse(localStorage.getItem('user_gamification_data') || '{}');
        return !!user.is_fleet_member;
    },

    // --- 2. LIVE STATUS (MAP) ---

    toggleOnline: function() {
        const data = this.getFleetData();
        data.isOnline = !data.isOnline;
        
        if(data.isOnline) {
            // Mock Location
            if (navigator.geolocation) {
                 navigator.geolocation.getCurrentPosition((pos) => {
                    data.location = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                    // Fallback for mock if localhost
                    if(data.location.lat === 0) data.location = { lat: 38.7100, lng: -9.1390 }; // Lisbon
                    this.saveFleetData(data);
                 }, () => {
                     // Error/Deny - Default to Alfama
                     data.location = { lat: 38.7120, lng: -9.1290 };
                     this.saveFleetData(data);
                 });
            }
        } else {
            this.saveFleetData(data);
        }

        // UI Event
        window.dispatchEvent(new CustomEvent('fleet-status-change', { detail: { isOnline: data.isOnline } }));
        return data.isOnline;
    },

    getFleetData: function() {
        return JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '{"isOnline": false, "trips": 0, "earnings": 0}');
    },

    saveFleetData: function(data) {
        const current = this.getFleetData();
        const merged = { ...current, ...data };
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(merged));
    },

    // --- 3. BOOKING LOGIC ---

    bookRide: function(driverId) {
        // Mock Booking Flow
        if(confirm("Hail Imperial TukTuk?\n\nFare: 500 FC (Escrow)")) {
            if(window.Gamification && window.Gamification.spendTokens(500, "TukTuk Ride")) {
                alert("🛺 Driver Dispatched! ETA: 4 mins");
                // Simulate Ride Complete after 5s
                setTimeout(() => {
                    if(window.Pusher) window.Pusher.showToast("Destination Reached. +20 Karma", "karma");
                    if(window.Gamification) window.Gamification.addKarma(20, "Eco-Travel");
                }, 5000);
            }
        }
    },

    // --- 4. VISUALIZATION (MAP MOCK) ---
    renderMapMarkers: function() {
        // ... (Existing implementation, update onclick to show card)
        const mapContainer = document.getElementById('lisbon-map-layer');
        if(!mapContainer) return;

        // Clear
        mapContainer.innerHTML = '';

        // Add "Self" if online
        const myStatus = this.getFleetData();
        if(myStatus.isOnline) {
             // ... (Self marker code)
             this.createMarker(mapContainer, 50, 50, 'YOU (Online)', true);
        }

        // Add Mock Drivers
        const mockDrivers = [
            { id: 'd1', name: 'Iron_Lion', zone: 'Alfama', lat: 38, lng: 42, rank: 'Sovereign', karma: 450 },
            { id: 'd2', name: 'Lisbon_Drift', zone: 'Baixa', lat: 60, lng: 20, rank: 'Commander', karma: 210 },
            { id: 'd3', name: 'Eco_Warrior', zone: 'Belem', lat: 25, lng: 70, rank: 'Voyager', karma: 95 }
        ];

        mockDrivers.forEach(d => {
            this.createMarker(mapContainer, d.lat, d.lng, d.name, false, d);
        });
    },

    createMarker: function(container, top, left, label, isSelf, data = null) {
        const marker = document.createElement('div');
        marker.className = "absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group hover:z-50 " + (isSelf ? "z-50" : "z-40");
        marker.style.top = `${top}%`;
        marker.style.left = `${left}%`;
        
        let iconColor = isSelf ? "text-green-500" : "text-amber-500";
        let glow = isSelf ? "animate-ping" : "";

        marker.innerHTML = `
           <div class="relative" onclick="${isSelf ? '' : `window.FleetAgent.showDriverCard('${data.id}', '${data.name}', '${data.zone}', '${data.rank}', ${data.karma})`}">
               <div class="absolute inset-0 bg-white/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
               <span class="material-symbols-outlined ${iconColor} text-2xl drop-shadow-md hover:scale-125 transition-transform">rickshaw</span>
               ${isSelf ? `<div class="absolute top-0 right-0 w-2 h-2 bg-green-400 rounded-full ${glow}"></div>` : ''}
               
               <div class="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 whitespace-nowrap bg-black/80 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none border border-white/10 z-50">
                   ${label} <br> <span class="text-green-400 font-bold">${isSelf ? 'Active' : 'Click to Hail'}</span>
               </div>
           </div>
        `;
        container.appendChild(marker);
    },

    // --- 5. DRIVER CARD LOGIC ---
    
    currentDriverId: null,

    showDriverCard: function(id, name, zone, rank, karma) {
        this.currentDriverId = id;
        const modal = document.getElementById('driver-card-modal');
        if(!modal) return;

        document.getElementById('driver-name').innerText = name;
        document.getElementById('driver-zone').innerText = `Zone: ${zone}`;
        document.getElementById('driver-rank').innerText = rank;
        document.getElementById('driver-karma').innerText = karma;
        
        // Dynamic Avatar Mock
        document.getElementById('driver-avatar').src = `https://placehold.co/200x200/111/green?text=${name.substring(0,2)}`;

        modal.showModal();
    },

    hailCurrentDriver: function() {
        if(!this.currentDriverId) return;
        this.bookRide(this.currentDriverId);
        document.getElementById('driver-card-modal').close();
    }
};

// Auto Init
document.addEventListener('DOMContentLoaded', () => window.FleetAgent.init());
