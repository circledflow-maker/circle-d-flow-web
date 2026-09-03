document.addEventListener('DOMContentLoaded', () => {
    const lockScreen = document.getElementById('lock-screen');
    const diceScreen = document.getElementById('dice-screen');
    const emailForm = document.getElementById('email-form');
    const emailInput = document.getElementById('email-input');
    const errorMessage = document.getElementById('error-message');
    const cube = document.getElementById('cube');
    const resultPopup = document.getElementById('result-popup');
    const resultText = document.getElementById('result-text');
    const resultAmount = document.getElementById('result-amount');
    const checkoutBtn = document.getElementById('checkout-btn');
    const castBtn = document.getElementById('cast-btn');
    const protocolTitle = document.getElementById('protocol-event');

    const urlParams = new URLSearchParams(window.location.search);
    const basePrice = parseInt(urlParams.get('basePrice'), 10) || 0;
    const eventId = urlParams.get('eventId') || 'listening-party-june-2';
    const formula = urlParams.get('formula') || (eventId === 'criz' ? 'calypso' : 'multiply');

    if (protocolTitle) {
        protocolTitle.textContent = eventId === 'criz'
            ? 'Event: c-riz · Calypso entry 10€ + 5€ × the die'
            : (eventId === 'circledflow'
                ? 'Event: Circle D Flow Awakening'
                : 'Roll to set your contribution');
    }

    const canvas = document.getElementById('calypso-canvas');
    const has3d = window.CalypsoScene && canvas && window.CalypsoScene.mount(canvas);
    if (has3d && cube) cube.parentElement.style.display = 'none';

    let sessionEmail = '';

    function showError(msg) {
        errorMessage.innerText = msg;
        errorMessage.className = 'error-visible';
    }

    function faceRotation(rolled) {
        switch (rolled) {
            case 1: return { x: 0, y: 0 };
            case 2: return { x: -90, y: 0 };
            case 3: return { x: 0, y: -90 };
            case 4: return { x: 0, y: 90 };
            case 5: return { x: 90, y: 0 };
            case 6: return { x: 180, y: 0 };
            default: return { x: 0, y: 0 };
        }
    }

    emailForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = emailInput.value.trim();
        if (!email) return;

        if (localStorage.getItem(`has_rolled_${eventId}_${email}`)) {
            showError('You have already rolled the dice. Use your previous checkout link or contact support.');
            return;
        }

        errorMessage.className = 'error-hidden';
        errorMessage.innerText = '';
        sessionEmail = email;
        lockScreen.classList.remove('active');
        diceScreen.classList.add('active');
        if (castBtn) {
            castBtn.disabled = false;
            castBtn.classList.remove('hidden');
        }
        if (resultPopup) resultPopup.classList.add('hidden');
        if (has3d) {
            window.CalypsoScene.setResult(null);
            window.CalypsoScene.setRolling(false);
        }
    });

    async function castDice() {
        if (!sessionEmail || (castBtn && castBtn.disabled)) return;
        if (castBtn) {
            castBtn.disabled = true;
            castBtn.textContent = 'Casting…';
        }
        if (cube) cube.classList.add('spinning');
        if (has3d) window.CalypsoScene.setRolling(true);

        try {
            const response = await fetch('/api/roll', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: sessionEmail,
                    eventId,
                    formula,
                    basePrice: basePrice || undefined
                })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Something went wrong');

            const applyResult = () => {
                if (cube) {
                    cube.classList.remove('spinning');
                    const rot = faceRotation(data.rolled);
                    cube.style.transform = `translateZ(-50px) rotateX(${rot.x}deg) rotateY(${rot.y}deg) scale(1.4)`;
                }
                if (has3d) window.CalypsoScene.setResult(data.rolled);
                resultText.innerText = data.alreadyRolled
                    ? `You already rolled a ${data.rolled}!`
                    : `It's a ${data.rolled}!`;
                resultAmount.innerText = data.amount_eur;
                checkoutBtn.href = data.checkout_url;
                resultPopup.classList.remove('hidden');
                if (castBtn) castBtn.classList.add('hidden');
                if (!data.alreadyRolled && window.supabaseClient) {
                    window.supabaseClient.from('dice_stats').insert([{
                        email: sessionEmail,
                        rolled_value: data.rolled,
                        amount_paid_cents: data.amount_cents,
                        event_id: eventId
                    }]).then(() => {}, (e) => console.warn('Stats Sync Failed', e));
                }
                if (!data.alreadyRolled) {
                    localStorage.setItem(`has_rolled_${eventId}_${sessionEmail}`, 'true');
                }
            };

            if (data.alreadyRolled) {
                applyResult();
            } else {
                setTimeout(applyResult, 2500);
            }
        } catch (error) {
            console.error(error);
            if (cube) cube.classList.remove('spinning');
            if (has3d) window.CalypsoScene.setRolling(false);
            diceScreen.classList.remove('active');
            lockScreen.classList.add('active');
            if (castBtn) {
                castBtn.disabled = false;
                castBtn.textContent = 'Cast the Dice';
            }
            showError(error.message);
        }
    }

    if (castBtn) castBtn.addEventListener('click', castDice);
});
