import re

heart_html_path = r'D:\circle-d-flow-web\pages\heart.html'
with open(heart_html_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update Onboarding Screen to have Auth Forms (Login / Register)
auth_forms = """    <!-- 2. REGISTRATION / LOGIN (Auth) -->
    <div id="onboarding-screen" class="fixed inset-0 z-[90] hidden flex-col items-center justify-center bg-[#050505] px-4">
        <div class="glass-panel p-8 max-w-md w-full relative overflow-hidden">
            
            <!-- Auth Toggle -->
            <div class="flex justify-center gap-4 mb-6 border-b border-[#d4af37]/30 pb-2">
                <button onclick="heartApp.toggleAuthMode('login')" id="btn-tab-login" class="text-[#d4af37] font-bold pb-1 border-b-2 border-[#d4af37]">LOGIN</button>
                <button onclick="heartApp.toggleAuthMode('register')" id="btn-tab-register" class="text-gray-500 hover:text-white pb-1 border-b-2 border-transparent">REGISTER</button>
            </div>

            <!-- LOGIN FORM -->
            <div id="form-login" class="flex flex-col animate-fade-in">
                <h2 class="cinzel text-2xl text-[#d4af37] mb-4 text-center">Return to the Heart</h2>
                <input type="email" id="login-email" class="w-full bg-black border border-[#d4af37]/50 text-white px-4 py-2 mb-4 focus:outline-none focus:border-[#d4af37]" placeholder="Email">
                <input type="password" id="login-password" class="w-full bg-black border border-[#d4af37]/50 text-white px-4 py-2 mb-6 focus:outline-none focus:border-[#d4af37]" placeholder="Password">
                <button onclick="heartApp.login()" class="w-full bg-[#d4af37] text-black px-4 py-2 font-bold hover:bg-white transition-all cinzel">LOGIN</button>
            </div>

            <!-- REGISTER FORM -->
            <div id="form-register" class="hidden flex-col animate-fade-in">
                <h2 class="cinzel text-2xl text-[#d4af37] mb-2 text-center">Join the Guilds</h2>
                <p class="text-[10px] text-gray-400 mb-4 text-center">Forge your identity within the Heart World.</p>
                
                <input type="email" id="reg-email" class="w-full bg-black border border-[#d4af37]/50 text-white px-4 py-2 mb-3 text-sm focus:outline-none focus:border-[#d4af37]" placeholder="Email">
                <input type="text" id="reg-username" class="w-full bg-black border border-[#d4af37]/50 text-white px-4 py-2 mb-3 text-sm focus:outline-none focus:border-[#d4af37]" placeholder="Username">
                <input type="password" id="reg-password" class="w-full bg-black border border-[#d4af37]/50 text-white px-4 py-2 mb-3 text-sm focus:outline-none focus:border-[#d4af37]" placeholder="Password">
                
                <div class="grid grid-cols-2 gap-2 mb-4">
                    <select id="reg-guild" class="w-full bg-black border border-[#d4af37]/50 text-white px-2 py-2 text-xs focus:outline-none focus:border-[#d4af37]">
                        <option value="" disabled selected>Select Guild</option>
                        <option value="Arts">Arts (Visuals)</option>
                        <option value="Sounds">Sounds (Audio)</option>
                        <option value="Skills">Skills (Services)</option>
                        <option value="Products">Products (Physical)</option>
                        <option value="Healing">Healing (Wellness)</option>
                        <option value="Community">Community Sphere</option>
                    </select>
                    <input type="text" id="reg-role" class="w-full bg-black border border-[#d4af37]/50 text-white px-2 py-2 text-xs focus:outline-none focus:border-[#d4af37]" placeholder="Specific Role (e.g. DJ, Cameraman)">
                </div>
                
                <button onclick="heartApp.register()" class="w-full bg-[#d4af37] text-black px-4 py-2 font-bold hover:bg-white transition-all cinzel">ENTER THE HEART</button>
            </div>
            
            <p id="auth-error" class="text-red-500 text-xs mt-4 text-center hidden"></p>
        </div>
    </div>"""

# Replace the old onboarding block
content = re.sub(
    r'<!-- 2\. REGISTRATION / ONBOARDING \(Hidden initially\) -->.*?</div>\s*</div>',
    auth_forms,
    content,
    flags=re.DOTALL
)

# 2. Add 'Events' and 'Projects' Buttons to Nav
nav_buttons = """<button class="hover:text-[#d4af37] uppercase" onclick="heartApp.showSection('activity-board')">Activity</button>
                <button class="hover:text-[#d4af37] uppercase" onclick="heartApp.showSection('events-board')">Events</button>
                <button class="hover:text-[#d4af37] uppercase" onclick="heartApp.showSection('projects-board')">Projects</button>
                <button class="hover:text-[#d4af37] uppercase" onclick="heartApp.showSection('mission-board')">Missions</button>
                <button class="hover:text-[#d4af37] uppercase" onclick="heartApp.showSection('map-pinning')">Luvo Maps</button>
                <button class="hover:text-[#d4af37] uppercase" onclick="heartApp.showSection('bazar-upload')">Bazar</button>"""

content = re.sub(
    r'<button class="hover:text-\[#d4af37\] uppercase" onclick="heartApp\.showSection\(\'activity-board\'\)">Activity</button>.*?onclick="heartApp\.showSection\(\'bazar-upload\'\)">Bazar</button>',
    nav_buttons,
    content,
    flags=re.DOTALL
)

# 3. Add Profile Click action to User Display
content = re.sub(
    r'<div class="hidden md:block">',
    r'<div class="hidden md:block cursor-pointer hover:opacity-80" onclick="heartApp.toggleModal(\'profile-modal\')">',
    content
)

# 4. Insert Sections for Events and Projects right after Activity Board
events_and_projects = """
            <!-- SECTION: EVENTS BOARD -->
            <section id="section-events-board" class="dashboard-section hidden animate-fade-in">
                <div class="flex justify-between items-center mb-6 border-b border-[#d4af37]/30 pb-2">
                    <h2 class="cinzel text-2xl text-[#d4af37]">Community Events & Jams</h2>
                    <button onclick="heartApp.toggleModal('create-event-modal')" class="bg-[#d4af37] text-black px-4 py-1 text-xs font-bold rounded hover:bg-white transition-all hidden" id="btn-create-event">+ NEW EVENT</button>
                </div>
                <div id="events-feed" class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <!-- Events Injected Here -->
                </div>
            </section>

            <!-- SECTION: PROJECTS BOARD -->
            <section id="section-projects-board" class="dashboard-section hidden animate-fade-in">
                <div class="flex justify-between items-center mb-6 border-b border-[#d4af37]/30 pb-2">
                    <h2 class="cinzel text-2xl text-[#d4af37]">Collaborative Projects</h2>
                    <button onclick="heartApp.toggleModal('create-project-modal')" class="bg-[#d4af37] text-black px-4 py-1 text-xs font-bold rounded hover:bg-white transition-all hidden" id="btn-create-project">+ NEW PROJECT</button>
                </div>
                <div id="projects-feed" class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <!-- Projects Injected Here -->
                </div>
            </section>"""

content = content.replace('</section>\n\n            <!-- SECTION: MISSION BOARD -->', '</section>\n' + events_and_projects + '\n            <!-- SECTION: MISSION BOARD -->')

# 5. Add Modals for Profile, Create Event, Create Project
modals = """
    <!-- Profile Modal -->
    <div id="profile-modal" class="fixed inset-0 z-[150] hidden bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
        <div class="glass-panel p-6 w-full max-w-sm relative text-center">
            <button onclick="heartApp.toggleModal('profile-modal')" class="absolute top-2 right-4 text-gray-500 hover:text-white text-2xl">&times;</button>
            <div class="w-20 h-20 bg-white/10 rounded-full mx-auto mb-4 flex items-center justify-center border-2 border-[#d4af37]">
                <span class="material-symbols-outlined text-4xl text-[#d4af37]">person</span>
            </div>
            <h3 id="modal-username" class="cinzel text-2xl text-white mb-1">Username</h3>
            <p id="modal-guild-role" class="text-xs text-[#d4af37] mb-6">Guild • Role</p>
            
            <div class="flex justify-around mb-6 border-y border-white/10 py-4">
                <div>
                    <p class="text-2xl cinzel text-[#d4af37]" id="modal-exp">0</p>
                    <p class="text-[10px] text-gray-400 uppercase tracking-widest">EXP</p>
                </div>
                <div>
                    <p class="text-2xl cinzel text-[#d4af37]" id="modal-events">0</p>
                    <p class="text-[10px] text-gray-400 uppercase tracking-widest">Events</p>
                </div>
            </div>
            
            <button onclick="heartApp.logout()" class="w-full border border-red-500/50 text-red-500 px-4 py-2 text-sm hover:bg-red-500 hover:text-white transition-all uppercase tracking-widest">Logout</button>
        </div>
    </div>
"""

content = content.replace('<!-- Modals -->', '<!-- Modals -->\n' + modals)

# 6. Make sure to include supabase_client.js and flowee
content = content.replace(
    '<script src="../js/heart.js"></script>',
    '<script type="module" src="../js/data/supabase_client.js"></script>\n    <script type="module" src="../js/heart.js"></script>\n    <script type="module" src="../js/agents/flowee_2026.js"></script>'
)

with open(heart_html_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated heart.html UI")
