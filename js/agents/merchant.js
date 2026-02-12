/**
 * AGENT: THE MERCHANT (The Scribe)
 * Role: Manages the Bazaar's Manifest, categorizes artifacts, and facilitates trade.
 */

window.Merchant = {
    buyItem: function(id, name, cost, seller) {
        // Legacy Support Wrapper
        // Uses the new MarketplaceCore if available
        if (window.MarketplaceCore) {
            const item = { id, title: name, priceFlow: cost, ownerId: seller };
            return window.MarketplaceCore.initiateTrade(item, 'FLOW');
        } else {
            // Fallback for pages where Core isn't loaded
            if (window.Gamification && window.Gamification.spendTokens(cost, `Bought ${name}`)) {
                if(window.Pusher) window.Pusher.showToast(`Acquired: ${name}`, 'success');
                return true;
            }
            return false;
        }
    },

    categorize: function(fileVal) {
        // Simple auto-categorization based on mock logic or file extension
        // This would be the Scribe's job on upload
        return 'Visual_Artifact'; 
    }
};
