class BantabaApp {
    constructor() {
        this.currentPage = 0;
        this.container = document.getElementById('manga-container');
        
        this.initPage1();
        this.initPage3();
        
        // Show Griot dialogue after a short delay
        setTimeout(() => {
            const diag = document.getElementById('griot-dialogue');
            if(diag) {
                diag.classList.remove('hidden');
                gsap.fromTo(diag, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 1 });
            }
        }, 2000);
        // Initial check for session
        setTimeout(() => this.checkSession(), 500);
    }

    async checkSession() {
        if (!window.supabaseClient) return;
        const { data: { session } } = await window.supabaseClient.auth.getSession();
        if (session) {
            this.setLoggedInState(session.user.email);
            // Handle return from Magic Link
            if (window.location.hash.includes('access_token')) {
                // Clear the hash so we don't re-trigger on next reload
                window.history.replaceState(null, null, window.location.pathname);
                
                // Auto-forward to page 3
                this.currentEventId = localStorage.getItem('last_event_id') || 'criz';
                this.proceedToDice();
            }
        } else {
            // Listen for auth changes
            window.supabaseClient.auth.onAuthStateChange((event, session) => {
                if (session) {
                    this.setLoggedInState(session.user.email);
                }
            });
        }
    }

    setLoggedInState(email) {
        document.getElementById('auth-section').classList.add('hidden');
        document.getElementById('user-info-section').classList.remove('hidden');
        document.getElementById('logged-in-email').innerText = email;
        document.getElementById('btn-roll').classList.remove('hidden');
        
        // Hide manual email input if it was visible
        const manualEmail = document.getElementById('user-email');
        if (manualEmail) manualEmail.value = email;
    }

    async loginGoogle() {
        if (!window.supabaseClient) return alert("Supabase Client not loaded.");
        await window.supabaseClient.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.href }});
    }

    async loginApple() {
        if (!window.supabaseClient) return alert("Supabase Client not loaded.");
        await window.supabaseClient.auth.signInWithOAuth({ provider: 'apple', options: { redirectTo: window.location.href }});
    }

    async loginMagicLink() {
        if (!window.supabaseClient) return alert("Supabase Client not loaded.");
        const email = document.getElementById('user-email').value;
        if (!email) return alert("Bitte E-Mail eingeben für den Magic Link.");
        
        const { error } = await window.supabaseClient.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.href }});
        if (error) alert(error.message);
        else alert("Magic Link gesendet! Bitte checke deine E-Mails (auch den Spam-Ordner).");
    }

    async logout() {
        if (!window.supabaseClient) return;
        await window.supabaseClient.auth.signOut();
        document.getElementById('auth-section').classList.remove('hidden');
        document.getElementById('user-info-section').classList.add('hidden');
        document.getElementById('btn-roll').classList.add('hidden');
        document.getElementById('user-email').value = '';
    }

    turnPage(pageIndex) {
        this.currentPage = pageIndex;
        // Slide the container (Manga flip effect)
        this.container.style.transform = `translateX(-${pageIndex * 100}vw)`;
        
        if(pageIndex === 2) {
            // Trigger Cup preparation animation when entering page 3
            if(this.cup) {
                gsap.to(this.cup.position, { y: 2, duration: 2, ease: "power2.inOut" });
            }
        }
    }

    // --- UI LOGIC (TABS & LIGHTBOX) ---
    switchTab(tabName) {
        if(tabName === 'bazar') {
            this.clickBazar();
            return;
        }

        const tabs = ['events', 'bazar', 'portfolio'];
        tabs.forEach(tab => {
            const btn = document.getElementById(`tab-${tab}`);
            const grid = document.getElementById(`grid-${tab}`);
            if(!btn || !grid) return;
            
            if(tab === tabName) {
                btn.classList.replace('text-gray-500', 'text-[#d4af37]');
                btn.classList.add('border-[#d4af37]', 'font-bold');
                btn.classList.remove('border-transparent');
                grid.classList.remove('hidden');
            } else {
                btn.classList.replace('text-[#d4af37]', 'text-gray-500');
                btn.classList.remove('border-[#d4af37]', 'font-bold');
                btn.classList.add('border-transparent');
                grid.classList.add('hidden');
            }
        });
        
        // Auto-fill images if portfolio data is loaded
        if(tabName === 'portfolio' && window.PortfolioData) {
            this.populatePortfolioGrid();
        }
    }

    populatePortfolioGrid() {
        const getImg = (cat) => {
            if(!window.PortfolioData[cat] || window.PortfolioData[cat].length === 0) return '../Assets/images/vision_oasis_bg.png';
            // Prefer an item that is NOT a video
            let item = window.PortfolioData[cat].find(i => i.type !== 'video');
            if(!item) item = window.PortfolioData[cat][0]; // fallback to first item
            
            if (item.id) {
                return `https://drive.google.com/uc?export=view&id=${item.id}`;
            } else if (item.name) {
                return `../Assets/lightroom_sync/${item.name}`;
            }
            return '../Assets/images/vision_oasis_bg.png';
        };
        
        const earthEl = document.getElementById('img-earth');
        if(earthEl) earthEl.src = getImg('Nature & Mysticism');
        
        const waterEl = document.getElementById('img-water');
        if(waterEl) waterEl.src = getImg('Circle D Flow');
        
        const fireEl = document.getElementById('img-fire');
        if(fireEl) fireEl.src = getImg('Urban Adventure');
        
        const windEl = document.getElementById('img-wind');
        if(windEl) windEl.src = getImg('The Atelier');
        
        const voidEl = document.getElementById('img-void');
        if(voidEl) voidEl.src = getImg('Studio Exclusives');
    }

    clickBazar() {
        const lang = localStorage.getItem('cqr_lang') || 'de';
        let msg = "Die Seite befindet sich im Aufbau. Wir freuen uns darauf, dich bald hier begrüßen zu dürfen!";
        if(lang === 'en') msg = "Page is under construction and we are happy to welcome you soon!";
        if(lang === 'fr') msg = "Page en construction. Nous serons heureux de vous y accueillir bientôt !";
        if(lang === 'pt') msg = "A página está em construção. Esperamos receber-te em breve!";
        alert(msg);
    }

    openLightbox(eventId) {
        const lb = document.getElementById('event-lightbox');
        const title = document.getElementById('lb-title');
        const date = document.getElementById('lb-date');
        const desc = document.getElementById('lb-desc');

        if(eventId === 'criz') {
            title.innerText = "C-RIZ LISTENING PARTY";
            date.innerText = "02. JUNI 2026";
            desc.innerText = "The genesis of the new wave. Exclusive early preview of the album in the Matrix. Join the circle to secure your frequency.";
        } else if(eventId === 'circledflow') {
            title.innerText = "CIRCLE D FLOW : THE AWAKENING";
            date.innerText = "15. OKT 2026";
            desc.innerText = "Tritt in die heiligen Hallen ein. Erlebe das exklusive Line-up. Nimm die Schicksalsprüfung an und sichere dir deinen Platz im Flow.";
        }
        this.currentEventId = eventId;

        lb.classList.remove('hidden');
        // small animation
        setTimeout(() => lb.classList.remove('opacity-0'), 10);
    }

    closeLightbox() {
        const lb = document.getElementById('event-lightbox');
        lb.classList.add('opacity-0');
        setTimeout(() => lb.classList.add('hidden'), 300);
    }

    // Portfolio Lightbox Logic
    openPortfolioLightbox(ringName) {
        const lb = document.getElementById('portfolio-lightbox');
        
        // Grab current language
        const lang = localStorage.getItem('cqr_lang') || 'de';
        const t = translations[lang];
        
        // Populate text based on ring
        document.getElementById('pl-title').innerText = t[`port_${ringName}_title`] || "Ring";
        document.getElementById('pl-loc').innerText = t[`port_${ringName}_loc`] || "Location";
        document.getElementById('pl-quote').innerText = t[`port_${ringName}_quote`] || "Quote";
        document.getElementById('pl-phil').innerText = t[`port_${ringName}_phil`] || "Philosophy";
        document.getElementById('pl-cta').innerText = t[`port_${ringName}_cta`] || "Action";
        
        // Set Image (grabbed from the clicked panel's image)
        const imgSrc = document.getElementById(`img-${ringName}`).src;
        document.getElementById('pl-image').src = imgSrc;
        
        lb.classList.remove('hidden');
        setTimeout(() => lb.classList.remove('opacity-0'), 10);
    }

    closePortfolioLightbox() {
        const lb = document.getElementById('portfolio-lightbox');
        lb.classList.add('opacity-0');
        setTimeout(() => lb.classList.add('hidden'), 300);
    }

    closeLightbox() {
        const lb = document.getElementById('event-lightbox');
        gsap.to(lb, { opacity: 0, duration: 0.3, onComplete: () => {
            lb.classList.add('hidden');
            lb.classList.remove('flex');
        }});
    }

    openInfoLightbox(eventId) {
        const lb = document.getElementById('info-lightbox');
        const title = document.getElementById('info-lb-title');
        const date = document.getElementById('info-lb-date');
        const time = document.getElementById('info-lb-time');
        const loc = document.getElementById('info-lb-location');
        const desc = document.getElementById('info-lb-desc');
        const teaser = document.getElementById('info-lb-teaser');
        const ticketBtn = document.getElementById('info-lb-ticket-btn');

        const lang = localStorage.getItem('cqr_lang') || 'de';
        const t = translations[lang] || translations['en'];

        if(eventId === 'criz') {
            title.innerText = t['criz_title'] || "C-RIZ LISTENING PARTY";
            date.innerText = t['criz_date'] || "DATUM: 02. JUNI 2026";
            time.innerText = t['criz_time'] || "ZEIT: TBA";
            loc.innerText = t['criz_location'] || "ORT: TBA";
            desc.innerText = t['criz_desc'] || "Die Entstehung der neuen Welle...";
            teaser.innerText = t['criz_teaser'] || "DJ Set von C-RIZ, Secret Guests, Drinks by African Queen Kitchen.";
        } else if(eventId === 'circledflow') {
            title.innerText = t['cdf_title'] || "CIRCLE D FLOW : THE AWAKENING";
            date.innerText = t['cdf_date'] || "DATUM: 27. JUNI 2026";
            time.innerText = t['cdf_time'] || "ZEIT: TBA";
            loc.innerText = t['cdf_location'] || "ORT: TBA";
            desc.innerText = t['cdf_desc'] || "Tritt in die heiligen Hallen ein...";
            teaser.innerText = t['cdf_teaser'] || "Erlebe die Verschmelzung von Musik, Kunst und Spiritualität. Mehr Details folgen in Kürze.";
        }
        
        ticketBtn.onclick = () => {
            this.closeInfoLightbox();
            this.openLightbox(eventId);
        };

        lb.classList.remove('hidden');
        lb.classList.add('flex');
        gsap.fromTo(lb, { opacity: 0 }, { opacity: 1, duration: 0.3 });
    }

    closeInfoLightbox() {
        const lb = document.getElementById('info-lightbox');
        gsap.to(lb, { opacity: 0, duration: 0.3, onComplete: () => {
            lb.classList.add('hidden');
            lb.classList.remove('flex');
        }});
    }

    proceedToDice() {
        this.closeLightbox();
        
        // Save the event id so we can restore it after magic link login
        if (this.currentEventId) {
            localStorage.setItem('last_event_id', this.currentEventId);
        }
        
        const flyer = document.getElementById('checkout-flyer');
        if (flyer) {
            if (this.currentEventId === 'criz') {
                flyer.src = '../Assets/images/c-riz-flyer.jpg';
                flyer.classList.remove('hidden');
            } else if (this.currentEventId === 'circledflow') {
                flyer.src = '../Assets/images/circle-d-flow-flyer.png';
                flyer.classList.remove('hidden');
            } else {
                flyer.classList.add('hidden');
            }
        }
        
        this.turnPage(2);
    }

    // --- PAGE 1: THE GRIOT SCENE ---
    initPage1() {
        const container = document.getElementById('canvas-page1');
        const scene = new THREE.Scene();
        scene.fog = new THREE.FogExp2(0x0a0a0a, 0.05);

        const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.set(0, 0, 20); // Lowered camera

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        container.appendChild(renderer.domElement);

        // Lighting
        const ambient = new THREE.AmbientLight(0x404040, 1.2); // Soft ambient
        scene.add(ambient);

        const dirLight = new THREE.DirectionalLight(0xffdfb0, 1.5);
        dirLight.position.set(10, 25, 10);
        dirLight.castShadow = true;
        dirLight.shadow.camera.left = -20;
        dirLight.shadow.camera.right = 20;
        dirLight.shadow.camera.top = 20;
        dirLight.shadow.camera.bottom = -20;
        scene.add(dirLight);

        const spotLight = new THREE.PointLight(0xd4af37, 1.5, 50);
        spotLight.position.set(0, 10, 5);
        scene.add(spotLight);

        // --- RENDER ENVIRONMENT ALWAYS ---
        this.renderEnvironment(scene);

        // GLTF Loader for the Blender Griot Model
        const loader = new THREE.GLTFLoader();
        loader.load(
            '../Assets/models/griot.glb', 
            (gltf) => {
                console.log("Griot Model Loaded!");
                const griot = gltf.scene;
                
                griot.traverse((child) => {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                    }
                });

                griot.scale.set(1.5, 1.5, 1.5);
                griot.position.set(-2, -5.5, -2);
                griot.rotation.y = Math.PI / 6;
                scene.add(griot);
                
                // Play animations if present
                if (gltf.animations && gltf.animations.length) {
                    this.mixer = new THREE.AnimationMixer(griot);
                    // Try to play 'Dance' or fall back to first animation
                    const clip = THREE.AnimationClip.findByName(gltf.animations, 'Dance') || gltf.animations[0];
                    if (clip) {
                        const action = this.mixer.clipAction(clip);
                        action.play();
                    }
                } else {
                    gsap.to(griot.position, { y: -5.3, duration: 2, repeat: -1, yoyo: true, ease: "sine.inOut" });
                }
            },
            undefined,
            (error) => {
                console.warn("Blender Griot model not found. Rendering placeholder.", error);
                this.renderGriotPlaceholder(scene);
            }
        );

        // Animation Loop
        const clock = new THREE.Clock();
        const animate = () => {
            requestAnimationFrame(animate);
            const delta = clock.getDelta();
            if (this.mixer) this.mixer.update(delta);
            renderer.render(scene, camera);
        };
        animate();

        // Handle resize
        window.addEventListener('resize', () => {
            if(this.currentPage === 0) {
                camera.aspect = window.innerWidth / window.innerHeight;
                camera.updateProjectionMatrix();
                renderer.setSize(window.innerWidth, window.innerHeight);
            }
        });
    }

    renderEnvironment(scene) {
        // --- 1. THE BANTABA TREE (Detailed & Branched) ---
        const treeGroup = new THREE.Group();
        const woodMat = new THREE.MeshStandardMaterial({ color: 0x4a3b2c, roughness: 1.0 });
        
        // Trunk
        const trunkGeo = new THREE.CylinderGeometry(1.5, 2.5, 12, 8);
        const trunk = new THREE.Mesh(trunkGeo, woodMat);
        trunk.position.y = 0;
        trunk.castShadow = true;
        trunk.receiveShadow = true;
        treeGroup.add(trunk);

        // Branches
        const branchGeo = new THREE.CylinderGeometry(0.6, 1.2, 8, 6);
        const branch1 = new THREE.Mesh(branchGeo, woodMat);
        branch1.position.set(-3, 3, 0);
        branch1.rotation.z = Math.PI / 4;
        branch1.castShadow = true;
        const branch2 = new THREE.Mesh(branchGeo, woodMat);
        branch2.position.set(3, 4, 0);
        branch2.rotation.z = -Math.PI / 4;
        branch2.castShadow = true;
        treeGroup.add(branch1, branch2);

        // Leaf Canopy
        const leafMat = new THREE.MeshStandardMaterial({ color: 0x2e8b57, roughness: 0.9, flatShading: true });
        const leaves = [];
        const leafPos = [
            [0, 7, 0, 4.5], [-5, 5, 1, 3.5], [5, 6, -1, 4], 
            [0, 8, -3, 4], [-2, 8, -4, 3.5], [3, 5, 3, 3.5]
        ];
        leafPos.forEach(pos => {
            const leaf = new THREE.Mesh(new THREE.DodecahedronGeometry(pos[3]), leafMat);
            leaf.position.set(pos[0], pos[1], pos[2]);
            leaf.castShadow = true;
            leaf.receiveShadow = true;
            leaves.push(leaf);
            treeGroup.add(leaf);
        });

        // Magical Tree Lights (Sunlight breaking through)
        const treeLight = new THREE.PointLight(0x88ff88, 2, 15);
        treeLight.position.set(0, 5, 2);
        treeGroup.add(treeLight);

        treeGroup.position.set(0, -2, -12);
        scene.add(treeGroup);

        // --- 2. THE CAMPFIRE (Sammelplatz Atmosphere) ---
        const fireGroup = new THREE.Group();
        const logGeo = new THREE.CylinderGeometry(0.3, 0.3, 3);
        const log1 = new THREE.Mesh(logGeo, woodMat);
        log1.rotation.z = Math.PI / 4;
        log1.rotation.y = Math.PI / 4;
        const log2 = new THREE.Mesh(logGeo, woodMat);
        log2.rotation.z = -Math.PI / 4;
        log2.rotation.y = -Math.PI / 4;
        log1.castShadow = true; log2.castShadow = true;
        fireGroup.add(log1, log2);
        
        // Flames
        const flameGeo = new THREE.ConeGeometry(1, 2, 6);
        const flameMat = new THREE.MeshStandardMaterial({ color: 0xffaa00, emissive: 0xff4400, transparent: true, opacity: 0.8 });
        const flame = new THREE.Mesh(flameGeo, flameMat);
        flame.position.y = 0.5;
        fireGroup.add(flame);
        
        // Fire Glow
        const fireLight = new THREE.PointLight(0xff6600, 3, 20);
        fireLight.position.y = 1;
        fireLight.castShadow = true;
        fireGroup.add(fireLight);
        
        fireGroup.position.set(4, -6, 2);
        scene.add(fireGroup);

        // Animations for Environment
        gsap.to(flame.scale, { y: 1.3, duration: 0.2, repeat: -1, yoyo: true });
        gsap.to(fireLight, { intensity: 3.5, duration: 0.15, repeat: -1, yoyo: true });
        gsap.to(leaves[0].position, { y: 7.2, duration: 3, repeat: -1, yoyo: true, ease: "sine.inOut" });
    }

    renderGriotPlaceholder(scene) {
        // --- 3. THE CHIBI FINAL FANTASY GRIOT (Detailed) ---
        const griotGroup = new THREE.Group();
        
        // Robe
        const robeGeo = new THREE.ConeGeometry(3, 5, 12);
        const robeMat = new THREE.MeshStandardMaterial({ color: 0x191970, roughness: 0.8 });
        const robe = new THREE.Mesh(robeGeo, robeMat);
        robe.position.y = 2.5;
        robe.castShadow = true;
        griotGroup.add(robe);

        // Gold Trim
        const trimGeo = new THREE.TorusGeometry(2.8, 0.2, 8, 16);
        const trimMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.8, roughness: 0.2 });
        const trim = new THREE.Mesh(trimGeo, trimMat);
        trim.position.y = 0.5;
        trim.rotation.x = Math.PI / 2;
        griotGroup.add(trim);

        // Arms
        const armGeo = new THREE.CylinderGeometry(0.8, 0.5, 3, 8);
        const armLeft = new THREE.Mesh(armGeo, robeMat);
        armLeft.position.set(-2.5, 3, 0);
        armLeft.rotation.z = Math.PI / 4;
        const armRight = new THREE.Mesh(armGeo, robeMat);
        armRight.position.set(2.5, 3, 0);
        armRight.rotation.z = -Math.PI / 4;
        griotGroup.add(armLeft, armRight);

        // Hands
        const handGeo = new THREE.SphereGeometry(0.6, 16, 16);
        const skinMat = new THREE.MeshStandardMaterial({ color: 0x3a2e24, roughness: 0.6 }); 
        const handL = new THREE.Mesh(handGeo, skinMat);
        handL.position.set(-3.5, 1.5, 0);
        const handR = new THREE.Mesh(handGeo, skinMat);
        handR.position.set(3.5, 1.5, 0);
        griotGroup.add(handL, handR);

        // Head
        const headGeo = new THREE.SphereGeometry(2.2, 32, 32);
        const head = new THREE.Mesh(headGeo, skinMat);
        head.position.y = 6;
        head.castShadow = true;
        griotGroup.add(head);

        // Beard
        const beardGeo = new THREE.DodecahedronGeometry(1.5, 1);
        const beardMat = new THREE.MeshStandardMaterial({ color: 0xeeeeee, roughness: 0.8 });
        const beard = new THREE.Mesh(beardGeo, beardMat);
        beard.position.set(0, 4.8, 1.5);
        griotGroup.add(beard);

        // Glowing Eyes
        const eyeGeo = new THREE.SphereGeometry(0.2, 8, 8);
        const eyeMat = new THREE.MeshStandardMaterial({ color: 0x00ffff, emissive: 0x00ffff, emissiveIntensity: 2 });
        const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
        eyeL.position.set(-0.8, 6.5, 1.8);
        const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
        eyeR.position.set(0.8, 6.5, 1.8);
        griotGroup.add(eyeL, eyeR);

        // Crystal Kora
        const koraGroup = new THREE.Group();
        const gourdGeo = new THREE.IcosahedronGeometry(1.5, 1);
        const gourdMat = new THREE.MeshPhysicalMaterial({ 
            color: 0x00ffff, metalness: 0.1, roughness: 0.1, 
            transmission: 0.9, emissive: 0x0088ff, emissiveIntensity: 0.5 
        });
        const gourd = new THREE.Mesh(gourdGeo, gourdMat);
        koraGroup.add(gourd);
        
        const neckGeo = new THREE.CylinderGeometry(0.15, 0.15, 5);
        const neck = new THREE.Mesh(neckGeo, trimMat);
        neck.position.y = 2.5;
        koraGroup.add(neck);

        koraGroup.position.set(2, 2.5, 2.5);
        koraGroup.rotation.z = -0.4;
        koraGroup.rotation.x = 0.2;
        griotGroup.add(koraGroup);

        griotGroup.position.set(-2, -6, -2);
        scene.add(griotGroup);

        // Animations
        gsap.to(griotGroup.position, { y: -5.5, duration: 2, repeat: -1, yoyo: true, ease: "sine.inOut" });
    }

    // --- PAGE 3: THE DESTINY TEST SCENE ---
    initPage3() {
        const container = document.getElementById('canvas-page3');
        const scene = new THREE.Scene();
        scene.fog = new THREE.FogExp2(0x000000, 0.05);

        // Adjusted Camera to look at the table from an angle
        const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
        camera.position.set(6, 12, 16); 
        camera.lookAt(0, 0, 4); // Look towards the dice position

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.shadowMap.enabled = true;
        container.appendChild(renderer.domElement);
        
        // Initial responsive camera setup
        if (window.innerWidth < 768) {
            camera.position.set(0, 16, 26);
            camera.lookAt(0, 0, 5);
        }

        // Enhanced Lighting
        const ambient = new THREE.AmbientLight(0xffffff, 0.4);
        scene.add(ambient);
        const pointLight = new THREE.PointLight(0xd4af37, 2.5, 30); 
        pointLight.position.set(0, 12, 5);
        scene.add(pointLight);

        // Table
        const tableGeo = new THREE.CylinderGeometry(15, 15, 0.5, 32);
        const tableMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 });
        const table = new THREE.Mesh(tableGeo, tableMat);
        table.position.set(0, -0.25, 2); // Shifted table slightly forward
        table.receiveShadow = true;
        scene.add(table);

        // --- THE DICE (Classic 6-sided with Pips) ---
        function createDiceTexture(pips) {
            const canvas = document.createElement('canvas');
            canvas.width = 128;
            canvas.height = 128;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#d4af37'; // Gold
            ctx.fillRect(0, 0, 128, 128);
            
            // Border
            ctx.strokeStyle = '#a67c00';
            ctx.lineWidth = 4;
            ctx.strokeRect(2, 2, 124, 124);

            ctx.fillStyle = '#111'; // Black pips
            const drawDot = (x, y) => { ctx.beginPath(); ctx.arc(x, y, 12, 0, Math.PI*2); ctx.fill(); }
            
            if ([1,3,5].includes(pips)) drawDot(64, 64);
            if ([2,3,4,5,6].includes(pips)) { drawDot(32, 32); drawDot(96, 96); }
            if ([4,5,6].includes(pips)) { drawDot(96, 32); drawDot(32, 96); }
            if (pips === 6) { drawDot(32, 64); drawDot(96, 64); }
            
            return new THREE.CanvasTexture(canvas);
        }

        const diceMaterials = [
            new THREE.MeshStandardMaterial({ map: createDiceTexture(1), roughness: 0.4, metalness: 0.6 }),
            new THREE.MeshStandardMaterial({ map: createDiceTexture(6), roughness: 0.4, metalness: 0.6 }),
            new THREE.MeshStandardMaterial({ map: createDiceTexture(2), roughness: 0.4, metalness: 0.6 }),
            new THREE.MeshStandardMaterial({ map: createDiceTexture(5), roughness: 0.4, metalness: 0.6 }),
            new THREE.MeshStandardMaterial({ map: createDiceTexture(3), roughness: 0.4, metalness: 0.6 }),
            new THREE.MeshStandardMaterial({ map: createDiceTexture(4), roughness: 0.4, metalness: 0.6 })
        ];
        
        const diceGeo = new THREE.BoxGeometry(2, 2, 2);
        this.dice = new THREE.Mesh(diceGeo, diceMaterials);
        this.dice.position.set(0, 1.5, 5); // Moved forward to be visible below UI
        this.dice.castShadow = true;
        scene.add(this.dice);

        // The Antique Cup (Becher)
        const cupGroup = new THREE.Group();
        const cupGeo = new THREE.CylinderGeometry(2, 2.5, 4, 16, 1, true);
        const cupMat = new THREE.MeshToonMaterial({ color: 0x5c4033 });
        const cupMesh = new THREE.Mesh(cupGeo, cupMat);
        
        const capGeo = new THREE.CylinderGeometry(2, 2, 0.2, 16);
        const capMesh = new THREE.Mesh(capGeo, cupMat);
        capMesh.position.y = 2;
        
        cupGroup.add(cupMesh);
        cupGroup.add(capMesh);
        
        // Add Adinkra symbol decorations to Cup (Golden rings)
        const ringGeo = new THREE.TorusGeometry(2.2, 0.1, 8, 32);
        const ringMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 1 });
        const ring1 = new THREE.Mesh(ringGeo, ringMat);
        ring1.position.y = 1;
        const ring2 = new THREE.Mesh(ringGeo, ringMat);
        ring2.position.y = -1;
        cupGroup.add(ring1, ring2);

        cupGroup.position.set(0, 2, 5); // Resting over the dice at z=5
        cupGroup.castShadow = true;
        scene.add(cupGroup);
        this.cup = cupGroup;

        // Animation Loop
        const animate = () => {
            requestAnimationFrame(animate);
            if(this.isRolling) {
                this.dice.rotation.x += 0.2;
                this.dice.rotation.y += 0.3;
            } else {
                this.dice.rotation.y += 0.005;
            }
            renderer.render(scene, camera);
        };
        animate();

        window.addEventListener('resize', () => {
            if(this.currentPage === 2) {
                camera.aspect = window.innerWidth / window.innerHeight;
                camera.updateProjectionMatrix();
                renderer.setSize(window.innerWidth, window.innerHeight);
                
                if (window.innerWidth < 768) {
                    camera.position.set(0, 16, 26);
                    camera.lookAt(0, 0, 5);
                } else {
                    camera.position.set(6, 12, 16);
                    camera.lookAt(0, 0, 4);
                }
            }
        });
    }

    async initiateRoll() {
        let email = document.getElementById('user-email').value;
        
        // If logged in via Supabase, use the verified email
        if (window.supabaseClient) {
            const { data: { session } } = await window.supabaseClient.auth.getSession();
            if (session) email = session.user.email;
        }

        const btnRoll = document.getElementById('btn-roll');
        
        if(!email) {
            alert("Bitte legitimiere dich zuerst (E-Mail / Login).");
            return;
        }

        btnRoll.innerText = "Das Schicksal entscheidet...";
        btnRoll.disabled = true;
        this.isRolling = true;
        
        // Hide UI elements so the dice is clearly visible
        const uiText = document.getElementById('page3-header-text');
        if (uiText) gsap.to(uiText, { opacity: 0, height: 0, margin: 0, padding: 0, duration: 0.5 });
        const userInfo = document.getElementById('user-info-section');
        if (userInfo) gsap.to(userInfo, { opacity: 0, height: 0, margin: 0, padding: 0, duration: 0.5 });
        gsap.to(btnRoll, { opacity: 0, height: 0, margin: 0, padding: 0, duration: 0.5 });

        // Animate Cup Lift
        gsap.to(this.cup.position, { y: 12, duration: 1.5, ease: "back.in(1)" });
        gsap.to(this.cup.rotation, { x: 0.5, z: 0.5, duration: 1.5 });

        // Spin dice wildly
        gsap.to(this.dice.position, { y: 4, duration: 1, yoyo: true, repeat: 2 });

        try {
            const response = await fetch('/api/roll', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email, eventId: this.currentEventId })
            });
            const data = await response.json();

            // Stop rolling and resolve final rotation
            setTimeout(() => {
                this.isRolling = false;
                
                // Get current rotation to add spins relative to current
                const currentX = this.dice.rotation.x;
                const currentY = this.dice.rotation.y;
                const currentZ = this.dice.rotation.z;
                
                // Snap base target relative to 0
                const targetRot = { x: 0, y: 0, z: 0 };
                // Ensure data.rolled is used if data.rollResult doesn't exist
                const finalRoll = data.rolled || data.rollResult;
                switch(finalRoll) {
                    case 1: targetRot.z = -Math.PI / 2; break; 
                    case 6: targetRot.z = Math.PI / 2; break;  
                    case 2: targetRot.x = 0; break;            
                    case 5: targetRot.x = Math.PI; break;      
                    case 3: targetRot.x = -Math.PI / 2; break; 
                    case 4: targetRot.x = Math.PI / 2; break;  
                }

                // Add spins so it always rolls "forward" multiple times before stopping
                targetRot.x += Math.ceil(currentX / (Math.PI*2)) * (Math.PI*2) + (Math.PI * 4);
                targetRot.y += Math.ceil(currentY / (Math.PI*2)) * (Math.PI*2) + (Math.PI * 4);
                targetRot.z += Math.ceil(currentZ / (Math.PI*2)) * (Math.PI*2) + (Math.PI * 4);

                gsap.to(this.dice.rotation, { 
                    x: targetRot.x, 
                    y: targetRot.y, 
                    z: targetRot.z, 
                    duration: 1.5, 
                    ease: "power2.out" 
                });
                
                gsap.to(this.dice.position, { y: 1.5, duration: 1, ease: "bounce.out" });
                
                // Cinematic scale (reduced to prevent UI overlap on mobile)
                gsap.to(this.dice.scale, { x: 1.3, y: 1.3, z: 1.3, duration: 1, ease: "elastic.out(1, 0.3)" });

                // UI Update
                document.getElementById('btn-roll').style.display = 'none';
                document.getElementById('roll-result').classList.remove('hidden');
                document.getElementById('result-amount').innerText = data.rolled;
                document.getElementById('btn-checkout').href = data.checkout_url;
                
            }, 2500);

        } catch (e) {
            console.error("Roll failed:", e);
            alert("Die Verbindung zum Orakel ist abgebrochen. Versuche es erneut.");
            btnRoll.innerText = "Hebe den Becher";
            btnRoll.disabled = false;
            this.isRolling = false;
            gsap.to(this.cup.position, { y: 2, duration: 1, ease: "power2.out" }); // Put cup back down
        }
    }
}

// Initialize App
window.app = new BantabaApp();
