
        let currentEventData = null;

        document.addEventListener('DOMContentLoaded', async () => {
            const urlParams = new URLSearchParams(window.location.search);
            const eventId = urlParams.get('id');
            const isMock = urlParams.get('mock');

            if (eventId && window.supabaseClient) {
                try {
                    const { data: event, error } = await window.supabaseClient
                        .from('quests')
                        .select('*')
                        .eq('id', eventId)
                        .single();
                    
                    if (error) throw error;
                    
                    if (event) {
                        currentEventData = event;
                        renderEventData(event);
                    }
                } catch(e) {
                    console.error("Error fetching event:", e);
                    document.getElementById('loading-state').innerHTML = `
                        <div class="flex flex-col items-center justify-center mt-20 text-red-500">
                            <span class="material-symbols-outlined text-4xl mb-2">error</span>
                            <p>Event not found in the network.</p>
                        </div>
                    `;
                }
            } else if (isMock === 'c4c') {
                const mockEvent = {
                    title: 'C4C GATHERING',
                    type: 'Community',
                    description: 'Community 4 Community. Trinity program. Cipher performance, Concert performance, jamsession.',
                    event_date: 'Saturday, 8:00 PM',
                    address: 'ClimaLabs Warehouse',
                    flyer_url: '../Assets/images/manga_flyer.png',
                    needs: {
                        team: [
                            { role: 'Visuals', notes: 'Rayan' },
                            { role: 'Gatekeeper', notes: 'Sandu' },
                            { role: 'Taste', notes: 'Akwaba' }
                        ]
                    }
                };
                currentEventData = mockEvent;
                renderEventData(mockEvent);
            } else {
                document.getElementById('loading-state').innerHTML = `
                    <div class="flex flex-col items-center justify-center mt-20 text-white/50">
                        <p>No valid Event ID provided.</p>
                    </div>
                `;
            }
        });

        function renderEventData(event) {
            document.getElementById('loading-state').classList.add('hidden');
            document.getElementById('impact-content').classList.remove('hidden');

            document.getElementById('event-title').innerText = event.title || 'Unknown Event';
            document.getElementById('checkout-event-title').innerText = event.title || 'Event Ticket';
            document.getElementById('event-type').innerText = event.type || 'Secret Gathering';
            document.getElementById('event-date').innerText = event.event_date || 'Date TBA';
            
            const addr = event.address || 'Location Hidden';
            document.getElementById('event-location').innerHTML = `
                <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addr)}" target="_blank" class="flex items-center gap-2 text-white hover:text-[#d4af37] transition w-full">
                    <span class="material-symbols-outlined text-[#d4af37] text-lg">location_on</span>
                    <span class="truncate">${addr}</span>
                    <span class="material-symbols-outlined text-xs ml-auto opacity-50">open_in_new</span>
                </a>
            `;
            
            if (event.description) {
                const descEl = document.getElementById('event-description');
                descEl.innerText = `"${event.description}"`;
                setTimeout(() => {
                    if (descEl.scrollHeight > descEl.clientHeight) {
                        document.getElementById('vision-more-btn').classList.remove('hidden');
                    }
                }, 100);
            }

            if (event.flyer_url) {
                document.getElementById('flyer-image').style.backgroundImage = `url('${event.flyer_url}')`;
            }

            // Render Crew (Vertical Scroll)
            const crewList = document.getElementById('crew-list');
            crewList.innerHTML = '';
            crewList.className = 'flex flex-col gap-4 pb-4 overflow-y-auto max-h-[60vh] hide-scrollbar w-full items-center';
            
            let participants = [];
            if (event.needs && event.needs.team) {
                // Only show nodes that have been contacted or confirmed (status is not red)
                participants = event.needs.team.filter(p => p.status !== 'red');
            }

            if (participants.length > 0) {
                participants.forEach(p => {
                    const name = p.name || 'Unknown Soul';
                    const role = p.role || 'Participant';
                    
                    // Graceful fallback for broken blob urls (caused by RLS upload errors on sanctuary)
                    const fallbackHtml = `<div class='absolute inset-0 flex items-center justify-center text-white/50 text-xs font-bold tracking-widest'>FLOW</div>`;
                    const imageHtml = p.imgUrl ? `<img src="${p.imgUrl}" onerror="this.outerHTML=\\"${fallbackHtml}\\"" class="w-full h-full object-cover">` : fallbackHtml;
                    
                    const encodedBio = encodeURIComponent(p.bio || '');
                    const encodedSocial = encodeURIComponent(p.socialLink || '');
                    const encodedImg = encodeURIComponent(p.imgUrl || '');
                    const encodedMusic = encodeURIComponent(p.musicLink || '');

                    // Generate a color based on role
                    let color = 'from-gray-500 to-gray-700';
                    if(role.includes('Visual') || role.includes('Art')) color = 'from-purple-500 to-orange-500';
                    if(role.includes('Gate') || role.includes('Sec')) color = 'from-blue-500 to-teal-500';
                    if(role.includes('Taste') || role.includes('Food')) color = 'from-red-500 to-yellow-500';
                    if(role.includes('Audio') || role.includes('DJ') || role.includes('Performance')) color = 'from-[#00ffcc] to-blue-600';

                    crewList.innerHTML += `
                        <div class="shrink-0 w-full max-w-[280px] bg-white/5 border border-white/10 rounded-xl overflow-hidden cursor-pointer hover:border-white/30 transition shadow-lg" onclick="openNodeModal('${name}', '${role}', '${encodedImg}', '${encodedBio}', '${encodedSocial}', '${encodedMusic}')">
                            <div class="w-full aspect-square bg-gradient-to-tr ${color} relative">
                                ${imageHtml}
                            </div>
                            <div class="p-4">
                                <p class="font-bold text-sm tracking-wide text-white truncate uppercase">${name}</p>
                                <p class="text-[10px] uppercase tracking-widest text-[#d4af37] truncate mt-1">${role}</p>
                            </div>
                        </div>
                    `;
                });
            } else {
                crewList.className = 'flex flex-col gap-3';
                crewList.innerHTML = '<p class="text-xs text-white/30 italic">Lineup hidden or not yet defined.</p>';
            }

            // Render Program (Sync Matrix)
            const programList = document.getElementById('program-list');
            if (event.needs && event.needs.syncMatrix && event.needs.syncMatrix.length > 0) {
                programList.innerHTML = '';
                event.needs.syncMatrix.forEach((m, idx) => {
                    const artistDesc = m.assigned || (m.artistId && event.needs.team ? (event.needs.team.find(a => a.id === m.artistId)?.name || '') : '');
                    const badgeHtml = artistDesc ? `<span class="inline-block px-1.5 py-0.5 bg-[#d4af37]/10 text-[#d4af37] border border-[#d4af37]/20 rounded text-[9px] uppercase ml-2">${artistDesc}</span>` : '';
                    
                    programList.innerHTML += `
                        <div class="relative">
                            <div class="absolute -left-[21px] top-1 w-2.5 h-2.5 bg-[#00ffcc] rounded-full shadow-[0_0_8px_#00ffcc]"></div>
                            <h4 class="font-bold text-sm text-white">${m.time} - ${m.label} ${badgeHtml}</h4>
                        </div>
                    `;
                });
            }

            // Populate Bottom Sheet Tickets
            const sheetTickets = document.getElementById('sheet-tickets');
            if (event.needs && event.needs.tickets) {
                const t = event.needs.tickets;
                sheetTickets.innerHTML = '';
                let hasTickets = false;
                
                // Dice Ticket
                if (t.dice && t.dice.isDice) {
                    const basePrice = t.dice.price || 1;
                    const eventIdParam = currentEventData ? currentEventData.id : '';
                    sheetTickets.innerHTML += `
                        <div onclick="window.location.href='../dice.html?basePrice=${basePrice}&eventId=${eventIdParam}'" class="flex items-center justify-between p-4 bg-gradient-to-r from-[#ff00cc]/20 to-transparent border border-[#ff00cc]/30 rounded-xl cursor-pointer hover:bg-[#ff00cc]/10 transition group">
                            <div class="flex items-center gap-3">
                                <span class="material-symbols-outlined text-[#ff00cc] group-hover:animate-spin">casino</span>
                                <div>
                                    <p class="text-sm font-bold text-[#ff00cc] uppercase tracking-widest">${t.dice.name || 'Pay What You Dice'}</p>
                                    <p class="text-xs text-white/50 mt-1">${t.dice.qty ? t.dice.qty + ' left' : 'Available'} • Base €${t.dice.price || 0}</p>
                                </div>
                            </div>
                            <span class="material-symbols-outlined text-[#ff00cc]">arrow_forward</span>
                        </div>
                    `;
                    hasTickets = true;
                }
                
                if (t.ticket1 && t.ticket1.name && t.ticket1.price) {
                    sheetTickets.innerHTML += `
                        <label class="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl cursor-pointer hover:bg-white/10 transition">
                            <div class="flex items-center gap-3">
                                <input type="radio" name="selected_ticket" value="ticket1" class="w-4 h-4 accent-[#00ffcc]" onchange="selectTicket('${t.ticket1.name}', ${t.ticket1.price})">
                                <div>
                                    <p class="text-sm font-bold text-[#00ffcc] uppercase tracking-widest">${t.ticket1.name}</p>
                                    <p class="text-xs text-white/50 mt-1">${t.ticket1.qty ? t.ticket1.qty + ' left' : 'Available'}</p>
                                </div>
                            </div>
                            <span class="text-lg font-serif">€${t.ticket1.price}</span>
                        </label>
                    `;
                    hasTickets = true;
                     if (t.ticket2 && t.ticket2.name && t.ticket2.price) {
                    sheetTickets.innerHTML += `
                        <label class="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl cursor-pointer hover:bg-white/10 transition">
                            <div class="flex items-center gap-3">
                                <input type="radio" name="selected_ticket" value="ticket2" class="w-4 h-4 accent-[#d4af37]" onchange="selectTicket('${t.ticket2.name}', ${t.ticket2.price})">
                                <div>
                                    <p class="text-sm font-bold text-[#d4af37] uppercase tracking-widest">${t.ticket2.name}</p>
                                    <p class="text-xs text-white/50 mt-1">${t.ticket2.qty ? t.ticket2.qty + ' left' : 'Available'}</p>
                                </div>
                            </div>
                            <span class="text-lg font-serif">€${t.ticket2.price}</span>
                        </label>
                    `;
                    hasTickets = true;
                }
                
                if (t.guestlist && t.guestlist.qty && t.guestlist.password) {
                    sheetTickets.innerHTML += `
                        <label class="flex items-center justify-between p-4 bg-white/5 border border-[#00ffcc]/30 rounded-xl cursor-pointer hover:bg-white/10 transition">
                            <div class="flex items-center gap-3">
                                <input type="radio" name="selected_ticket" value="guestlist" class="w-4 h-4 accent-[#00ffcc]" onchange="selectTicket('Guest List', 0, true)">
                                <div>
                                    <p class="text-sm font-bold text-white uppercase tracking-widest">Guest List</p>
                                    <p class="text-xs text-white/50 mt-1">${t.guestlist.qty} left &nbsp;|&nbsp; Password Req.</p>
                                </div>
                            </div>
                            <span class="material-symbols-outlined text-[#00ffcc]">lock</span>
                        </label>
                    `;
                    hasTickets = true;
                }
                
                if (hasTickets) {
                    document.getElementById('sticky-checkout-container').classList.remove('hidden');
                } else {
                    sheetTickets.innerHTML = '<p class="text-center text-white/40 italic text-sm py-4">No tickets available yet.</p>';
                }
            }

            // Flowee Interaction
            document.getElementById('impact-flowee').classList.remove('hidden');
            setTimeout(() => {
                document.getElementById('flowee-bubble').classList.remove('scale-0');
                const title = event.title || 'this manifestation';
                document.getElementById('flowee-message').innerText = `Welcome to ${title}! Swipe right to explore the vision, lineup, and location. I'll guide you through it! ?`;
            }, 1000);

            // Initialize Swiper
            const swiper = new Swiper('.impactSwiper', {
                pagination: {
                    el: '.swiper-pagination',
                    dynamicBullets: true,
                },
                on: {
                    slideChange: function () {
                        const messages = [
                            `This is the main event artifact. Claim your ticket via Stripe below to secure your spot! \u2728`,
                            `The Vision: Every event has a soul. This is the core purpose of why we're gathering. \u2728`,
                            `The Program: The sync matrix. This is the timeline of the flow. \u2728`,
                            `The Crew: Meet the nodes! These are the creatives and organizers making the magic happen. \u2728`,
                            `The Location: Keep this safe. Click the map link to open directions to the gathering. \u2728`
                        ];
                        
                        const msg = messages[this.activeIndex] || messages[0];
                        const bubble = document.getElementById('flowee-bubble');
                        const text = document.getElementById('flowee-message');
                        
                        bubble.classList.add('scale-0');
                        setTimeout(() => {
                            text.innerText = msg;
                            bubble.classList.remove('scale-0');
                        }, 300);
                    }
                }
            });

            // Start Background Slideshow
            const locationWrapper = document.getElementById('location-swiper-wrapper');
            if (locationWrapper) {
                const totalImages = 44; // Exactly 44 images were successfully downloaded and processed
                for (let i = 1; i <= totalImages; i++) {
                    const slide = document.createElement('div');
                    slide.className = 'swiper-slide bg-cover bg-center';
                    slide.style.backgroundImage = `url('../Assets/images/secret_garden/bg_${i}.webp')`;
                    locationWrapper.appendChild(slide);
                }

                new Swiper('.locationSwiper', {
                    nested: true,         // Allows inner swiping without dragging the outer swiper
                    loop: true,           // Infinite swiping
                    grabCursor: true,
                    autoplay: {
                        delay: 3500,
                        disableOnInteraction: false, // Keep autoplaying even after user swipes
                    },
                });
            }
        }

        function toggleBurger() {
            const menu = document.getElementById('burger-menu');
            if (menu.classList.contains('-translate-x-full')) {
                menu.classList.remove('-translate-x-full');
            } else {
                menu.classList.add('-translate-x-full');
            }
        }

        function toggleVision() {
            const el = document.getElementById('event-description');
            const btn = document.getElementById('vision-more-btn');
            if(el.classList.contains('line-clamp-3')) {
                el.classList.remove('line-clamp-3');
                btn.innerText = '- Less';
            } else {
                el.classList.add('line-clamp-3');
                btn.innerText = '+ More';
            }
        }

        function toggleFloweeMessage() {
            const bubble = document.getElementById('flowee-bubble');
            bubble.classList.toggle('scale-0');
        }

        let activeTicketSelection = null;

        function selectTicket(name, price, isGuestList = false) {
            activeTicketSelection = { name, price, isGuestList };
            const btn = document.getElementById('btn-proceed-checkout');
            btn.disabled = false;
            btn.classList.remove('opacity-50', 'cursor-not-allowed');
            if (isGuestList) {
                btn.innerHTML = `<span class="material-symbols-outlined">lock_open</span> Enter Password`;
            } else {
                btn.innerHTML = `<span class="material-symbols-outlined">payments</span> Pay €${price}`;
            }
        }

        function openCheckoutSheet() {
            document.getElementById('checkout-sheet-overlay').classList.remove('hidden');
            document.getElementById('checkout-sheet').classList.remove('translate-y-full');
            setTimeout(() => {
                document.getElementById('checkout-sheet-overlay').classList.remove('opacity-0');
            }, 10);
        }

        function closeCheckoutSheet() {
            document.getElementById('checkout-sheet-overlay').classList.add('opacity-0');
            document.getElementById('checkout-sheet').classList.add('translate-y-full');
            setTimeout(() => {
                document.getElementById('checkout-sheet-overlay').classList.add('hidden');
            }, 300);
        }

        async function proceedToCheckout() {
            if (!activeTicketSelection || !currentEventData) return;
            
            if (activeTicketSelection.isGuestList) {
                openGuestListFlow();
                return;
            }
            
            const btn = document.getElementById('btn-proceed-checkout');
            const orig = btn.innerHTML;
            btn.innerHTML = '<span class="material-symbols-outlined animate-spin">sync</span> Redirecting...';
            btn.disabled = true;

            try {
                const response = await fetch('/api/create-checkout', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        eventId: currentEventData.id,
                        ticketName: activeTicketSelection.name,
                        price: activeTicketSelection.price
                    })
                });
                const data = await response.json();
                if (data.url) {
                    window.location.href = data.url;
                } else {
                    throw new Error(data.error || 'Failed to create checkout session');
                }
            } catch(e) {
                console.error("Checkout error:", e);
                alert("Payment initiation failed. Network error or missing Stripe keys.");
                btn.innerHTML = orig;
                btn.disabled = false;
            }
        }

        function openGuestListFlow() {
            closeCheckoutSheet();
            document.getElementById('guestlist-modal').classList.remove('hidden');
        }

        function closeGuestListFlow() {
            document.getElementById('guestlist-modal').classList.add('hidden');
        }

        async function submitGuestList() {
            const passInput = document.getElementById('gl-password').value;
            const nameInput = document.getElementById('gl-name').value;
            const emailInput = document.getElementById('gl-email').value;
            const langInput = document.getElementById('gl-lang').value;
            
            if (!passInput || !nameInput || !emailInput) {
                alert("Please fill in all fields.");
                return;
            }
            
            const expectedPass = currentEventData.needs?.tickets?.guestlist?.password;
            if (passInput !== expectedPass) {
                alert(langInput === 'pt' ? "Senha incorreta." : "Incorrect Password.");
                return;
            }
            
            const btn = document.getElementById('gl-submit-btn');
            const orig = btn.innerHTML;
            btn.innerHTML = '<span class="material-symbols-outlined animate-spin">sync</span> ' + (langInput === 'pt' ? 'Verificando...' : 'Verifying...');
            btn.disabled = true;
            
            try {
                const response = await fetch('/api/register-guest', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        eventId: currentEventData.id,
                        name: nameInput,
                        email: emailInput,
                        language: langInput,
                        eventTitle: currentEventData.title || "Circle D Flow Event",
                        eventDate: currentEventData.event_date || "TBA",
                        eventAddress: currentEventData.address || "TBA"
                    })
                });
                
                const data = await response.json();
                if (!response.ok) {
                    throw new Error(data.error || "Failed to register");
                }
                
                // Show Success
                document.getElementById('guestlist-form').classList.add('hidden');
                document.getElementById('guestlist-success').classList.remove('hidden');
                
            } catch (e) {
                console.error(e);
                alert(langInput === 'pt' ? "Erro ao registrar. Tente novamente." : "Error registering. Please try again.");
            } finally {
                btn.innerHTML = orig;
                btn.disabled = false;
            }
        }

        function simulateSuccess() {
            closeCheckoutSheet();
            alert("Payment simulation successful. A ticket has been minted!");
        }

        function openNodeModal(name, role, imgEncoded, bioEncoded, socialEncoded, musicEncoded) {
            const img = decodeURIComponent(imgEncoded);
            const bio = decodeURIComponent(bioEncoded);
            const social = decodeURIComponent(socialEncoded);
            const music = decodeURIComponent(musicEncoded || '');

            document.getElementById('node-modal-name').innerText = name;
            document.getElementById('node-modal-role').innerText = role;
            
            const imgEl = document.getElementById('node-modal-img');
            if(img) {
                imgEl.style.backgroundImage = `url('${img}')`;
                imgEl.classList.remove('hidden');
            } else {
                imgEl.style.backgroundImage = `none`;
                imgEl.classList.add('hidden');
            }

            const bioEl = document.getElementById('node-modal-bio');
            if(bio) {
                bioEl.innerText = `"${bio}"`;
                bioEl.classList.remove('hidden');
            } else {
                bioEl.classList.add('hidden');
            }

            const socialEl = document.getElementById('node-modal-social');
            if(social) {
                socialEl.href = social;
                socialEl.classList.remove('hidden');
            } else {
                socialEl.classList.add('hidden');
            }

            const musicEl = document.getElementById('node-modal-music');
            if(music) {
                musicEl.href = music;
                musicEl.classList.remove('hidden');
            } else {
                musicEl.classList.add('hidden');
            }

            const modal = document.getElementById('node-modal');
            modal.classList.remove('hidden');
            modal.classList.add('flex');
            setTimeout(() => modal.classList.remove('opacity-0'), 10);
        }

        function closeNodeModal() {
            const modal = document.getElementById('node-modal');
            modal.classList.add('opacity-0');
            setTimeout(() => {
                modal.classList.add('hidden');
                modal.classList.remove('flex');
            }, 300);
        }

        function shareImpact() {
            if (navigator.share) {
                navigator.share({
                    title: currentEventData ? currentEventData.title : 'Circle D Flow Event',
                    text: 'Join me at this event!',
                    url: window.location.href,
                }).catch(console.error);
            } else {
                alert("Share URL: " + window.location.href);
            }
        }
    