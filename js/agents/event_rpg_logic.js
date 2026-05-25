/**
 * Agent: Event RPG Logic
 * Purpose: Translates Event participation (Tickets, GPS, Live Tasks) into RPG progression.
 */

class EventRPGLogic {
    constructor() {
        this.activeEventId = null;
        this.participationStartTime = null;
    }

    /**
     * Call this when a user buys a ticket (simulated or via API)
     */
    async processTicketPurchase(eventId) {
        if (!window.VitalityAgent) return;

        // Reward: 1000 XP + Supporter Status
        window.VitalityAgent.addEXP(1000);
        
        if (window.supabaseClient) {
            const { data: { user } } = await window.supabaseClient.auth.getUser();
            if (user) {
                // Update profile metadata with Supporter Status
                const { data: profile } = await window.supabaseClient.from('profiles').select('metadata').eq('id', user.id).single();
                let metadata = profile?.metadata || {};
                metadata.is_supporter = true;
                metadata.tickets = metadata.tickets || [];
                metadata.tickets.push({ eventId, date: new Date().toISOString() });

                await window.supabaseClient.from('profiles').update({ metadata }).eq('id', user.id);
            }
        }

        if (window.Pusher) window.Pusher.showToast("🎟️ TICKET VALIDATED: +1000 XP & Supporter Status Unlocked!", "success");
    }

    /**
     * Start tracking participant flow (GPS/Dwell time)
     */
    startParticipantTracking(eventId) {
        this.activeEventId = eventId;
        this.participationStartTime = Date.now();
        if (window.Pusher) window.Pusher.showToast("⚔️ EVENT PARTICIPATION DETECTED: Stay active for 2 hours to earn the Community Rune.", "info");
    }

    checkParticipationProgress() {
        if (!this.participationStartTime) return;
        
        const elapsedMinutes = (Date.now() - this.participationStartTime) / (1000 * 60);
        if (elapsedMinutes >= 120) { // 2 hours
            this.grantCommunityRune();
            this.participationStartTime = null; // Reset
        }
    }

    async grantCommunityRune() {
        if (window.Pusher) window.Pusher.showToast("🤝 RUNE UNLOCKED: BOA ME NA ME MMOA WO (The Community Seal)", "celebrate");
        // Logic to add rune to profile
    }
}

window.EventRPG = new EventRPGLogic();
