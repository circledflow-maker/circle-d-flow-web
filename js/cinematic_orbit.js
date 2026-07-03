import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.158.0/build/three.module.js';
import { gsap } from 'https://cdn.jsdelivr.net/npm/gsap@3.12.5/index.js';

/**
 * ORACLE OF YGGDRASIL ENGINE
 * Transforms the landing page into a mystical 3D ritual involving
 * the Starry Africa, the World Tree, and the Galactic Oracle.
 */

class FloweeCompanion {
    constructor(scene) {
        this.scene = scene;
        this.group = new THREE.Group();
        this.group.position.set(0, 20, -50); 
        
        const coreGeo = new THREE.IcosahedronGeometry(1.2, 1);
        const coreMat = new THREE.MeshStandardMaterial({ 
            color: 0x9a4dff, 
            emissive: 0x9a4dff,
            emissiveIntensity: 2,
            wireframe: true 
        });
        this.core = new THREE.Mesh(coreGeo, coreMat);
        this.group.add(this.core);

        const ringGeo = new THREE.TorusGeometry(2, 0.05, 16, 100);
        const ringMat = new THREE.MeshBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.8 });
        this.ring = new THREE.Mesh(ringGeo, ringMat);
        this.group.add(this.ring);

        this.scene.add(this.group);
    }

    update(time) {
        this.group.position.y += Math.sin(time * 2) * 0.02;
        this.core.rotation.y += 0.01;
        this.ring.rotation.x += 0.02;
        this.ring.rotation.z += 0.01;
    }
}

class OrbitEngine {
    constructor() {
        this.container = document.getElementById('canvas-container');
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x000000);
        
        this.camera = new THREE.PerspectiveCamera(60, 1, 0.1, 2000);
        this.camera.position.set(0, 10, 120);

        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this._applyRendererSize();
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.container.appendChild(this.renderer.domElement);

        this.clock = new THREE.Clock();
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        
        this.doors = [];
        this.isTransitioning = false;

        window.OrbitEngine = this;
        this.init();
    }

    init() {
        console.log("🌌 [Oracle] Initializing Weltenbaum Sequence...");
        
        this.createStars();
        this.createAfricaSource();
        this.createYggdrasil();
        this.createAdinkraLeaves();
        this.companion = new FloweeCompanion(this.scene);

        // Lighting
        const ambient = new THREE.AmbientLight(0xffffff, 0.3);
        this.scene.add(ambient);

        const pointLight = new THREE.PointLight(0xd4af37, 5, 200);
        pointLight.position.set(0, 50, 50);
        this.scene.add(pointLight);

        window.addEventListener('resize', () => this.onResize());
        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', () => this.onResize());
        }
        window.addEventListener('mousemove', (e) => this.onMouseMove(e));
        window.addEventListener('pointerdown', (e) => {
            this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
            this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
            this.onClick();
        });

        // Bind Skip Button
        const skipBtn = document.getElementById('btn-skip');
        if(skipBtn) skipBtn.onclick = () => this.skipIntro();

        this.animate();

        // Initial Cinematic Reveal: Zoom in from Infinity
        gsap.fromTo(this.camera.position, 
            { z: 1000 }, 
            { z: 150, duration: 3, ease: "expo.out" }
        );
               // Auto-fade the first hint and ensure it disappears completely
        setTimeout(() => {
            const hint = document.getElementById('hold-hint');
            if(hint) {
                gsap.to(hint, { opacity: 1, duration: 1 });
            }
        }, 1000);

        // Auto-Start Cinematic Story Sequence
        setTimeout(() => {
            this.runStorySequence();
        }, 2000);
    }

    skipIntro() {
        console.log("⏩ [Oracle] Skipping Narrative...");
        const overlays = [
            document.getElementById('flowee-intro'),
            document.getElementById('hold-hint'),
            document.getElementById('btn-skip'),
            document.getElementById('narrative-overlay')
        ];
        
        gsap.to(overlays, { 
            opacity: 0, 
            duration: 0.8, 
            stagger: 0.1,
            onComplete: () => {
                overlays.forEach(el => { if(el) el.style.display = 'none'; });
            }
        });

        // Show Welcome Title
        const welcome = document.getElementById('title-overlay');
        if(welcome) {
            welcome.style.display = 'block';
            gsap.to(welcome, { opacity: 1, duration: 2 });
            // Auto-hide after 5s
            gsap.to(welcome, { opacity: 0, duration: 1.5, delay: 5 });
        }

        // Frame the Tree
        gsap.to(this.camera.position, { y: 20, z: 100, duration: 1.5, ease: "power2.out" });
        
        // Reset Transition Flag (Crucial Fix)
        this.isTransitioning = false;
        console.log("🔓 [Oracle] Interaction Unlocked.");
    }

    createStars() {
        const geo = new THREE.BufferGeometry();
        const count = 8000;
        const pos = new Float32Array(count * 3);
        for(let i=0; i<count*3; i++) pos[i] = (Math.random() - 0.5) * 3000;
        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        const mat = new THREE.PointsMaterial({ size: 1.2, color: 0xffffff, transparent: true, opacity: 0.8 });
        this.stars = new THREE.Points(geo, mat);
        this.scene.add(this.stars);

        // Initial Celestial Alignment for Lisbon
        this.updateCelestialRotation();
    }

    updateCelestialRotation() {
        // Lisbon: 38.72° N, 9.14° W
        const lon = -9.1393;
        const now = new Date();
        
        // Calculate Julian Date
        const jd = (now / 86400000) - (now.getTimezoneOffset() / 1440) + 2440587.5;
        const d = jd - 2451545.0;
        
        // Greenwich Mean Sidereal Time (GMST)
        let gmst = 18.697374558 + 24.06570982441908 * d;
        gmst = gmst % 24;
        if(gmst < 0) gmst += 24;
        
        // Local Sidereal Time (LST)
        let lst = gmst + (lon / 15);
        lst = lst % 24;
        if(lst < 0) lst += 24;

        // Apply rotation to the celestial sphere
        // Y-axis rotation = LST (converted to radians)
        const raRotation = (lst / 24) * Math.PI * 2;
        this.stars.rotation.y = raRotation;
        
        // X-axis rotation = Latitude adjustment
        this.stars.rotation.x = (38.7223 / 180) * Math.PI;
        
        console.log(`🌌 [Celestial] Lisbon LST: ${lst.toFixed(2)}h | Rotation Applied.`);
    }

    createAfricaSource() {
        const geo = new THREE.BufferGeometry();
        const count = 4000;
        const pos = new Float32Array(count * 3);
        const sizes = new Float32Array(count);

        for(let i=0; i<count; i++) {
            // Africa approximation using nested ellipses
            let r = 25 * Math.random();
            let angle = Math.random() * Math.PI * 2;
            let x = r * Math.cos(angle);
            let y = r * Math.sin(angle) * 1.6; // Vertical elongation
            
            // Jitter for 'Dust' effect
            x += (Math.random() - 0.5) * 5;
            y += (Math.random() - 0.5) * 5;

            pos[i*3] = x;
            pos[i*3+1] = y - 60; // Positioned at the base
            pos[i*3+2] = (Math.random() - 0.5) * 10;
            sizes[i] = Math.random() * 2;
        }

        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

        const mat = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                color: { value: new THREE.Color(0xd4af37) },
                overallOpacity: { value: 1.0 }
            },
            vertexShader: `
                uniform float time;
                attribute float size;
                varying float vOpacity;
                void main() {
                    vOpacity = 0.5 + 0.5 * sin(time + position.x * 0.1);
                    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                    gl_PointSize = size * (300.0 / -mvPosition.z);
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                uniform vec3 color;
                uniform float overallOpacity;
                varying float vOpacity;
                void main() {
                    if (length(gl_PointCoord - vec2(0.5)) > 0.5) discard;
                    gl_FragColor = vec4(color, vOpacity * overallOpacity);
                }
            `,
            transparent: true,
            blending: THREE.AdditiveBlending
        });

        this.africaSource = new THREE.Points(geo, mat);
        this.scene.add(this.africaSource);

        // Invisible Raycast Anchor (Robust Click Target)
        const anchorGeo = new THREE.SphereGeometry(35, 16, 16);
        const anchorMat = new THREE.MeshBasicMaterial({ visible: false });
        this.sourceAnchor = new THREE.Mesh(anchorGeo, anchorMat);
        this.sourceAnchor.position.y = -60;
        this.scene.add(this.sourceAnchor);
    }

    createYggdrasil() {
        this.treeGroup = new THREE.Group();
        this.scene.add(this.treeGroup);

        // Trunk (Energy Spiral)
        const trunkGeo = new THREE.CylinderGeometry(0.5, 3, 100, 16, 1, true);
        const trunkMat = new THREE.MeshStandardMaterial({ 
            color: 0xd4af37, 
            emissive: 0xd4af37, 
            emissiveIntensity: 0.5,
            wireframe: true,
            transparent: true,
            opacity: 0.2
        });
        this.trunk = new THREE.Mesh(trunkGeo, trunkMat);
        this.trunk.position.y = -10;
        this.treeGroup.add(this.trunk);

        // Branching Pulsar Path
        const curve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(0, -60, 0),
            new THREE.Vector3(5, -20, 0),
            new THREE.Vector3(-10, 20, 0),
            new THREE.Vector3(0, 60, 0)
        ]);
        const tubeGeo = new THREE.TubeGeometry(curve, 64, 0.2, 8, false);
        this.energyCore = new THREE.Mesh(tubeGeo, trunkMat);
        this.treeGroup.add(this.energyCore);
    }

    createAdinkraLeaves() {
        const classes = [
            { id: 'arcane', color: 0x00f0ff, pos: [20, 40, 10] },
            { id: 'kinetic', color: 0xff5522, pos: [-25, 30, -5] },
            { id: 'visionary', color: 0xd4af37, pos: [10, 60, -15] },
            { id: 'harmonizer', color: 0x00ff88, pos: [-15, 50, 15] }
        ];

        this.leaves = [];
        classes.forEach(c => {
            const leafGeo = new THREE.IcosahedronGeometry(3, 0);
            const leafMat = new THREE.MeshStandardMaterial({ 
                color: c.color, 
                emissive: c.color, 
                emissiveIntensity: 2,
                transparent: true,
                opacity: 0.8
            });
            const leaf = new THREE.Mesh(leafGeo, leafMat);
            leaf.position.set(...c.pos);
            leaf.userData = { id: c.id };
            this.treeGroup.add(leaf);
            this.leaves.push(leaf);

            // NEW: Portal Pulse (Visual Entrance)
            const ringGeo = new THREE.TorusGeometry(4.5, 0.1, 16, 32);
            const ringMat = new THREE.MeshBasicMaterial({ color: c.color, transparent: true, opacity: 0.8 });
            const portalRing = new THREE.Mesh(ringGeo, ringMat);
            portalRing.position.set(...c.pos);
            portalRing.name = "portal_ring_" + c.id;
            portalRing.userData = { id: c.id }; // Add interaction ID
            this.treeGroup.add(portalRing);
            
            // Animate Pulse
            gsap.to(portalRing.scale, { x: 1.5, y: 1.5, z: 1.5, duration: 2, repeat: -1, ease: "sine.inOut" });
            gsap.to(portalRing.material, { opacity: 0, duration: 2, repeat: -1, ease: "power1.in" });

            // Pulse effect for the leaf itself
            gsap.to(leaf.scale, { x: 1.2, y: 1.2, z: 1.2, duration: 2, repeat: -1, yoyo: true, ease: "sine.inOut" });

            // WORLD LABEL (Text Sprite)
            const label = this.makeTextSprite(c.id.toUpperCase());
            label.position.set(c.pos[0], c.pos[1] + 8, c.pos[2]);
            label.scale.set(10, 2.5, 1);
            label.userData = { id: c.id }; // Add interaction ID
            this.treeGroup.add(label);
        });
    }

    onMouseMove(e) {
        this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    }

    onClick() {
        if(this.isTransitioning) return;

        this.raycaster.setFromCamera(this.mouse, this.camera);
        
        const targets = [...this.leaves, ...this.doors];
        if(this.sourceAnchor) targets.push(this.sourceAnchor);
        
        const intersects = this.raycaster.intersectObjects(targets, true); // true for deep checking

        if(intersects.length > 0) {
            let obj = intersects[0].object;
            // Traverse up to find userData if hit frame/part
            while(obj && !obj.userData.id && !obj.userData.doorType && obj !== this.sourceAnchor) {
                obj = obj.parent;
            }
            if(!obj) return;

            console.log("🎯 Intersected:", obj.userData.id || obj.userData.doorType || "Source");
            
            const id = obj.userData.id;
            if(id === 'visionary') {
                this.transitionToLuvo(obj);
            } else if(obj.userData.doorType) {
                this.animateDoorOpen(obj);
                return;
            } else if(id) {
                this.showWorldOverlay(id);
            }

            if(obj === this.sourceAnchor) {
                this.runStorySequence();
            }
        }
    }

    handleOverlayClick(id) {
        if(this.isTransitioning) return;
        this.isTransitioning = true;
        
        let targetUrl = '';
        let overlayMsg = '';
        let overlayColor = '#fff';

        if(id === 'visionary') {
            const leaf = this.leaves.find(l => l.userData.id === 'visionary');
            if(leaf) this.transitionToLuvo(leaf);
            return;
        } else if(id === 'arcane') {
            targetUrl = 'pages/archive.html';
            overlayMsg = 'Entering The Archive...';
            overlayColor = '#00f0ff';
        } else if(id === 'harmonizer') {
            const modal = document.getElementById('connection-modal');
            if (modal) {
                modal.classList.remove('opacity-0', 'pointer-events-none');
                return;
            }
            targetUrl = 'pages/coop.html';
            overlayMsg = 'Entering the Bantaba...';
            overlayColor = '#00ff88';
        } else if(id === 'kinetic') {
            targetUrl = 'pages/heart.html';
            overlayMsg = 'Entering the Heart...';
            overlayColor = '#ff5522';
        } else {
            targetUrl = 'index.html';
        }

        const overlay = document.getElementById('flowee-intro');
        if(overlay && targetUrl) {
            overlay.style.display = 'flex';
            overlay.innerHTML = `<h2 style='color:${overlayColor}; font-family:Cinzel; text-align:center'>${overlayMsg}</h2>`;
            gsap.to(overlay, { opacity: 1, duration: 1, onComplete: () => {
                window.location.href = targetUrl;
            }});
        } else if(targetUrl) {
            window.location.href = targetUrl;
        }
    }

    runStorySequence() {
        console.log("🎬 [Oracle] Starting Story Sequence...");
        this.isTransitioning = true;
        
        const lang = localStorage.getItem('cqr_lang') || 'en';
        const dict = window.i18n[lang] || window.i18n.en;
        
        const tl = gsap.timeline();
        const textOverlay = document.getElementById('narrative-overlay');
        const textEl = document.getElementById('narrative-text');
        
        // Phase 0: Fade out intro hints
        tl.to(['#hold-hint', '#flowee-intro'], { opacity: 0, duration: 1 });
        
        // Phase 1: Zoom to Base
        tl.to(this.camera.position, { y: -40, z: 80, duration: 3, ease: "power2.inOut" }, 0);
        tl.call(() => {
            textEl.innerHTML = dict.intro_1;
            gsap.to(textOverlay, { opacity: 1, duration: 1 });
        }, null, 1);
        tl.to(textOverlay, { opacity: 0, duration: 1 }, 4);
 
        // Phase 2: Ascend the Trunk
        tl.to(this.camera.position, { y: 20, z: 120, duration: 4, ease: "power1.inOut" }, 5);
        tl.call(() => {
            textEl.innerHTML = dict.intro_2;
            gsap.to(textOverlay, { opacity: 1, duration: 1 });
        }, null, 6);
        tl.to(textOverlay, { opacity: 0, duration: 1 }, 9);
 
        // Phase 3: Panning the Worlds
        tl.to(this.camera.position, { x: 30, y: 40, z: 100, duration: 3, ease: "sine.inOut" }, 10);
        tl.call(() => {
            textEl.innerHTML = dict.intro_3;
            gsap.to(textOverlay, { opacity: 1, duration: 1 });
        }, null, 11);
        tl.to(textOverlay, { opacity: 0, duration: 1 }, 13);

        // Phase 4: Final Framing
        tl.to(this.camera.position, { x: 0, y: 20, z: 100, duration: 2, ease: "back.out(1)" }, 14);
        tl.call(() => {
            this.isTransitioning = false;
            gsap.to('#title-overlay', { opacity: 1, duration: 2 });
            // Auto-hide title after 6s
            gsap.to('#title-overlay', { opacity: 0, duration: 2, delay: 6 });
            
            gsap.to('#btn-skip', { opacity: 0, duration: 0.5, onComplete: () => {
                document.getElementById('btn-skip').style.display = 'none';
            }});
        }, null, 15);
        
        if(window.Pusher) window.Pusher.showToast("The Source Awakens...", "mystic");
    }

    showWorldOverlay(id) {
        const overlay = document.getElementById('world-info-overlay');
        const title = document.getElementById('world-title');
        const desc = document.getElementById('world-slogan');
        const hint = document.querySelector('.dive-hint');

        if(!overlay || !title || !desc) return;

        // Set Data
        title.setAttribute('data-i18n', `world_${id}_tit`);
        desc.setAttribute('data-i18n', `world_${id}_desc`);
        if(hint) hint.innerHTML = window.matchMedia('(max-width: 768px)').matches
            ? "[ TAP TO EXPLORE ]"
            : "[ CLICK TO EXPLORE ]";

        // Trigger Localized Update
        if(window.refreshLanguages) window.refreshLanguages();

        // Visual Reveal
        gsap.to(overlay, { opacity: 1, y: 0, duration: 0.5, pointerEvents: 'auto' }); 
        
        // Auto-hide after 5s or on next click (if not transitioning)
        if(this.overlayTimer) clearTimeout(this.overlayTimer);
        this.overlayTimer = setTimeout(() => {
            if(!this.isTransitioning) {
                gsap.to(overlay, { opacity: 0, y: 20, duration: 0.5, pointerEvents: 'none' });
            }
        }, 5000);
    }

    transitionToLuvo(leaf) {
        console.log("🚀 [Oracle] Diving into Luvo Chamber...");
        this.isTransitioning = true;

        // Hide Overlay Properly
        const overlay = document.getElementById('world-info-overlay');
        if(overlay) {
            gsap.to(overlay, { 
                opacity: 0, 
                duration: 0.5, 
                onComplete: () => { 
                    overlay.style.display = 'none'; 
                    overlay.style.pointerEvents = 'none';
                } 
            });
        }

        // Fixed Cinematic Coordinates (Decoupled from Tree Rotation)
        const chamberFocus = new THREE.Vector3(0, 150, 0); 
        const cameraFinalPos = new THREE.Vector3(0, 150, 80);

        // Smooth Camera LookAt Transition
        const lookAtTarget = new THREE.Vector3().copy(this.camera.position).add(this.camera.getWorldDirection(new THREE.Vector3()));
        gsap.to(lookAtTarget, {
            x: chamberFocus.x,
            y: chamberFocus.y,
            z: chamberFocus.z,
            duration: 2.5,
            onUpdate: () => {
                this.camera.lookAt(lookAtTarget);
            }
        });

        // Zoom Camera to Fixed Position
        gsap.to(this.camera.position, {
            x: cameraFinalPos.x,
            y: cameraFinalPos.y,
            z: cameraFinalPos.z,
            duration: 2.5,
            ease: "power2.inOut"
        });

        // Add Room Illumination to guarantee frames are visible
        const roomLight = new THREE.PointLight(0xffffff, 50, 200);
        this.camera.add(roomLight); 
        this.scene.add(this.camera);

        // Transition animations continue without spawning a duplicate hint

        // Hide Tree Correctly (Iterate Children)
        this.treeGroup.traverse(child => {
            if(child.material) {
                gsap.to(child.material, { 
                    opacity: 0, 
                    duration: 1.5, 
                    onComplete: () => { child.visible = false; } 
                });
                child.material.transparent = true;
            }
        });
        
        // Hide Africa Source
        gsap.to(this.africaSource.material.uniforms.overallOpacity, { value: 0, duration: 1.5 });
        
        // Notice: We kept the stars visible to honor user request!

        // Spawn Doors at Fixed coordinates
        setTimeout(() => this.spawnDecisionDoors(chamberFocus), 1200);
    }

    spawnDecisionDoors(centerPos) {
        console.log("🚪 [Oracle] Spawning Detailed 3D Decision Doors...");
        
        this.doorSystems = [];

        const lang = localStorage.getItem('cqr_lang') || 'en';
        
        const createDoor = (type, color, xOffset, textString) => {
            const group = new THREE.Group();
            
            // Visible Magic Stone Frame Material
            const frameMat = new THREE.MeshStandardMaterial({ 
                color: 0x8a7a5e, // Warm bright stone
                metalness: 0.1, 
                roughness: 0.9 
            });

            // Pillars
            const leftPillar = new THREE.Mesh(new THREE.BoxGeometry(6, 62, 6), frameMat);
            leftPillar.position.set(-20.5, 0, 0);
            const rightPillar = new THREE.Mesh(new THREE.BoxGeometry(6, 62, 6), frameMat);
            rightPillar.position.set(20.5, 0, 0);
            group.add(leftPillar, rightPillar);

            // True Open Arch (Torus)
            const archGeo = new THREE.TorusGeometry(20.5, 3, 16, 100, Math.PI);
            const arch = new THREE.Mesh(archGeo, frameMat);
            arch.position.set(0, 31, 0);
            group.add(arch);

            // Two-Panel Doors (Highly Detailed)
            const doorGeo = new THREE.BoxGeometry(19.5, 60, 2);
            const doorMat = new THREE.MeshStandardMaterial({
                color: color,
                emissive: color,
                emissiveIntensity: 0.15,
                metalness: 0.4,
                roughness: 0.4
            });

            // Inner Decor Inset Panel
            const insetGeo = new THREE.BoxGeometry(13, 50, 2.5); // Pops out slightly
            const insetMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.8, roughness: 0.3 });

            // Handle Geometry
            const handleGeo = new THREE.TorusGeometry(1.5, 0.4, 16, 32);
            const handleMat = new THREE.MeshStandardMaterial({
                color: 0xd4af37, // Gold
                emissive: 0xd4af37, 
                emissiveIntensity: 0.6,
                metalness: 1, 
                roughness: 0.2
            });

            // Left Panel Assembly
            const leftPanelGroup = new THREE.Group();
            
            const leftPanelBase = new THREE.Mesh(doorGeo, doorMat);
            const leftPanelInset = new THREE.Mesh(insetGeo, insetMat);
            const leftHandle = new THREE.Mesh(handleGeo, handleMat);
            leftHandle.position.set(6, 0, 1.3); // Close to the inner edge
            
            leftPanelGroup.add(leftPanelBase, leftPanelInset, leftHandle);
            leftPanelGroup.position.set(9.75, 0, 0); 
            leftPanelGroup.userData.doorType = type; // Metadata for hover

            const leftPivot = new THREE.Object3D();
            leftPivot.position.set(-19.5, 0, 0);
            leftPivot.add(leftPanelGroup);
            leftPivot.userData.doorType = type;
            group.add(leftPivot);

            // Right Panel Assembly
            const rightPanelGroup = new THREE.Group();
            
            const rightPanelBase = new THREE.Mesh(doorGeo, doorMat);
            const rightPanelInset = new THREE.Mesh(insetGeo, insetMat);
            const rightHandle = new THREE.Mesh(handleGeo, handleMat);
            rightHandle.position.set(-6, 0, 1.3); // Close to the inner edge
            
            rightPanelGroup.add(rightPanelBase, rightPanelInset, rightHandle);
            rightPanelGroup.position.set(-9.75, 0, 0); 
            rightPanelGroup.userData.doorType = type; // Metadata for hover
            
            const rightPivot = new THREE.Object3D();
            rightPivot.position.set(19.5, 0, 0);
            rightPivot.add(rightPanelGroup);
            rightPivot.userData.doorType = type;
            group.add(rightPivot);

            // Floating Crystal Symbol intersecting the door for high contrast
            const crystalGeo = new THREE.IcosahedronGeometry(5, 0); // Slightly larger
            const crystalMat = new THREE.MeshStandardMaterial({
                color: 0xffffff,
                emissive: color,
                emissiveIntensity: 3,
                wireframe: true
            });
            const crystal = new THREE.Mesh(crystalGeo, crystalMat);
            crystal.position.set(0, 18, 4); // Lowered down to overlap the colored door
            group.add(crystal);

            // Hover Label Text (Title + Desc)
            const label = this.makeTextSprite(textString.title, textString.desc, color);
            label.position.set(0, 70, 0); // Higher up to not block the arch
            label.scale.set(0, 0, 0); // Hidden initially, pops up heavily on hover
            group.add(label);

            // Inner Space light
            const light = new THREE.PointLight(color, 200, 100);
            light.position.set(0, 10, 15);
            group.add(light);

            // Invisible Hover Block covering the whole door explicitly out forward
            const hoverGeo = new THREE.BoxGeometry(45, 90, 20);
            const hoverMesh = new THREE.Mesh(hoverGeo, new THREE.MeshBasicMaterial({visible: false}));
            hoverMesh.position.set(0, 20, 10);
            hoverMesh.userData.doorType = type;
            group.add(hoverMesh);

            // Positioning of the whole door structure
            group.position.set(centerPos.x + xOffset, centerPos.y - 300, centerPos.z - 60);

            return { group, leftPivot, rightPivot, crystal, label, type };
        };

        const retTitle = (window.i18n[lang] && window.i18n[lang].world_return_tit) ? window.i18n[lang].world_return_tit : "THE RETURN";
        const retDesc = (window.i18n[lang] && window.i18n[lang].world_return_desc) ? window.i18n[lang].world_return_desc : "Gateway back to the Dashboard.";
        
        const initTitle = (window.i18n[lang] && window.i18n[lang].world_initiation_tit) ? window.i18n[lang].world_initiation_tit : "THE INITIATION";
        const initDesc = (window.i18n[lang] && window.i18n[lang].world_initiation_desc) ? window.i18n[lang].world_initiation_desc : "Gateway to the Oracle.";

        const returnSys = createDoor('return', 0x00aaff, -27, { title: retTitle, desc: retDesc });
        const initSys = createDoor('initiation', 0x9a4dff, 27, { title: initTitle, desc: initDesc });

        this.scene.add(returnSys.group, initSys.group);
        
        // Add to raycast targets representing doors
        this.doorSystems.push(returnSys, initSys);
        
        // The old doors array expected by onClick
        this.doors.push(returnSys.group, initSys.group); 

        // Safe Entrance Animation: Rise from below
        gsap.to(returnSys.group.position, { y: centerPos.y, duration: 2, ease: "power3.out" });
        gsap.to(initSys.group.position, { y: centerPos.y, duration: 2, ease: "power3.out", delay: 0.3, onComplete: () => { this.isTransitioning = false; } });
        
        const isMobile = window.innerWidth < 768;
        const targetX = isMobile ? 35 : 70;
        const targetY = isMobile ? 7.5 : 15;
        const targetYPos = isMobile ? centerPos.y + 70 : centerPos.y + 40;

        // Massive 3D Global 'Choose Your Path' Hint instead of a CSS toast
        const globalHintText = (window.i18n[lang] && window.i18n[lang].choose_path_hint) ? window.i18n[lang].choose_path_hint : "CHOOSE YOUR PATH";
        const globalHint = this.makeTextSprite(globalHintText, "", 0xd4af37);
        globalHint.scale.set(0, 0, 0);
        // Brought tremendously forward in Z (-20 instead of -60) guarantees it floats in FRONT of the doors
        globalHint.position.set(centerPos.x, targetYPos, centerPos.z - 20); 
        globalHint.renderOrder = 999; // Guarantees it draws absolutely last over any geometry
        this.scene.add(globalHint);
        
        // Animate the huge hint text
        gsap.to(globalHint.scale, { x: targetX, y: targetY, z: 1, duration: 2, delay: 1.5, ease: "elastic.out(1, 0.5)" });
        // Add to doorSystems so it fades logically or just let it live there. It's safe to just let it sit there.
    }

    animateDoorOpen(sysOrType) {
        if(this.isTransitioning) return;
        this.isTransitioning = true;
        
        // Ensure we find the right door system
        let type;
        let sys;
        if(typeof sysOrType === 'string') {
            type = sysOrType;
            sys = this.doorSystems.find(d => d.type === type);
        } else if (sysOrType.userData && sysOrType.userData.doorType) {
            type = sysOrType.userData.doorType;
            sys = this.doorSystems.find(d => d.type === type);
        } else {
            // Unlikely fallback
            type = sysOrType.type;
            sys = sysOrType;
        }

        if(!sys) return;

        // Animate both doors swinging open outwards
        gsap.to(sys.leftPivot.rotation, { y: Math.PI / 1.5, duration: 2, ease: "power2.inOut" });
        gsap.to(sys.rightPivot.rotation, { y: -Math.PI / 1.5, duration: 2, ease: "power2.inOut", onComplete: () => { this.onDoorClick(type); } });

        if(window.Pusher) window.Pusher.showToast(`Opening ${type.toUpperCase()}...`, "mystic");
    }

    onDoorClick(type) {
        console.log("🖱️ Door Clicked:", type);
        
        if(type === 'initiation') {
            // TRIGGER REGISTER MODAL VIA FLOWEE
            if(window.Flowee) {
                window.Flowee.startAuthFlow(true);
            } else if(window.Gatekeeper) {
                window.Gatekeeper.openLoginModal(true);
            } else {
                console.error("Gatekeeper and Flowee Offline.");
                alert("Login System Offline. Check neural link.");
            }
        } else if(type === 'return') {
            // TRIGGER LOGIN MODAL VIA FLOWEE
            if(window.Flowee) {
                window.Flowee.startAuthFlow(false);
            } else if(window.Gatekeeper) {
                window.Gatekeeper.openLoginModal();
            } else {
                console.error("Gatekeeper and Flowee Offline.");
                alert("Login System Offline. Check neural link.");
            }
        }
    }

    _viewportSize() {
        const w = this.container?.clientWidth || window.visualViewport?.width || window.innerWidth;
        const h = this.container?.clientHeight || window.visualViewport?.height || window.innerHeight;
        return { width: Math.max(1, w), height: Math.max(1, h) };
    }

    _applyRendererSize() {
        const { width, height } = this._viewportSize();
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height, false);
    }

    onResize() {
        this._applyRendererSize();
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        const time = this.clock.getElapsedTime();

        if (this.africaSource) this.africaSource.material.uniforms.time.value = time;
        if (this.stars) this.stars.rotation.y += 0.0005;
        if (this.treeGroup) this.treeGroup.rotation.y += 0.002;
        if (this.companion) this.companion.update(time);
        
        // Interactive Hover check for Worlds and Doors
        if (!this.isTransitioning && Math.floor(time * 60) % 5 === 0) {
            this.raycaster.setFromCamera(this.mouse, this.camera);
            
            let hoveredDoorType = null;
            if (this.doorSystems && this.doorSystems.length > 0) {
                const doorHits = this.raycaster.intersectObjects(this.doorSystems.map(d => d.group), true);
                if (doorHits.length > 0) {
                    let hitNode = doorHits[0].object;
                    while(hitNode && !hitNode.userData.doorType) hitNode = hitNode.parent;
                    if(hitNode && hitNode.userData.doorType) hoveredDoorType = hitNode.userData.doorType;
                }
            }

            let hoveredLeafId = null;
            if(this.leaves && this.leaves.length > 0) {
                const leafHits = this.raycaster.intersectObjects(this.leaves, true);
                if (leafHits.length > 0) {
                    let hitLeaf = leafHits[0].object;
                    while(hitLeaf && !hitLeaf.userData.id) hitLeaf = hitLeaf.parent;
                    if(hitLeaf && hitLeaf.userData.id) hoveredLeafId = hitLeaf.userData.id;
                }
            }

            if (hoveredDoorType) {
                this.showWorldOverlay(hoveredDoorType);
            } else if (hoveredLeafId) {
                this.showWorldOverlay(hoveredLeafId);
            }

            if(this.doorSystems) {
                this.doorSystems.forEach(sys => {
                    sys.crystal.rotation.x += 0.01;
                    sys.crystal.rotation.y += 0.02;

                    if (sys.type === hoveredDoorType) {
                        gsap.to(sys.label.scale, { x: 74, y: 16, z: 1, duration: 0.4, overwrite: true, ease: "back.out(1.5)" });
                        sys.crystal.rotation.y += 0.08;
                        sys.crystal.scale.setScalar(1.5 + 0.1 * Math.sin(time*10));
                    } else {
                        gsap.to(sys.label.scale, { x: 0, y: 0, z: 0, duration: 0.3, overwrite: true });
                        sys.crystal.scale.setScalar(1);
                    }
                });
            }
        }

        this.renderer.render(this.scene, this.camera);
    }

    makeTextSprite(title, desc = "", customColor = "#d4af37") {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 1024;
        canvas.height = 256; 
        
        ctx.textAlign = "center";
        
        // Massive glowing Gold Title
        ctx.font = "Bold 70px Cinzel, serif";
        ctx.fillStyle = typeof customColor === 'number' ? '#' + customColor.toString(16).padStart(6, '0') : customColor;
        ctx.shadowColor = "rgba(0,0,0,1)";
        ctx.shadowBlur = 15;
        // Text Outline 
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 6;
        ctx.strokeText(title, 512, 100);
        ctx.fillText(title, 512, 100);
        
        // White description below it
        if(desc) {
            ctx.font = "32px Inter, sans-serif";
            ctx.fillStyle = "#ffffff";
            ctx.shadowBlur = 8;
            ctx.lineWidth = 4;
            ctx.strokeText(desc, 512, 180);
            ctx.fillText(desc, 512, 180);
        }
        
        const texture = new THREE.CanvasTexture(canvas);
        const mat = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false });
        const sprite = new THREE.Sprite(mat);
        sprite.scale.set(74, 16, 1); 
        return sprite;
    }
}


// Global Mount
window.OrbitEngine = new OrbitEngine();

