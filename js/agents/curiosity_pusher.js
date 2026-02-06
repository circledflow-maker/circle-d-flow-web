/**
 * THE CURIOSITY PUSHER (Recommendation Engine)
 * Suggests new content based on reading habits.
 */
class CuriosityPusher {
    constructor() {
        this.readLog = new Set();
        this.init();
    }

    init() {
        console.log("🕵️ [Curiosity] Watching shadows...");
        // Listen for page turns
        // In real app, this would track time spent on pages
    }

    notify(topic) {
        // Mock notification
        if(window.Flowee) {
            window.Flowee.speak(`Captain, since you're studying ${topic}, why not test your skills in the Arena?`);
        }
    }
}
window.CuriosityPusher = new CuriosityPusher();
