/**
 * NotificationSystem
 * Handles local alerting for Game Masters and Users.
 * Stores notifications in localStorage.
 */
class NotificationSystem {
    constructor() {
        this.STORAGE_KEY = 'cdf_notifications';
        this.notifications = this.load();
    }

    load() {
        const data = localStorage.getItem(this.STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    }

    save() {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.notifications));
        // Dispatch event for UI updates
        window.dispatchEvent(new Event('notificationsUpdated'));
    }

    /**
     * Send a notification
     * @param {string} type - 'info', 'success', 'warning', 'action_required'
     * @param {string} message - The content
     * @param {string} targetRole - 'admin', 'user', 'all'
     */
    send(type, message, targetRole = 'user') {
        const notif = {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2),
            type,
            message,
            targetRole,
            read: false,
            timestamp: new Date().toISOString()
        };

        this.notifications.unshift(notif);
        // Limit to 50
        if (this.notifications.length > 50) this.notifications.pop();

        this.save();
        console.log(`[Notification] Sent: ${message}`);
    }

    getUnread(role = 'user') {
        return this.notifications.filter(n => !n.read && (n.targetRole === role || n.targetRole === 'all'));
    }

    getAll(role = 'user') {
        return this.notifications.filter(n => n.targetRole === role || n.targetRole === 'all');
    }

    markAsRead(id) {
        const n = this.notifications.find(n => n.id === id);
        if (n) {
            n.read = true;
            this.save();
        }
    }
}

window.Notifications = new NotificationSystem();
