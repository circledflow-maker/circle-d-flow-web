/**
 * Sphere Worlds Registry — every orbit world / dashboard destination
 * Used by FlowCompass for beaming menus and hub defaults.
 */
window.SPHERE_WORLDS = {
    HighPalast: {
        label: 'High Palast',
        icon: 'temple_hindu',
        color: '#FFD700',
        hub: 'high_palast.html',
        flowee: 'The High Palast. Your legacy museum, library, and treasury await.',
        destinations: [
            { l: 'THE PALAST', u: 'high_palast.html', icon: 'castle', desc: 'Central hub' },
            { l: 'MUSEUM', u: 'palast_museum.html', icon: 'museum', desc: 'Your exhibits & artifacts' },
            { l: 'LIBRARY', u: 'palast_library.html', icon: 'auto_stories', desc: 'Palast archive & runes' },
            { l: 'BIBLIOTHEK', u: 'library.html', icon: 'menu_book', desc: 'D Bibliothec — deep lore' },
            { l: 'TREASURY', u: 'palast_treasury.html', icon: 'account_balance', desc: 'Flow credits & vouchers' },
        ],
    },
    Academy: {
        label: 'Academy',
        icon: 'school',
        color: '#9a4dff',
        hub: 'academy.html',
        flowee: 'Navigator Academy — manga portfolios, locations, and participant stories.',
        destinations: [
            { l: 'THE ACADEMY', u: 'academy.html', icon: 'groups', desc: 'All participants & navigators' },
            { l: 'MANGA ARCHIVES', u: 'akademie.html', icon: 'auto_stories', desc: 'Bound manga volumes' },
            { l: 'SCIENCE QUIZ', u: 'quiz.html', icon: 'quiz', desc: 'Kingdom of Science' },
            { l: 'HAMMERHEAD LAB', u: 'laboratory.html', icon: 'science', desc: 'Audio science lab' },
            { l: 'BIBLIOTHEK', u: 'library.html', icon: 'menu_book', desc: 'Deep lore library' },
        ],
    },
    Bazaar: {
        label: 'Bazaar',
        icon: 'storefront',
        color: '#cd7f32',
        hub: 'marketplace.html',
        flowee: 'Captain, fresh artifacts from Alfama await at the Bazaar.',
        destinations: [
            { l: 'THE BAZAAR', u: 'marketplace.html', icon: 'storefront', desc: 'Guild marketplace' },
            { l: 'MY STALL', u: 'marketplace-stall.html', icon: 'store', desc: 'Your trader stall' },
            { l: 'THE FORGE', u: 'marketplace-upload.html', icon: 'construction', desc: 'Upload artifacts' },
            { l: 'ARTIFACT VAULT', u: 'artifact_vault.html', icon: 'inventory_2', desc: 'Secured inventory' },
            { l: 'GUILD HALL', u: 'guild.html', icon: 'groups', desc: 'Guild operations' },
        ],
    },
    Battle: {
        label: 'Battleground',
        icon: 'swords',
        color: '#ef4444',
        hub: 'colosseum.html',
        flowee: 'The Arena awaits champions. Ready to spar?',
        destinations: [
            { l: 'COLOSSEUM', u: 'colosseum.html', icon: 'stadium', desc: 'Weekly content clash' },
            { l: 'ARENA', u: 'battle.html', icon: 'swords', desc: 'Live battles' },
            { l: 'BATTLEFIELD', u: 'arena.html', icon: 'shield', desc: 'Combat zone' },
            { l: 'LADDER', u: 'ladder.html', icon: 'leaderboard', desc: 'Rankings' },
            { l: 'MATCH ROOM', u: 'matchroom.html', icon: 'videocam', desc: '1v1 sessions' },
        ],
    },
    Vision: {
        label: 'Vision',
        icon: 'visibility',
        color: '#a855f7',
        hub: 'vision_oasis.html',
        flowee: 'Visual archives, Place Cinema, and the Memory Cave.',
        destinations: [
            { l: 'PLACE CINEMA', u: 'vision_oasis.html', icon: 'movie', desc: 'Location-tagged cinema', transition: 'vision' },
            { l: 'SANCTUARY', u: 'vision_sanctuary.html', icon: 'spa', desc: 'Vision world hub' },
            { l: 'MEMORY CAVE', u: 'memory_cave.html', icon: 'landscape', desc: 'Community legacies' },
            { l: 'PORTFOLIO', u: 'voyage_portfolio.html', icon: 'photo_library', desc: 'Voyage showcase' },
            { l: 'GALLERY', u: 'gallery.html', icon: 'palette', desc: 'Curated visuals' },
            { l: 'SCAN NODE', u: 'flow_area_scan.html', icon: 'qr_code_scanner', desc: 'Unlock map nodes' },
            { l: 'SACRED GARDEN', u: 'kiss-your-heart.html', icon: 'park', desc: 'Kiss Your Heart LX' },
            { l: 'GOALS', u: 'goal_purpose.html', icon: 'flag', desc: 'Purpose & vision board' },
        ],
    },
    Sound: {
        label: 'Sound',
        icon: 'headphones',
        color: '#06b6d4',
        hub: 'sound_dashboard.html',
        flowee: 'DJ Qter is broadcasting. Pick your frequency.',
        destinations: [
            { l: 'SOUND WORLD', u: 'sound_dashboard.html', icon: 'graphic_eq', desc: 'Main audio command', gate: true },
            { l: 'OUTBREAK TUNES', u: 'outbreak_tunes.html', icon: 'music_note', desc: 'Playlists & releases' },
            { l: 'UNDERGROUND', u: 'live-from-the-underground.html', icon: 'podcasts', desc: 'Live pulse / sets' },
            { l: 'DJ SANCTUARY', u: 'qters_sanctuary.html', icon: 'headphones', desc: 'Qter sanctuary' },
            { l: 'HAMMERHEAD LAB', u: 'laboratory.html', icon: 'science', desc: 'Kingdom of Science lab' },
            { l: 'SOUND STALL', u: 'sound_stall.html', icon: 'storefront', desc: 'Audio marketplace stall' },
        ],
    },
    Taste: {
        label: 'Taste',
        icon: 'restaurant',
        color: '#22c55e',
        hub: 'african-queen-kitchen.html',
        flowee: 'AkwabaLX kitchen — taste the flow of Lisbon.',
        destinations: [
            { l: 'THE KITCHEN', u: 'african-queen-kitchen.html', icon: 'restaurant', desc: 'African Queen kitchen' },
            { l: 'FLAVOR QUEST', u: 'flavor_quest.html', icon: 'local_dining', desc: 'Taste missions' },
            { l: 'TASTE RADAR', u: 'taste_radar.html', icon: 'radar', desc: 'Nearby food nodes' },
            { l: 'KITCHEN OPS', u: 'kitchen-dashboard.html', icon: 'dashboard', desc: 'Chef operations' },
            { l: 'AKWABA ENTRY', u: 'taste_world_entry.html', icon: 'door_open', desc: 'Taste world portal' },
        ],
    },
    Connection: {
        label: 'Connection',
        icon: 'hub',
        color: '#ec4899',
        hub: 'artist_sanctuary.html',
        flowee: 'Community sanctuaries, resonance, and C4C links.',
        destinations: [
            { l: 'ARTIST SANCTUARY', u: 'artist_sanctuary.html', icon: 'theater_comedy', desc: '3D performance soul' },
            { l: 'EVENT SANCTUARY', u: 'event_sanctuary.html', icon: 'celebration', desc: 'C4C event space' },
            { l: 'RESONANCE BAR', u: 'coop.html', icon: 'local_bar', desc: 'Co-op & resonance' },
            { l: 'COMMS', u: 'chat.html', icon: 'forum', desc: 'Navigator chat' },
            { l: 'BANTABA', u: 'bantaba.html', icon: 'groups', desc: 'Community circle' },
            { l: 'FLOW FINDER', u: 'partner-scanner.html', icon: 'person_search', desc: 'Find collaborators' },
        ],
    },
    Quest: {
        label: 'Quest Log',
        icon: 'explore',
        color: '#94a3b8',
        hub: 'quest_map.html',
        flowee: 'Atlas, Codex, Brotherhood — Lisbon awaits.',
        destinations: [
            { l: 'ATLAS', u: 'quest_map.html', icon: 'map', desc: 'Lisbon quest map' },
            { l: 'CODEX', u: 'quest_board.html', icon: 'book_2', desc: 'Active quest log' },
            { l: 'SCRIPTORIUM', u: 'codex.html', icon: 'history_edu', desc: 'Lore & archives' },
            { l: 'BROTHERHOOD', u: 'hall_of_legends.html', icon: 'military_tech', desc: 'Legends & turf wars' },
            { l: 'SCIENCE QUIZ', u: 'quiz.html', icon: 'quiz', desc: 'Kingdom of Science' },
            { l: 'QUIZ FORGE', u: 'quiz_creation.html', icon: 'edit_note', desc: 'Create quizzes' },
            { l: 'NAVIGATOR LOG', u: 'navigators_log.html', icon: 'edit', desc: 'Personal journal' },
            { l: 'CALENDAR', u: 'calendar.html', icon: 'calendar_month', desc: 'Events & jams' },
            { l: 'CREATE QUEST', u: 'quest-create.html', icon: 'add_circle', desc: 'Mint a new quest' },
            { l: 'ACADEMY', u: 'academy.html', icon: 'school', desc: 'Participant portfolios' },
        ],
    },
};

window.getSphereWorlds = function (prefix) {
    const p = prefix || 'pages/';
    const out = {};
    Object.keys(window.SPHERE_WORLDS).forEach((id) => {
        const w = window.SPHERE_WORLDS[id];
        out[id] = {
            ...w,
            hub: p + w.hub,
            destinations: w.destinations.map((d) => ({
                ...d,
                u: p + d.u,
            })),
        };
    });
    return out;
};
