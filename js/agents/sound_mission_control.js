/**
 * Agent: Sound Mission Control
 * Purpose: Manages AI Missions, Trinity Rewards, and Voucher Generation for the Sound Empire.
 */
class SoundMissionControl {
    constructor() {
        this.name = "SoundMissionControl";
        this.missionDb = "cqr_sound_missions";
        this.voucherDb = "cqr_trinity_vouchers";
        
        // Trinity Rewards Definition
        this.trinityRewards = {
            STUDIO: { id: "TR-QTER-01", name: "Studio Time with Qter", category: "Music", buff: "+1 Stall Slot" },
            DINNER: { id: "TR-DIN-02", name: "Imperial Tasting Dinner", category: "Social", buff: "+500 EXP" },
            PHOTO: { id: "TR-PHO-03", name: "Professional CQR Shooting", category: "Art", buff: "Market Boost" }
        };

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    init() {
        console.log(`[${this.name}] Initializing Mission Control...`);
        window.SoundMissionControl = this;
    }

    // --- VOUCHER SYSTEM ---
    generateVoucher(userId, type) {
        const reward = this.trinityRewards[type];
        if(!reward) return null;

        const timestamp = Date.now();
        const hash = `CQR-${reward.id}-${userId.substring(0,4)}-${timestamp.toString(36).toUpperCase()}`;
        
        const voucher = {
            hash: hash,
            owner: userId,
            reward: reward.name,
            buff: reward.buff,
            status: "ACTIVE",
            created: new Date().toISOString()
        };

        this.saveVoucher(voucher);
        return voucher;
    }

    saveVoucher(voucher) {
        const list = this.getVouchers();
        list.push(voucher);
        localStorage.setItem(this.voucherDb, JSON.stringify(list));
        // Sync to cloud if NetworkHub exists
        if(window.NetworkHub) window.NetworkHub.syncData(this.voucherDb, list);
    }

    getVouchers() {
        return JSON.parse(localStorage.getItem(this.voucherDb) || '[]');
    }

    redeemVoucher(hash) {
        const list = this.getVouchers();
        const voucher = list.find(v => v.hash === hash);
        if(voucher && voucher.status === 'ACTIVE') {
            voucher.status = 'REDEEMED';
            voucher.redeemedAt = new Date().toISOString();
            localStorage.setItem(this.voucherDb, JSON.stringify(list));
            return true;
        }
        return false;
    }

    // --- MISSION BRAIN (AI MOCK) ---
    getMissions() {
        let missions = JSON.parse(localStorage.getItem(this.missionDb));
        if(!missions || missions.length === 0) {
            missions = this.seedMissions();
        }
        return missions;
    }

    seedMissions() {
        const seeds = [
            { id: 1, title: "The Sonic Scout", desc: "Scan 3 TukTuk QR Codes in Alfama.", reward: "DINNER", exp: 500, active: true },
            { id: 2, title: "Rhythm Architect", desc: "Upload a 30s Loop to Live Lab. Get 10 Votes.", reward: "STUDIO", exp: 1000, active: true },
            { id: 3, title: "Imperial Witness", desc: "Attend a live LX Cipher. Use Drop FX 5 times.", reward: "PHOTO", exp: 750, active: true }
        ];
        localStorage.setItem(this.missionDb, JSON.stringify(seeds));
        return seeds;
    }

    updateMission(id, data) {
        const list = this.getMissions();
        const index = list.findIndex(m => m.id === id);
        if(index > -1) {
            list[index] = { ...list[index], ...data };
            localStorage.setItem(this.missionDb, JSON.stringify(list));
        }
    }
    
    // UI HELPER for Dashboard
    renderMissionTable(containerId) {
        const container = document.getElementById(containerId);
        if(!container) return;
        
        const missions = this.getMissions();
        container.innerHTML = missions.map(m => `
            <tr class="border-b border-white/5 text-sm hover:bg-white/5 transition-colors">
                <td class="py-3 px-4 text-white">${m.title}</td>
                <td class="py-3 px-4 text-white/50 truncate max-w-[150px]" title="${m.desc}">${m.desc}</td>
                <td class="py-3 px-4 text-electric font-mono text-xs">${m.reward}</td>
                <td class="py-3 px-4 text-right">
                    <button onclick="window.SoundMissionControl.toggleMission(${m.id})" class="px-2 py-1 rounded text-[10px] font-bold uppercase transition-all ${m.active ? 'bg-success/20 text-success border border-success/30 hover:bg-success/30' : 'bg-danger/20 text-danger border border-danger/30 hover:bg-danger/30'}">
                        ${m.active ? 'LIVE' : 'PAUSED'}
                    </button>
                </td>
            </tr>
        `).join('');
    }

    toggleMission(id) {
        const list = this.getMissions();
        const m = list.find(l => l.id === id);
        if(m) {
            m.active = !m.active;
            this.updateMission(id, m);
            // Re-render
            this.renderMissionTable('mission-list-body');
        }
    }
    // UI HELPER for Sanctuary
    renderVoucherWallet(containerId) {
        const container = document.getElementById(containerId);
        if(!container) return;

        const vouchers = this.getVouchers();
        if(vouchers.length === 0) {
            container.innerHTML = '<div class="col-span-full text-center text-white/30 font-mono text-xs py-8">NO VOUCHERS CLAIMED YET.<br>COMPLETE MISSIONS TO EARN REWARDS.</div>';
            return;
        }

        container.innerHTML = vouchers.map(v => `
            <div class="relative group bg-[#0D0D0F] border border-white/10 hover:border-mystic-gold/50 rounded-xl p-4 transition-all overflow-hidden ${v.status === 'REDEEMED' ? 'opacity-50 grayscale' : ''}">
                <div class="absolute inset-0 bg-gradient-to-br from-mystic-gold/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                
                <div class="flex justify-between items-start mb-2">
                    <span class="text-[10px] font-bold uppercase tracking-widest ${v.status === 'ACTIVE' ? 'text-green-400' : 'text-gray-500'}">${v.status}</span>
                    <span class="material-symbols-outlined text-mystic-gold text-lg">stars</span>
                </div>
                
                <h4 class="text-sm font-bold text-white mb-1">${v.reward}</h4>
                <p class="text-[10px] text-white/50 font-mono mb-3">${v.hash}</p>
                
                ${v.status === 'ACTIVE' ? `
                <button onclick="if(confirm('Redeem this voucher? (Irreversible)')) { window.SoundMissionControl.redeemVoucher('${v.hash}'); window.SoundMissionControl.renderVoucherWallet('${containerId}'); }" class="w-full py-2 bg-mystic-gold/10 hover:bg-mystic-gold hover:text-black border border-mystic-gold/30 rounded text-[10px] font-bold uppercase transition-colors">
                    Redeem
                </button>
                ` : `
                <div class="text-[10px] text-center text-white/30 italic">Redeemed: ${v.redeemedAt ? new Date(v.redeemedAt).toLocaleDateString() : 'Unknown'}</div>
                `}
            </div>
        `).join('');
    }
}

new SoundMissionControl();
