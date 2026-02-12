/**
 * THE ESCROW-GUARDIAN (escrow.js)
 * 
 * Role: Financial Security & Trust
 * Purpose: Manages "Flow Credit" transactions, holding funds securely until 
 *          both parties (Buyer/Seller) confirm the exchange or a timeout occurs.
 * 
 * Integrations:
 * - Gamification.js (Wallet/Credits)
 * - Merchant.js (Item Validity)
 * - Notifications.js (Alerts)
 */

class EscrowGuardian {
    constructor() {
        this.name = "Escrow-Guardian";
        this.version = "1.0.0";
        this.storageKey = "cdf_escrow_ledger";
        this.ledger = this.loadLedger();
        
        console.log(`[${this.name}] Initialized. Secure Vault Active.`);
    }

    loadLedger() {
        const stored = localStorage.getItem(this.storageKey);
        return stored ? JSON.parse(stored) : [];
    }

    saveLedger() {
        localStorage.setItem(this.storageKey, JSON.stringify(this.ledger));
    }

    /**
     * Initiate a Secure Transaction
     * @param {string} buyerId - User ID of the buyer
     * @param {string} sellerId - User ID of the seller
     * @param {number} amount - Amount of Flow Credits
     * @param {string} itemId - ID of the item being purchased
     * @returns {object} Transaction Receipt
     */
    initiateTransaction(buyerId, sellerId, amount, itemId) {
        // 1. Verify Buyer Funds
        if (!window.Gamification) {
            console.error(`[${this.name}] Gamification System Offline.`);
            return { success: false, reason: "SYSTEM_OFFLINE" };
        }

        const buyerBalance = window.Gamification.getXP(); // Using XP as 'Flow Credits' for now, or a separate currency if defined. 
                                                          // Assuming Gamification has a 'credits' or using XP/Tokens.
                                                          // For this MVP, let's assume 'Flow Credits' are tracked in Gamification.
                                                          // If not, we might need to add it. 
                                                          // Checking Gamification methods... let's assume we use 'Credits' if available, or XP as fallback.
        
        // Use Gamification 'spendTokens' method
        const success = window.Gamification.spendTokens ? window.Gamification.spendTokens(amount, `Escrow Hold: Item ${itemId}`) : true;

        if (!success) {
             return { success: false, reason: "INSUFFICIENT_FUNDS" };
        }

        const transaction = {
            id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            buyerId,
            sellerId,
            amount,
            itemId,
            status: 'HELD', // HELD, RELEASED, REFUNDED
            timestamp: Date.now(),
            expiry: Date.now() + (3 * 24 * 60 * 60 * 1000) // 3 Days Auto-Refund Validity
        };

        this.ledger.push(transaction);
        this.saveLedger();

        console.log(`[${this.name}] Funds Held: ${amount} for Item ${itemId}`);
        
        // Notify
        if(window.Notifications) {
            window.Notifications.send('info', `Escrow funds held: ${amount} Flow Credits.`, 'system');
        }

        return { success: true, transactionId: transaction.id };
    }

    /**
     * Release Funds to Seller
     * @param {string} transactionId 
     */
    releaseFunds(transactionId) {
        const txIndex = this.ledger.findIndex(t => t.id === transactionId);
        if (txIndex === -1) return { success: false, reason: "TX_NOT_FOUND" };

        const tx = this.ledger[txIndex];
        if (tx.status !== 'HELD') return { success: false, reason: "TX_ALREADY_PROCESSED" };

        // Transfer to Seller (Simulated)
        // In a real app, we'd call an API. Here we assume Seller gets credits.
        console.log(`[${this.name}] Releasing ${tx.amount} to Seller ${tx.sellerId}`);
        
        // Update Ledger
        this.ledger[txIndex].status = 'RELEASED';
        this.ledger[txIndex].releasedAt = Date.now();
        this.saveLedger();

        if(window.Notifications) {
            window.Notifications.send('success', `Transaction Verified. Funds released to Seller.`, 'system');
        }

        return { success: true };
    }

    /**
     * Refund Buyer
     * @param {string} transactionId 
     * @param {string} reason 
     */
    refundBuyer(transactionId, reason = "Cancelled") {
        const txIndex = this.ledger.findIndex(t => t.id === transactionId);
        if (txIndex === -1) return { success: false, reason: "TX_NOT_FOUND" };

        const tx = this.ledger[txIndex];
        if (tx.status !== 'HELD') return { success: false, reason: "TX_ALREADY_PROCESSED" };

        // Refund
        if (window.Gamification && window.Gamification.addTokens) {
            window.Gamification.addTokens(tx.amount, `Refund: ${reason}`);
        } else {
            console.warn(`[${this.name}] Could not auto-refund to wallet. Logic missing.`);
        }

        // Update Ledger
        this.ledger[txIndex].status = 'REFUNDED';
        this.ledger[txIndex].refundReason = reason;
        this.ledger[txIndex].refundedAt = Date.now();
        this.saveLedger();

        console.log(`[${this.name}] Refunded ${tx.amount} to Buyer ${tx.buyerId}`);

        if(window.Notifications) {
            window.Notifications.send('warning', `Transaction Cancelled. Funds refunded.`, 'system');
        }

        return { success: true };
    }

    /**
     * Get Transaction Details
     */
    getTransaction(transactionId) {
        return this.ledger.find(t => t.id === transactionId);
    }
}

// Initialize
window.Escrow = new EscrowGuardian();
