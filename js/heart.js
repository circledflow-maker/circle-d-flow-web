import { supabase, heartData } from './data/supabase_client.js';

// Define the global app variable
window.heartApp = {
    user: null,
    
    async init() {
        console.log("Heart World Module Initialized.");

        const mockSession = localStorage.getItem('mock_heart_session');
        if (mockSession) {
            this.handleAuthSuccess(JSON.parse(mockSession));
            return;
        }
        
        try {
            // Setup auth state listener
            supabase.auth.onAuthStateChange((event, session) => {
                if (session) {
                    this.handleAuthSuccess(session.user);
                } else {
                    if(!localStorage.getItem('mock_heart_session')) {
                        this.user = null;
                        this.showGate();
                    }
                }
            });

            // Check current session
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                this.handleAuthSuccess(session.user);
            } else {
                // First time, show Ygdrasil Gate if not authenticated
                this.showGate();
            }
        } catch(e) {
            this.showGate();
        }
    },

    showGate() {
        document.getElementById('main-dashboard').style.display = 'none';
        document.getElementById('onboarding-screen').style.display = 'none';
        document.getElementById('ygdrasil-gate').style.display = 'flex';
        document.getElementById('ygdrasil-gate').style.opacity = '1';
    },

    unlockGate() {
        const pass = document.getElementById('master-password').value.toLowerCase().trim();
        const err = document.getElementById('gate-error');
        if (pass === 'ygdrasil' || pass === 'yggdrasil' || pass === 'yggdrassil' || pass === 'ygdrassil') {
            document.getElementById('ygdrasil-gate').style.opacity = '0';
            setTimeout(() => {
                document.getElementById('ygdrasil-gate').style.display = 'none';
                document.getElementById('onboarding-screen').style.display = 'flex';
                this.toggleAuthMode('login'); // Default to login tab
            }, 1000);
        } else {
            err.style.display = 'block';
            err.innerText = "The tree remains silent. Incorrect password.";
        }
    },

    toggleAuthMode(mode) {
        const loginForm = document.getElementById('form-login');
        const registerForm = document.getElementById('form-register');
        const btnLogin = document.getElementById('btn-tab-login');
        const btnReg = document.getElementById('btn-tab-register');
        const err = document.getElementById('auth-error');
        
        err.classList.add('hidden');
        
        if (mode === 'login') {
            loginForm.classList.remove('hidden');
            loginForm.classList.add('flex');
            registerForm.classList.add('hidden');
            registerForm.classList.remove('flex');
            
            btnLogin.classList.replace('text-gray-500', 'text-[#d4af37]');
            btnLogin.classList.replace('border-transparent', 'border-[#d4af37]');
            btnReg.classList.replace('text-[#d4af37]', 'text-gray-500');
            btnReg.classList.replace('border-[#d4af37]', 'border-transparent');
        } else {
            registerForm.classList.remove('hidden');
            registerForm.classList.add('flex');
            loginForm.classList.add('hidden');
            loginForm.classList.remove('flex');
            
            btnReg.classList.replace('text-gray-500', 'text-[#d4af37]');
            btnReg.classList.replace('border-transparent', 'border-[#d4af37]');
            btnLogin.classList.replace('text-[#d4af37]', 'text-gray-500');
            btnLogin.classList.replace('border-[#d4af37]', 'border-transparent');
        }
    },

    showAuthError(msg) {
        const err = document.getElementById('auth-error');
        err.innerText = msg;
        err.classList.remove('hidden');
    },

    async login() {
        const email = document.getElementById('login-email').value;
        const pass = document.getElementById('login-password').value;
        
        if(!email || !pass) return this.showAuthError("Please provide email and password.");
        
        try {
            const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
            if (error) {
                // Check for fallback
                const mockUserStr = localStorage.getItem('mock_heart_user_' + email);
                if(mockUserStr) {
                    const mockUser = JSON.parse(mockUserStr);
                    if(mockUser.password === pass) {
                        localStorage.setItem('mock_heart_session', JSON.stringify(mockUser));
                        this.handleAuthSuccess(mockUser);
                        return;
                    } else {
                        return this.showAuthError("Invalid credentials.");
                    }
                }
                this.showAuthError(error.message);
            }
        } catch (e) {
            const mockUserStr = localStorage.getItem('mock_heart_user_' + email);
            if(mockUserStr) {
                const mockUser = JSON.parse(mockUserStr);
                if(mockUser.password === pass) {
                    localStorage.setItem('mock_heart_session', JSON.stringify(mockUser));
                    this.handleAuthSuccess(mockUser);
                    return;
                }
            }
            this.showAuthError("Network error. " + e.message);
        }
    },

    async register() {
        const email = document.getElementById('reg-email').value;
        const pass = document.getElementById('reg-password').value;
        const username = document.getElementById('reg-username').value;
        const guild = document.getElementById('reg-guild').value;
        const role = document.getElementById('reg-role').value;
        
        if(!email || !pass || !username || !guild || !role) {
            return this.showAuthError("Please fill all fields to forge your identity.");
        }
        
        const mockFallback = () => {
            const mockUser = {
                id: 'mock_' + Date.now(),
                email: email,
                password: pass,
                user_metadata: {
                    username: username,
                    guild: guild,
                    role_calling: role
                }
            };
            localStorage.setItem('mock_heart_user_' + email, JSON.stringify(mockUser));
            localStorage.setItem('mock_heart_session', JSON.stringify(mockUser));
            this.showToast("Registration Complete", "Welcome to the Heart World.");
            this.handleAuthSuccess(mockUser);
        };

        try {
            // Pass metadata so trigger can create profile
            const { data, error } = await supabase.auth.signUp({
                email,
                password: pass,
                options: {
                    data: {
                        username: username,
                        guild: guild,
                        role_calling: role
                    }
                }
            });
            
            if (error) {
                if(error.message.includes('fetch') || error.message.includes('Failed to fetch')) {
                    mockFallback();
                } else {
                    this.showAuthError(error.message);
                }
            } else {
                this.showToast("Registration Complete", "Welcome to the Heart World.");
                if(data.session) {
                    // Handled by onAuthStateChange
                } else {
                    // Fallback to mock session immediately for dummy usage
                    mockFallback();
                }
            }
        } catch (e) {
            mockFallback();
        }
    },

    async logout() {
        try { await supabase.auth.signOut(); } catch(e) {}
        localStorage.removeItem('mock_heart_session');
        this.user = null;
        document.getElementById('main-dashboard').style.display = 'none';
        this.showGate();
        this.toggleModal('profile-modal');
    },

    async handleAuthSuccess(authUser) {
        // Hide onboarding, show dashboard
        document.getElementById('ygdrasil-gate').style.display = 'none';
        document.getElementById('onboarding-screen').style.display = 'none';
        document.getElementById('main-dashboard').style.display = 'flex';
        
        // Fetch Profile
        const profile = await heartData.getProfile(authUser.id);
        if(profile) {
            this.user = profile;
        } else {
            // Fallback if trigger failed or takes time
            this.user = {
                username: authUser.user_metadata?.username || "Seeker",
                guild: authUser.user_metadata?.guild || "Unknown",
                role_calling: authUser.user_metadata?.role_calling || "Observer",
                exp: 0
            };
        }
        
        this.updateUI();
        this.loadDashboardData();
    },

    updateUI() {
        document.getElementById('user-display-name').innerText = this.user.username;
        document.getElementById('user-display-role').innerText = `${this.user.guild} • ${this.user.role_calling}`;
        document.getElementById('user-points').innerText = this.user.exp;
        
        // Update Profile Modal
        document.getElementById('modal-username').innerText = this.user.username;
        document.getElementById('modal-guild-role').innerText = `${this.user.guild} • ${this.user.role_calling}`;
        document.getElementById('modal-exp').innerText = this.user.exp;
        
        // Only specific roles can create events/projects
        const isEventCreator = ['Community', 'Event', 'Arts', 'Sounds'].includes(this.user.guild) || 
                               ['DJ', 'Rapper', 'Creator', 'Admin'].some(r => this.user.role_calling.toLowerCase().includes(r.toLowerCase()));
        
        if (isEventCreator) {
            const btnE = document.getElementById('btn-create-event');
            const btnP = document.getElementById('btn-create-project');
            if(btnE) btnE.classList.remove('hidden');
            if(btnP) btnP.classList.remove('hidden');
        }
    },

    showSection(sectionId) {
        const sections = document.querySelectorAll('.dashboard-section');
        sections.forEach(s => {
            s.classList.add('hidden');
            s.classList.remove('animate-fade-in');
        });
        
        const target = document.getElementById(`section-${sectionId}`);
        if(target) {
            target.classList.remove('hidden');
            // Trigger reflow for animation
            void target.offsetWidth;
            target.classList.add('animate-fade-in');
        }
    },

    toggleModal(modalId) {
        const modal = document.getElementById(modalId);
        if(!modal) return;
        if(modal.classList.contains('hidden')) {
            modal.classList.remove('hidden');
            modal.classList.add('flex');
        } else {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        }
    },

    showToast(title, msg) {
        const t = document.getElementById('toast-notification');
        document.getElementById('toast-title').innerText = title;
        document.getElementById('toast-message').innerText = msg;
        
        t.classList.remove('translate-y-20', 'opacity-0');
        t.classList.add('translate-y-0', 'opacity-100');
        
        setTimeout(() => {
            t.classList.remove('translate-y-0', 'opacity-100');
            t.classList.add('translate-y-20', 'opacity-0');
        }, 4000);
    },

    async loadDashboardData() {
        // Load Events
        const events = await heartData.getEvents();
        const evContainer = document.getElementById('events-feed');
        if(evContainer) {
            evContainer.innerHTML = events.length === 0 ? '<p class="text-gray-500 text-xs">No active events.</p>' : '';
            events.forEach(ev => {
                const partsStr = ev.event_participants.map(p => `<span class="bg-black/50 px-2 py-1 rounded border border-[#d4af37]/30 text-[10px]">${p.profiles.username} (${p.event_role})</span>`).join('');
                
                evContainer.innerHTML += `
                    <div class="glass-panel p-4 border-l-4 border-[#d4af37] hover:bg-white/5 transition-all">
                        <div class="flex justify-between items-start mb-2">
                            <h3 class="cinzel text-lg text-[#d4af37]">${ev.title}</h3>
                            <span class="text-[10px] text-gray-400 bg-black px-2 py-1">${new Date(ev.event_date).toLocaleDateString()}</span>
                        </div>
                        <p class="text-xs text-white/70 mb-3">${ev.description}</p>
                        <p class="text-[10px] text-gray-400 mb-3"><span class="material-symbols-outlined text-[12px] inline-block align-middle mr-1">location_on</span> ${ev.location}</p>
                        
                        <div class="flex flex-wrap gap-2 mt-4">
                            ${partsStr}
                        </div>
                    </div>
                `;
            });
        }

        // Load Projects
        const projects = await heartData.getProjects();
        const prjContainer = document.getElementById('projects-feed');
        if(prjContainer) {
            prjContainer.innerHTML = projects.length === 0 ? '<p class="text-gray-500 text-xs">No active projects.</p>' : '';
            projects.forEach(pj => {
                const partsStr = pj.project_members.map(p => `<span class="bg-black/50 px-2 py-1 rounded border border-[#E2725B]/30 text-[10px]">${p.profiles.username} (${p.project_role})</span>`).join('');
                
                prjContainer.innerHTML += `
                    <div class="glass-panel p-4 border-l-4 border-[#E2725B] hover:bg-white/5 transition-all">
                        <div class="flex justify-between items-start mb-2">
                            <h3 class="cinzel text-lg text-[#E2725B]">${pj.title}</h3>
                            <span class="text-[10px] text-gray-400 bg-black px-2 py-1">${pj.status.toUpperCase()}</span>
                        </div>
                        <p class="text-xs text-white/70 mb-3">${pj.description}</p>
                        <div class="flex flex-wrap gap-2 mt-4">
                            ${partsStr}
                        </div>
                    </div>
                `;
            });
        }
    }
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.heartApp.init();
});
