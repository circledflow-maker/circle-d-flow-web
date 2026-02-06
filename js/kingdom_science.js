/**
 * KINGDOM OF SCIENCE
 * Logic for academy.html
 */

window.KingdomScience = {
    
    init: function() {
        console.log("🧪 KINGDOM OF SCIENCE: Initializing Experiment...");
        
        // 1. Scroll Listener for De-petrification
        window.addEventListener('scroll', this.handleScroll);
        
        // 2. Blueprint System
        this.loadBlueprints();

        // 3. Summon Flowee (Scientist Mode)
        setTimeout(() => {
            if(window.Flowee) {
                window.Flowee.initScientistMode();
                window.Flowee.talk(true, "10 billion percent chance of success today, Captain!");
            }
        }, 1000);
    },

    handleScroll: function() {
        const heroStone = document.getElementById('hero-stone');
        const scrollY = window.scrollY;
        
        // Calculate break point (fade out stone layer)
        if(heroStone) {
            if(scrollY > 50) {
                heroStone.classList.add('depetrified');
            } else {
                heroStone.classList.remove('depetrified');
            }
        }
    },

    crackStone: function() {
        // Manual trigger for hero section
        const heroStone = document.getElementById('hero-stone');
        if(heroStone) {
            heroStone.classList.add('depetrified');
            // Play sound effect mock
            console.log("🔊 CRACK!");
        }
        // Scroll down slightly
        window.scrollTo({
            top: window.innerHeight * 0.8,
            behavior: 'smooth'
        });
    },

    loadBlueprints: function() {
        const grid = document.getElementById('blueprint-grid');
        if(!grid) return;

        // Mock Data
        const blueprints = [
            { id: 1, name: "Kit-Kat's Truck", icon: "local_shipping", desc: "Mobile unit for culinary distribution.", progress: 65 },
            { id: 2, name: "The Cypher Rig", icon: "speaker_group", desc: "High-fidelity audio streaming setup.", progress: 30 },
            { id: 3, name: "Nen-Scanner V2", icon: "visibility", desc: "Enhanced aura detection algorithm.", progress: 90 },
        ];

        // Clear existing static (if any)
        grid.innerHTML = '';

        blueprints.forEach(bp => {
            const card = document.createElement('div');
            card.className = "blueprint-card bg-blueprint/10 border-2 border-blueprint p-6 relative group overflow-hidden";
            card.innerHTML = `
                <div class="absolute top-2 right-2 text-blueprint opacity-50 font-code text-6xl font-bold">0${bp.id}</div>
                <h3 class="font-hand text-3xl text-white mb-2 rotate-1">${bp.name}</h3>
                <div class="h-32 bg-blueprint/20 my-4 border border-dashed border-white/30 flex items-center justify-center">
                    <span class="material-symbols-outlined text-6xl text-white/20">${bp.icon}</span>
                </div>
                <p class="font-code text-xs text-white/70 mb-4 h-12">${bp.desc}</p>
                
                <div class="w-full bg-black h-2 rounded-full overflow-hidden mb-2">
                    <div class="bg-scienceGreen h-full" style="width: ${bp.progress}%"></div>
                </div>
                <div class="flex justify-between text-[10px] font-code text-white/50 mb-4">
                    <span>PROGRESS</span>
                    <span>${bp.progress}%</span>
                </div>

                <button onclick="KingdomScience.donate(${bp.id})" class="w-full py-2 bg-blueprint text-white font-code font-bold hover:bg-white hover:text-blueprint transition-colors uppercase">
                    Donate Material
                </button>
            `;
            grid.appendChild(card);
        });
    },

    donate: function(id) {
        alert("💎 MATERIAL DONATED! Science points added to project #" + id);
        // Visual update logic would go here
    },

    checkAnswer: function(btn, isCorrect) {
        const parent = btn.parentElement;
        const feedback = document.getElementById('quiz-reward');
        
        // Reset styles
        Array.from(parent.children).forEach(c => c.classList.remove('bg-green-500', 'bg-red-500', 'text-black'));

        if(isCorrect) {
            btn.classList.add('bg-green-500', 'text-black');
            if(feedback) feedback.classList.remove('hidden');
            if(window.Flowee) window.Flowee.talk(true, "Correct! Resonant frequency matched!");
        } else {
            btn.classList.add('bg-red-500', 'text-black');
            if(window.Flowee) window.Flowee.talk(true, "Try again! That logic is flawed.");
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    window.KingdomScience.init();
});
