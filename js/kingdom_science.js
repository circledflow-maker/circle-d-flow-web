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
            card.className = "blueprint-holo p-6 relative group transform hover:-translate-y-2 transition-transform duration-300";
            card.innerHTML = `
                <div class="absolute top-0 right-0 p-4 text-magitek-blue font-bold text-4xl opacity-20 font-tech">0${bp.id}</div>
                <div class="h-32 border border-magitek-blue/20 flex items-center justify-center bg-black/40 mb-4 group-hover:border-magitek-blue transition-colors">
                    <span class="material-symbols-outlined text-6xl text-white/50 group-hover:text-magitek-blue group-hover:scale-110 transition-all">${bp.icon}</span>
                </div>
                <h3 class="font-royal text-2xl text-white mb-2 tracking-wide">${bp.name}</h3>
                <p class="font-tech text-xs text-white/60 mb-4 h-10 leading-tight">${bp.desc}</p>
                
                <div class="w-full bg-gray-900 h-1 mb-4 overflow-hidden relative">
                    <div class="absolute inset-0 bg-magitek-blue/20"></div>
                    <div class="bg-magitek-blue h-full shadow-[0_0_10px_#00F0FF]" style="width: ${bp.progress}%"></div>
                </div>
                <div class="flex justify-between text-[10px] font-tech text-magitek-blue mb-4 uppercase tracking-wider">
                    <span>Sync Status</span>
                    <span>${bp.progress}%</span>
                </div>

                <button onclick="KingdomScience.donate(${bp.id})" class="ff-btn w-full py-2 text-xs font-bold">
                    Inscryption
                </button>
            `;
            grid.appendChild(card);
        });
    },

    donate: function(id) {
        // Use Referee for rewards
        if(window.Referee) {
            window.Referee.recordVictory(50, "Science Contribution");
        } else {
            alert("💎 MATERIAL DONATED! Science points added.");
        }
    },

    checkAnswer: function(btn, isCorrect) {
        const parent = btn.parentElement;
        const feedback = document.getElementById('quiz-reward');
        
        // Reset styles
        Array.from(parent.children).forEach(c => c.classList.remove('bg-green-500', 'bg-red-500', 'text-black', 'opacity-50'));

        if(isCorrect) {
            btn.classList.add('bg-green-500', 'text-black');
            if(feedback) feedback.classList.remove('hidden');
            
            if(window.Flowee) window.Flowee.talk(true, "Correct! Resonant frequency matched!");
            
            // REWARD INTEGRATION
            if(window.Referee) {
                // 100 XP for Quiz Success + Streak
                window.Referee.recordVictory(100, "Knowledge Check");
            }

            // QUEST VERIFICATION
            if(window.QuestController) {
                window.QuestController.verifyAction('KNOWLEDGE_SUBMIT');
            }
            
            // Disable buttons to prevent spamming
            Array.from(parent.children).forEach(c => c.onclick = null);

        } else {
            btn.classList.add('bg-red-500', 'text-black');
            if(window.Flowee) window.Flowee.talk(true, "Try again! That logic is flawed.");
            
            // Penalty? (Optional)
            if(window.Pusher) window.Pusher.showToast("Analysis Failed. Try again.", 'error');
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    window.KingdomScience.init();
});
