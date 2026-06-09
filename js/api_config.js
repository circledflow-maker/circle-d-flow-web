/**
 * Circle D Flow - API Configuration
 * Securely stores endpoint and credential mappings for the Agentic Bridge.
 */

const API_CONFIG = {
    // Meta WhatsApp Cloud API
    whatsapp: {
        apiUrl: "https://graph.facebook.com/v22.0",
        phoneId: "1011847962012735",
        whatsappId: "2287277265092772",
        accessToken: "EAANdoxVBbuYBRNuLSHi0hvwYsrbGLiAFZAg1GXqg0DrO97cmhHCvmjXmDVxvZAwiUj3R2Y6Wi8tUliXM5NqKLx0XkpY9LdHGUTfvgZBViKoYSBAecObKfI85KOv5oKIZAjoC2gmJZBAqv3x8Bcphw34EdrTFILFolMGoyy1MuqzXgZBbwMZB8mi0y2qXtguorXhHpLxzbQWVrgykpFLGloH67ThHkaTzCQByqZA1MAuS8vdZBhuVd9GPq3CbsworAW2SWobhxlvnB1dDGj0UPmG2V",
        recipientPhone: "+391912828940" // User WhatsApp Number
    },
    
    // Vision Oasis Categories (v5.0 - High-Tech Soul)
    vision: {
        categories: [
            { id: 'circle_d_jam', label: 'Circle D Jam', topics: ['Tiny Desk Concept', 'Community Beats', 'Live Sessions'] },
            { id: 'soul_of_lisbon', label: 'Soul of Lisbon', topics: ['Local Spotlight', 'Street Art', 'Culture'] },
            { id: 'flow_philosophy', label: 'Flow Philosophy', topics: ['Anime Wisdom', 'Quotes', 'Manga Warps'] }
        ],
        postingCycle: 'Daily (User Validation Required)'
    },
    
    // n8n PikaPod (Weltenbaum-Reaktor)
    google: {
        clientId: 'YOUR_GOOGLE_CLIENT_ID',
        apiKey: 'YOUR_GOOGLE_API_KEY',
        appId: 'YOUR_GOOGLE_APP_ID'
    },
    n8n: {
        baseUrl: "https://feathered-swan.pikapod.net",
        webhookUrl: "https://feathered-swan.pikapod.net/webhook/agentic-sync",
        reportUrl: "https://feathered-swan.pikapod.net/webhook/weekly-report"
    }
};

window.API_CONFIG = API_CONFIG;

