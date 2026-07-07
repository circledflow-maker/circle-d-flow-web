/**
 * Circle D Flow - API Configuration (public IDs only — tokens live on server)
 */

const API_CONFIG = {
    whatsapp: {
        apiUrl: "https://graph.facebook.com/v22.0",
        proxyUrl: "/api/whatsapp",
        phoneId: "1011847962012735",
        whatsappId: "2287277265092772",
        recipientPhone: "+391912828940",
        /** Physical SIM / device root on this PC (Flowee comms lane) */
        simDeviceRoot: "E:\\",
        verifyToken: "CDF_NEXUS_2026"
    },

    vision: {
        categories: [
            { id: 'circle_d_jam', label: 'Circle D Jam', topics: ['Tiny Desk Concept', 'Community Beats', 'Live Sessions'] },
            { id: 'soul_of_lisbon', label: 'Soul of Lisbon', topics: ['Local Spotlight', 'Street Art', 'Culture'] },
            { id: 'flow_philosophy', label: 'Flow Philosophy', topics: ['Anime Wisdom', 'Quotes', 'Manga Warps'] }
        ],
        postingCycle: 'Daily (User Validation Required)'
    },

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
