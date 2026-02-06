class ArchiveSync {
    constructor() {
        this.name = "Archive Sync";
        this.init();
    }

    init() {
        console.log(`[${this.name}] Connected to Scriptorium.`);
        // Listen for Champion events
        document.addEventListener('cypher-champion', (e) => this.logLegend(e.detail));
    }

    logLegend(championData) {
        console.log(`[${this.name}] Recording Legend: ${championData.name}`);
        
        const legendEntry = {
            type: 'cypher_win',
            hero: championData.name,
            title: "Cypher LX Champion",
            desc: `Defeated the competition in the ${new Date().toLocaleDateString()} bracket.`,
            date: new Date().toISOString()
        };

        // Get existing log or init
        let history = JSON.parse(localStorage.getItem('legend_log') || '[]');
        history.push(legendEntry);
        localStorage.setItem('legend_log', JSON.stringify(history));

        this.notify(`History written. ${championData.name} is now a Legend.`);
    }

    notify(msg) {
        const event = new CustomEvent('agent-alert', { detail: { agent: this.name, message: msg } });
        window.dispatchEvent(event);
    }
}

const archiveSync = new ArchiveSync();
window.ArchiveSync = archiveSync;
