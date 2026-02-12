/**
 * Agent: Flowee Engine (The Guide)
 * Purpose: Manages Tutorials, Quests, and the Parchment Lightbox interface.
 */

const TutorialQuests = [
    {
        id: 0,
        titleKey: "quest_initi_title", // Initiation
        location: "master_dashboard.html",
        textKey: "quest_initi_text", 
        actionBtnKey: "quest_initi_btn",
        targetUrl: "marketplace.html"
    },
    {
        id: 1,
        titleKey: "quest_econ_title", // The Economy
        location: "marketplace.html",
        textKey: "quest_econ_text",
        triggerAction: "CLICK_ITEM", 
        textAfterActionKey: "quest_econ_success",
        actionBtnKey: "quest_econ_btn", // usually hidden if waiting for action
        targetUrl: "outbreak_tunes.html"
    },
    {
        id: 2,
        titleKey: "quest_vibe_title", // The Vibe
        location: "outbreak_tunes.html",
        textKey: "quest_vibe_text",
        triggerAction: "PLAY_MUSIC",
        textAfterActionKey: "quest_vibe_success",
        actionBtnKey: "quest_vibe_btn",
        targetUrl: "african-queen-kitchen.html"
    }
];

// Check State on Load
window.addEventListener('load', () => {
    // Check if we entered via a "first time" flag (e.g. from registration)
    const urlParams = new URLSearchParams(window.location.search);
    if(urlParams.get('first_time') === 'true') {
        startTutorialSequence();
    } else {
        setTimeout(checkQuestStatus, 1000);
    }
});

function startTutorialSequence() {
    // 1. Welcome Message
    const lang = localStorage.getItem('cqr_lang') || 'en';
    const t = window.LanguageMatrix ? window.LanguageMatrix.translations[lang] : {};
    const welcomeMsg = t["tutorial_welcome"] || "Welcome to the Command Center. This Compass is your navigation tool.";

    if(window.Flowee) {
        // Use Flowee to speak
        window.Flowee.talk(true, welcomeMsg); 
    } else {
        console.log("Flowee Welcome:", welcomeMsg);
    }

    // 2. Wait 3 Seconds -> Show Mission
    setTimeout(() => {
        checkQuestStatus();
    }, 3000);
}

function checkQuestStatus() {
    let user = JSON.parse(localStorage.getItem('cqr_user'));
    if (!user) return; 

    // Safety check
    if(typeof user.quest_step === 'undefined') user.quest_step = 0;

    const currentStep = user.quest_step;
    if (currentStep >= TutorialQuests.length) return; // All done

    const currentQuest = TutorialQuests[currentStep];

    // Are we on the right page?
    if (window.location.pathname.includes(currentQuest.location)) {
        showParchment(currentQuest);
    }
}

function showParchment(quest) {
    if(document.getElementById('quest-overlay')) return;

    // Get Text
    const lang = localStorage.getItem('cqr_lang') || 'en';
    const t = window.LanguageMatrix ? window.LanguageMatrix.translations[lang] : {};
    
    const title = t[quest.titleKey] || "QUEST";
    const text = t[quest.textKey] || "Follow the Flow.";
    const btnText = t[quest.actionBtnKey] || "GO";

    const actionHtml = quest.triggerAction ? 
        `<p style="font-style:italic; color:#8b0000;" data-i18n="waiting_action">(Waiting for action...)</p>` : 
        `<button class="quest-btn" onclick="FloweeEngine.acceptQuest('${quest.targetUrl}')">${btnText}</button>`;

    const html = `
    <div id="quest-overlay">
        <div class="parchment-scroll">
            <img src="../Assets/flowee-happy.png" class="flowee-avatar-quest" onerror="this.src='https://via.placeholder.com/80?text=Flowee'">
            <h2 style="border-bottom: 2px solid #5c4033; padding-bottom: 10px;">${title}</h2>
            <p style="font-size: 1.1em; line-height: 1.6;">${text}</p>
            ${actionHtml}
        </div>
    </div>
    `;
    document.body.insertAdjacentHTML('beforeend', html);
}

function acceptQuest(url) {
    // Mystic Fog Transition
    if(window.MasterBrain) {
        window.MasterBrain.triggerMysticFog(url);
    } else {
        window.location.href = url;
    }
}

function triggerQuestSuccess(actionType) {
    let user = JSON.parse(localStorage.getItem('cqr_user'));
    if(!user) return;

    // Fix potential undefined
    if(typeof user.quest_step === 'undefined') user.quest_step = 0;
    
    const currentQuest = TutorialQuests[user.quest_step];

    if (currentQuest && currentQuest.triggerAction === actionType) {
        // Update User
        user.quest_step++;
        user.xp = (user.xp || 0) + 50;
        localStorage.setItem('cqr_user', JSON.stringify(user));

        // Remove Overlay
        const overlay = document.getElementById('quest-overlay');
        if(overlay) overlay.remove();

        // Get Success Text
        const lang = localStorage.getItem('cqr_lang') || 'en';
        const t = window.LanguageMatrix ? window.LanguageMatrix.translations[lang] : {};
        const successMsg = t[currentQuest.textAfterActionKey] || "Excellent! Moving on...";

        // Flowee Congratulates
        // Flowee Congratulates
        if(window.Flowee) {
             window.Flowee.talk(true, successMsg, "happy");
        } else {
             alert(`Flowee: ${successMsg}`);
        }
        
        // Redirect
        if(currentQuest.targetUrl) {
             if(window.MasterBrain) window.MasterBrain.triggerMysticFog(currentQuest.targetUrl);
             else window.location.href = currentQuest.targetUrl;
        }
    }
}

// Expose
window.FloweeEngine = {
    acceptQuest,
    triggerQuestSuccess
};
