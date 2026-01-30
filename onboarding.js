// Onboarding Flow
class Onboarding {
    constructor() {
        this.steps = [
            {
                title: "Welcome to Circle D Flow",
                desc: "A living ecosystem where Visuals, Sound, and Taste converge. You are now part of the underground movement.",
                image: "Assets/images/logo.png"
            },
            {
                title: "Earn Respect",
                desc: "Complete quests, attend events, and support local artists to earn XP. Level up from Novice to Legend to unlock exclusive perks.",
                icon: "military_tech" // Material Symbol
            },
            {
                title: "Connect & Create",
                desc: "Use the Marketplace to trade gear and services, or use the Live Map to find what's happening in Lisbon right now.",
                icon: "hub" // Material Symbol
            }
        ];
        this.currentStep = 0;
        this.init();
    }

    init() {
        if (!localStorage.getItem('onboardingComplete')) {
            this.createModal();
            this.showStep(0);
        }
    }

    createModal() {
        const modal = document.createElement('div');
        modal.id = 'onboarding-modal';
        modal.className = 'fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 opacity-0 transition-opacity duration-500';
        modal.innerHTML = `
            <div class="bg-[#1a1625] border border-white/10 w-full max-w-md rounded-2xl p-8 relative overflow-hidden shadow-[0_0_50px_rgba(154,77,255,0.2)]">
                <!-- Background Glow -->
                <div class="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-electric/20 blur-3xl rounded-full pointer-events-none"></div>

                <div id="ob-content" class="relative z-10 text-center transition-all duration-300 transform">
                    <!-- Dynamic Content -->
                </div>

                <div class="flex justify-between items-center mt-8 relative z-10">
                    <div class="flex gap-2" id="ob-dots">
                        <!-- Dots -->
                    </div>
                    <button id="ob-next-btn" class="px-6 py-2 bg-electric text-white font-bold rounded-full hover:bg-white hover:text-black transition-colors">
                        Next
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        // Fade In
        setTimeout(() => modal.classList.remove('opacity-0'), 100);

        // Bind Click
        document.getElementById('ob-next-btn').addEventListener('click', () => this.next());
    }

    showStep(index) {
        const step = this.steps[index];
        const container = document.getElementById('ob-content');
        const dotsLocation = document.getElementById('ob-dots');
        const btn = document.getElementById('ob-next-btn');

        // Render Content
        let visual = '';
        if (step.image) {
            visual = `<img src="${step.image}" class="w-20 h-20 mx-auto mb-6 object-contain drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">`;
        } else {
            visual = `<div class="w-20 h-20 mx-auto mb-6 rounded-full bg-white/5 flex items-center justify-center border border-white/10"><span class="material-symbols-outlined text-4xl text-mystic-gold">${step.icon}</span></div>`;
        }

        container.innerHTML = `
            ${visual}
            <h2 class="text-2xl font-serif font-bold text-white mb-2">${step.title}</h2>
            <p class="text-white/60 text-sm leading-relaxed">${step.desc}</p>
        `;

        // Update Dots
        dotsLocation.innerHTML = this.steps.map((_, i) =>
            `<div class="w-2 h-2 rounded-full transition-colors ${i === index ? 'bg-electric w-4' : 'bg-white/20'}"></div>`
        ).join('');

        // Update Button Text
        btn.textContent = index === this.steps.length - 1 ? 'Enter the Circle' : 'Next';
    }

    next() {
        if (this.currentStep < this.steps.length - 1) {
            this.currentStep++;
            this.showStep(this.currentStep);
        } else {
            this.complete();
        }
    }

    complete() {
        localStorage.setItem('onboardingComplete', 'true');
        const modal = document.getElementById('onboarding-modal');
        modal.classList.add('opacity-0');
        setTimeout(() => modal.remove(), 500);
    }
}

// Auto-Instantiate
document.addEventListener('DOMContentLoaded', () => {
    // Only on index.html or dashboard.html
    if (window.location.pathname.endsWith('index.html') || window.location.pathname.endsWith('/')) {
        new Onboarding(); // Start
    }
});
