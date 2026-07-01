/**
 * World roles, trust gates, and level restrictions per sphere destination
 */
window.WORLD_ROLES = {
    Quest: {
        label: 'Quest Log',
        minTrust: 0,
        destinations: {
            'quest_map.html': { role: 'Navigator', minLevel: 1, trust: 0, desc: 'Lisbon Atlas — GPS quests' },
            'quest_board.html': { role: 'Chronicler', minLevel: 1, trust: 0, desc: 'Active quest codex' },
            'codex.html': { role: 'Archivist', minLevel: 2, trust: 5, desc: 'Lore scriptorium' },
            'hall_of_legends.html': { role: 'Brother', minLevel: 3, trust: 10, desc: 'Brotherhood rankings' },
            'quiz.html': { role: 'Scientist', minLevel: 1, trust: 0, desc: 'Kingdom of Science quiz' },
            'quiz_creation.html': { role: 'Quest Architect', minLevel: 5, trust: 25, desc: 'Create quizzes — needs karma' },
            'navigators_log.html': { role: 'Journalist', minLevel: 1, trust: 0, desc: 'Personal log' },
            'calendar.html': { role: 'Scheduler', minLevel: 1, trust: 0, desc: 'Events calendar' },
            'quest-create.html': { role: 'Quest Architect', minLevel: 4, trust: 20, karma: 10, desc: 'Mint quests — costs karma' },
            'academy.html': { role: 'Scholar', minLevel: 1, trust: 0, desc: 'Participant academy' },
        },
    },
    HighPalast: {
        label: 'High Palast',
        minTrust: 0,
        destinations: {
            'high_palast.html': { role: 'Sovereign', minLevel: 1, trust: 0, desc: 'Palast central hub' },
            'palast_museum.html': { role: 'Curator', minLevel: 2, trust: 15, desc: 'Personal museum' },
            'palast_library.html': { role: 'Librarian', minLevel: 1, trust: 5, desc: 'Palast archive' },
            'library.html': { role: 'Bibliothec Scholar', minLevel: 1, trust: 0, desc: 'D Bibliothec lore' },
            'palast_treasury.html': { role: 'Treasurer', minLevel: 3, trust: 20, desc: 'Flow credits vault' },
        },
    },
    Academy: {
        label: 'Academy',
        destinations: {
            'academy.html': { role: 'Scholar', minLevel: 1, trust: 0 },
            'akademie.html': { role: 'Manga Archivist', minLevel: 2, trust: 5 },
            'quiz.html': { role: 'Scientist', minLevel: 1, trust: 0 },
            'laboratory.html': { role: 'Sound Alchemist', minLevel: 2, trust: 10 },
            'library.html': { role: 'Bibliothec Scholar', minLevel: 1, trust: 0 },
        },
    },
};

window.FLOWEE_WORLD_GUIDES = {
    Quest: {
        title: 'Quest Log Workflow',
        steps: [
            'Step 1 — Open ATLAS on the map. Accept a Lisbon location mission.',
            'Step 2 — Visit the CODEX to track your active quests and rewards.',
            'Step 3 — Reach level 2 to unlock the SCRIPTORIUM lore archives.',
            'Step 4 — At level 3, enter the BROTHERHOOD hall and climb rankings.',
            'Step 5 — Sync XP daily; Flowee grants +10 XP on first quest check-in.',
        ],
        keywords: ['atlas', 'codex', 'scriptorium', 'quest', 'brotherhood', 'calendar', 'academy'],
    },
    HighPalast: {
        title: 'High Palast Workflow',
        steps: [
            'Step 1 — Enter THE PALAST hub. Choose Museum, Library, or Treasury.',
            'Step 2 — Museum unlocks at level 2. Upload exhibits from Vision world.',
            'Step 3 — Treasury opens at level 3 with 20+ trust. Redeem Flow vouchers.',
            'Step 4 — Bibliothek holds world roles and restriction lore.',
            'Step 5 — Daily Palast visit grants +5 XP (once per day).',
        ],
        keywords: ['palast', 'museum', 'treasury', 'library', 'bibliothek', 'curator'],
    },
};
