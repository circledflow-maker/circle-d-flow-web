/**
 * EventManager
 * Handles Event Creation, Storage, and Ticketing.
 * Persists data to localStorage.
 */
class EventManager {
    constructor() {
        this.STORAGE_KEY_EVENTS = 'flow_events_data';
        this.STORAGE_KEY_TICKETS = 'flow_tickets_data';

        // Load Initial Data
        this.events = this.loadEvents();
        this.tickets = this.loadTickets();
    }

    loadEvents() {
        // Try to load from storage
        const stored = localStorage.getItem(this.STORAGE_KEY_EVENTS);

        // If stored exists, parse it.
        // If not, use seed events, SAVE them immediately so next time they exist.
        if (stored) {
            return JSON.parse(stored);
        } else {
            const seeds = this.getSeedEvents();
            // We can't call saveEvents() here because 'this.events' isn't set yet if we are in constructor
            // But we can just return seeds. The first createEvent or delete will save them.
            // Or we can explicitly save them now:
            localStorage.setItem(this.STORAGE_KEY_EVENTS, JSON.stringify(seeds));
            return seeds;
        }
    }

    loadTickets() {
        const stored = localStorage.getItem(this.STORAGE_KEY_TICKETS);
        return stored ? JSON.parse(stored) : [];
    }

    saveEvents() {
        localStorage.setItem(this.STORAGE_KEY_EVENTS, JSON.stringify(this.events));
    }

    saveTickets() {
        localStorage.setItem(this.STORAGE_KEY_TICKETS, JSON.stringify(this.tickets));
    }

    /**
     * Seed some initial events if none exist
     */
    getSeedEvents() {
        return [
            {
                id: 'evt_001',
                title: 'Sunset Jam Session',
                date: '2026-06-15T19:00',
                location: 'Casa Mocambo',
                price: 10,
                stripeLink: 'https://buy.stripe.com/test_aFa7sLdS7bmW37E8Pacs802',
                image: 'https://placehold.co/600x400/222/white?text=Sunset+Jam',
                organizer: 'Circle D Flow',
                description: 'An open jam session for all skill levels.'
            },
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.events));
    }

    createEvent(data) {
        const newEvent = {
            id: 'evt_' + Date.now(),
            ...data,
            timestamp: new Date().toISOString(),
            status: 'upcoming'
        };

        this.events.unshift(newEvent);
        this.saveEvents();

        console.log(`[EventsManager] Created Event: ${newEvent.title}`);
        return newEvent;
    }

        return false;
    }

/**
 * Get all events
 */
getEvents() {
    return this.events;
}

/**
 * Purchase a ticket
 */
purchaseTicket(eventId, user) {
    const event = this.events.find(e => e.id === eventId);
    if (!event) throw new Error("Event not found");

    const ticket = {
        id: `tkt_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        eventId: eventId,
        eventTitle: event.title,
        eventDate: event.date,
        eventLocation: event.location,
        holderName: user.name || "Guest",
        holderEmail: user.email || "guest@example.com",
        purchaseDate: new Date().toISOString(),
        status: 'valid',
        qrData: `FLOW_TICKET:${eventId}:${user.email}:${Date.now()}`
    };

    this.tickets.push(ticket);
    this.saveTickets();

    console.log(`[EventManager] Ticket Purchased: ${ticket.id}`);
    return ticket;
}

/**
 * Get user's tickets
 */
getMyTickets(email) {
    // In a real app we'd filter by user ID. 
    // For prototype, we'll return all tickets or filter by email if provided.
    if (!email) return this.tickets;
    return this.tickets.filter(t => t.holderEmail === email);
}
}

// Global Instance
window.Events = new EventManager();
