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

    emailForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = emailInput.value.trim();
        if (!email) return;

        // Hide error
        errorMessage.className = 'error-hidden';
        errorMessage.innerText = '';

        // Switch to dice screen
        lockScreen.classList.remove('active');
        diceScreen.classList.add('active');

        // Start infinite spin
        cube.classList.add('spinning');

        try {
            // Read URL params for basePrice and eventId
            const urlParams = new URLSearchParams(window.location.search);
            const basePrice = parseInt(urlParams.get('basePrice')) || 1;
            const eventId = urlParams.get('eventId') || 'listening-party-june-2';

            const response = await fetch('/api/roll', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, basePrice, eventId })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Something went wrong');
            }

            // Stop infinite spin, start targeted roll animation
            cube.classList.remove('spinning');
            
            // Calculate rotation based on the rolled number
            // Face 1: front (0, 0)
            // Face 2: top (-90, 0)
            // Face 3: right (0, -90)
            // Face 4: left (0, 90)
            // Face 5: bottom (90, 0)
            // Face 6: back (180, 0)
            
            // We add extra spins (e.g. 1080deg = 3 full rotations) to make it look cool
            const extraSpins = 1440; // 4 full spins
            
            let xRand = 0;
            let yRand = 0;

            switch(data.rolled) {
                case 1: xRand = 0; yRand = 0; break;
                case 2: xRand = -90; yRand = 0; break;
                case 3: xRand = 0; yRand = -90; break;
                case 4: xRand = 0; yRand = 90; break;
                case 5: xRand = 90; yRand = 0; break;
                case 6: xRand = 180; yRand = 0; break;
            }

            // Apply final rotation
            cube.style.transform = `translateZ(-50px) rotateX(${xRand + extraSpins}deg) rotateY(${yRand + extraSpins}deg)`;

            // Wait for animation to finish (3s defined in CSS)
            setTimeout(async () => {
                if(data.alreadyRolled) {
                    resultText.innerText = `You already rolled a ${data.rolled}!`;
                } else {
                    resultText.innerText = `It's a ${data.rolled}!`;
                    
                    // SAVE TO SUPABASE STATS (Analytics)
                    if(window.supabaseClient) {
                        try {
                            await window.supabaseClient.from('dice_stats').insert([{
                                email: email,
                                rolled_value: data.rolled,
                                amount_paid_cents: data.rolled * basePrice * 100,
                                event_id: eventId
                            }]);
                        } catch(e) { console.warn("Stats Sync Failed", e); }
                    }
                } // Added missing closing brace for else block
                
                resultAmount.innerText = data.rolled * basePrice;
                checkoutBtn.href = data.checkout_url;
                
                // Cinematic zoom in
                cube.style.transform += ' scale(1.8)';
                
                resultPopup.classList.remove('hidden');
            }, 3000);

        } catch (error) {
            console.error(error);
            // Go back to lock screen and show error
            cube.classList.remove('spinning');
            diceScreen.classList.remove('active');
            lockScreen.classList.add('active');
            errorMessage.innerText = error.message;
            errorMessage.className = 'error-visible';
        }
    });
});
