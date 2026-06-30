/**
 * BazaarFlowee — contextual guide for Grand Bazaar & guild stalls
 */
window.BazaarFlowee = {
    isActive: false,
    userContext: null,

    async initContext() {
        this.userContext = { user: null, profile: null, listingCount: 0 };
        if (!window.supabaseClient) return;
        try {
            const { data: { user } } = await window.supabaseClient.auth.getUser();
            if (!user) return;
            this.userContext.user = user;
            const { data: profile } = await window.supabaseClient
                .from('profiles')
                .select('username, flow_credits, credits, exp')
                .eq('id', user.id)
                .single();
            this.userContext.profile = profile || {};
            const { count } = await window.supabaseClient
                .from('market_items')
                .select('id', { count: 'exact', head: true })
                .eq('creator_id', user.id)
                .eq('is_active', true);
            this.userContext.listingCount = count || 0;
        } catch (e) { /* offline */ }
    },

    displayName() {
        return this.userContext?.profile?.username || 'Navigator';
    },

    credits() {
        const p = this.userContext?.profile;
        return p?.flow_credits ?? p?.credits ?? (window.Gamification?.state?.wallet?.flowTokens ?? null);
    },

    injectFab() {
        if (document.getElementById('flowee-fab')) return;
        const fab = document.createElement('button');
        fab.id = 'flowee-fab';
        fab.type = 'button';
        fab.setAttribute('aria-label', 'Ask Flowee');
        fab.className = 'fixed z-[60] pointer-events-auto flex items-center justify-center w-12 h-12 rounded-full border-2 border-[#00ffcc]/60 bg-black/80 shadow-[0_0_20px_rgba(0,255,204,0.35)] hover:scale-105 transition-transform';
        fab.style.cssText = 'bottom:max(88px, calc(env(safe-area-inset-bottom) + 72px)); right:max(12px, env(safe-area-inset-right));';
        fab.innerHTML = `<svg viewBox="0 0 100 100" width="28" height="28"><circle cx="50" cy="50" r="18" fill="#00ffcc" opacity="0.9"/></svg>`;
        fab.onclick = () => this.open3DIntro(true);
        document.body.appendChild(fab);
    },

    ensureOverlay() {
        if (document.getElementById('flowee-overlay')) return;
        const el = document.createElement('div');
        el.id = 'flowee-overlay';
        el.className = 'fixed inset-0 z-[9999] bg-black/95 backdrop-blur-md hidden flex flex-col';
        el.innerHTML = `
            <div class="absolute top-4 right-4 z-10">
                <button type="button" onclick="BazaarFlowee.close3D()" class="material-symbols-outlined text-white/50 hover:text-white text-3xl">close</button>
            </div>
            <div class="flex-1 p-4 sm:p-6 flex flex-col justify-end max-w-lg mx-auto w-full">
                <div id="flowee-chat-log" class="space-y-3 mb-4 max-h-[65vh] overflow-y-auto flex flex-col gap-2"></div>
                <div id="flowee-input-zone" class="bg-[#1A1622] rounded-xl p-3 border border-[#00ffcc]/30"></div>
            </div>`;
        document.body.appendChild(el);
    },

    fMsg(text, sender = 'ai') {
        const log = document.getElementById('flowee-chat-log');
        if (!log) return;
        const div = document.createElement('div');
        div.className = sender === 'user'
            ? 'ml-auto bg-white/10 p-3 rounded-xl border border-white/20 text-white max-w-[85%] text-right text-sm leading-relaxed'
            : 'mr-auto bg-[#00ffcc]/10 p-3 rounded-xl border border-[#00ffcc]/20 text-[#00ffcc] max-w-[92%] text-sm leading-relaxed';
        div.innerHTML = text;
        log.appendChild(div);
        log.scrollTop = log.scrollHeight;
    },

    setInput(html) {
        const zone = document.getElementById('flowee-input-zone');
        if (zone) zone.innerHTML = html;
    },

    close3D() {
        const overlay = document.getElementById('flowee-overlay');
        if (overlay) overlay.classList.add('hidden');
        this.isActive = false;
    },

    async open3DIntro(manual = false) {
        if (this.isActive) return;
        await this.initContext();
        this.isActive = true;
        this.ensureOverlay();
        const overlay = document.getElementById('flowee-overlay');
        overlay.classList.remove('hidden');
        const log = document.getElementById('flowee-chat-log');
        if (log) log.innerHTML = '';

        const name = this.displayName();
        const credits = this.credits();
        const listings = this.userContext?.listingCount ?? 0;

        if (manual) {
            this.fMsg(`Hey ${name}. Need a hand in the Bazaar?`);
        } else if (!localStorage.getItem('visited_marketplace')) {
            this.fMsg(`Welcome to the Grand Bazaar, ${name}. Creators and seekers trade artifacts here — 100 Flow Credits = 1 €.`);
            localStorage.setItem('visited_marketplace', 'true');
        } else {
            this.fMsg(`Welcome back, ${name}.${credits != null ? ` You carry <strong>${credits} FC</strong>.` : ''}`);
        }

        setTimeout(() => {
            if (listings > 0) {
                this.fMsg(`You have <strong>${listings}</strong> active listing${listings > 1 ? 's' : ''}.`);
            }
            this.fMsg('What brings you here today?');
            this.setInput(`
                <div class="grid grid-cols-2 gap-2 w-full">
                    <button type="button" onclick="BazaarFlowee.pathExplore()" class="bg-black/50 border border-[#00ffcc]/30 text-[#00ffcc] py-2.5 rounded text-xs font-bold uppercase tracking-wider">Explore</button>
                    <button type="button" onclick="BazaarFlowee.pathSell()" class="bg-[#00ffcc] text-black py-2.5 rounded text-xs font-bold uppercase tracking-wider">Sell</button>
                    <button type="button" onclick="BazaarFlowee.pathMyStall()" class="col-span-2 bg-white/5 border border-white/20 text-white/80 py-2 rounded text-xs font-bold uppercase tracking-wider">My Stall</button>
                </div>
            `);
        }, manual ? 400 : 900);
    },

    async pathExplore() {
        this.fMsg('Explore', 'user');
        this.setInput('<div class="text-[#00ffcc] text-xs animate-pulse py-2">Scanning guild huts...</div>');
        try {
            if (window.supabaseClient) {
                const { data } = await window.supabaseClient
                    .from('market_items')
                    .select('title, price_credits, guild_category')
                    .eq('is_active', true)
                    .order('created_at', { ascending: false })
                    .limit(3);
                if (data?.length) {
                    const lines = data.map(i => `• <strong>${i.title}</strong> (${i.guild_category}, ${i.price_credits} FC)`).join('<br>');
                    this.fMsg(`Fresh artifacts in the flow:<br>${lines}<br><br>Swipe the carousel below or tap <strong>Enter</strong> on a guild hut.`);
                    this.setInput(`
                        <button type="button" onclick="BazaarFlowee.close3D()" class="w-full bg-[#00ffcc]/20 border border-[#00ffcc]/50 text-[#00ffcc] py-3 rounded font-bold uppercase tracking-widest text-xs">Explore 3D Bazaar</button>
                    `);
                    return;
                }
            }
        } catch (e) { /* ignore */ }
        this.fMsg('Swipe the guild cards at the bottom, or tap a hut in the 3D view. Each guild hosts different artifacts.');
        this.setInput(`<button type="button" onclick="BazaarFlowee.close3D()" class="w-full bg-[#00ffcc]/20 border border-[#00ffcc]/50 text-[#00ffcc] py-3 rounded font-bold uppercase tracking-widest text-xs">Got it</button>`);
    },

    pathSell() {
        this.fMsg('Sell', 'user');
        if (!this.userContext?.user) {
            this.fMsg('Sign in first so your artifact links to your Soul Pass.');
            this.setInput(`<a href="login.html" class="block w-full text-center bg-[#00ffcc] text-black py-3 rounded font-bold uppercase text-xs">Sign In</a>`);
            return;
        }
        this.fMsg('1 € = 100 FC. Use the <strong>Forge</strong> to mint name, price, image & guild. I\'ll walk you through it.');
        this.setInput(`
            <button type="button" onclick="BazaarFlowee.close3D(); if(typeof openForge==='function') openForge();" class="w-full bg-[#00ffcc] text-black py-3 rounded font-bold uppercase tracking-widest text-xs">Open Forge</button>
        `);
    },

    pathMyStall() {
        this.fMsg('My Stall', 'user');
        this.setInput('');
        if (!this.userContext?.user) {
            this.fMsg('Your stall unlocks after sign-in.');
            this.setInput(`<a href="login.html" class="block w-full text-center bg-white/10 border border-white/20 text-white py-3 rounded text-xs font-bold uppercase">Sign In</a>`);
            return;
        }
        this.fMsg('Manage listings, edit prices, or remove artifacts from the Bazaar.');
        this.setInput(`
            <button type="button" onclick="BazaarFlowee.close3D(); if(typeof openMyStall==='function') openMyStall();" class="w-full bg-[#00ffcc]/20 border border-[#00ffcc]/50 text-[#00ffcc] py-3 rounded font-bold uppercase text-xs">Open My Stall</button>
        `);
    },

  /** Guild stall pages — update merchant bubble after inventory loads */
    updateStallDialogue(guild, itemCount) {
        const bubble = document.querySelector('.dialogue-bubble');
        if (!bubble) return;
        const lines = {
            Arts: 'Visual souls hang here — resin, masks, digital canvases. Tap FC to buy instantly or Contact the artist.',
            Sounds: 'Beats and frequencies from the underground. Preview with Contact, secure with Flow Credits.',
            Skills: 'Knowledge for trade — mentorships, workshops, craft. Enroll with FC or message the mentor.',
            Products: 'Tangible artifacts — epoxy, gear, royal goods. Every piece crafted with flow.',
            Healing: 'Wellness and alignment offerings. Book a session via FC or direct contact.',
            Services: 'Community services and creative contracts. Connect and collaborate.'
        };
        const base = lines[guild] || 'Welcome to the guild.';
        if (itemCount === 0) {
            bubble.innerHTML = `"${base}"<br><span class="text-[#00ffcc] text-[10px] mt-2 block">No artifacts listed yet — be the first via Forge.</span>`;
        } else {
            bubble.innerHTML = `"${base}"<br><span class="text-[#00ffcc] text-[10px] mt-2 block">${itemCount} artifact${itemCount > 1 ? 's' : ''} ready · 100 FC = 1 €</span>`;
        }
    },

    initStallPage(guild) {
        this._stallGuild = guild;
        this.ensureOverlay();
        this.injectFab();
        const fab = document.getElementById('flowee-fab');
        if (fab) {
            fab.style.bottom = 'max(20px, env(safe-area-inset-bottom))';
            fab.onclick = () => this.openStallHelp(guild);
        }
    },

    async openStallHelp(guild) {
        await this.initContext();
        this.isActive = true;
        this.ensureOverlay();
        document.getElementById('flowee-overlay').classList.remove('hidden');
        const log = document.getElementById('flowee-chat-log');
        if (log) log.innerHTML = '';
        this.fMsg(`Guild of <strong>${guild}</strong> — I'm Flowee.`);
        this.fMsg('• Tap <strong>FC</strong> to pay with Flow Credits<br>• Tap <strong>Contact</strong> to message the merchant<br>• 100 FC = 1 €');
        const name = this.displayName();
        if (this.userContext?.user) {
            this.fMsg(`${name}, want to list here? Use <strong>Forge</strong> from the 3D Bazaar.`);
            this.setInput(`
                <div class="grid gap-2">
                    <a href="marketplace_3d.html?intent=upload" class="block text-center bg-[#00ffcc] text-black py-2.5 rounded text-xs font-bold uppercase">Open Forge</a>
                    <button type="button" onclick="BazaarFlowee.close3D()" class="w-full text-white/60 text-xs uppercase py-1">Dismiss</button>
                </div>`);
        } else {
            this.setInput(`<button type="button" onclick="BazaarFlowee.close3D()" class="w-full bg-[#00ffcc]/20 border border-[#00ffcc]/50 text-[#00ffcc] py-2.5 rounded text-xs font-bold uppercase">Got it</button>`);
        }
    },

    onStallItemsLoaded(count) {
        if (this._stallGuild) this.updateStallDialogue(this._stallGuild, count);
    }
};
