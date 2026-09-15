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
        this.group.position.set(6, 52, 12);

        const coreGeo = new THREE.SphereGeometry(1.1, 16, 16);
        const coreMat = new THREE.MeshStandardMaterial({
            color: 0x00ffcc,
            emissive: 0x00ffcc,
            emissiveIntensity: 1.8,
            transparent: true,
            opacity: 0.95,
        });
        this.core = new THREE.Mesh(coreGeo, coreMat);
        this.group.add(this.core);

        const wingGeo = new THREE.PlaneGeometry(2.4, 1.1);
        const wingMat = new THREE.MeshBasicMaterial({
            color: 0x00ffcc,
            transparent: true,
            opacity: 0.75,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
        });
        this.leftWing = new THREE.Mesh(wingGeo, wingMat);
        this.leftWing.position.set(-1.5, 0, 0);
        this.leftWing.rotation.y = 0.4;
        this.group.add(this.leftWing);
        this.rightWing = new THREE.Mesh(wingGeo, wingMat);
        this.rightWing.position.set(1.5, 0, 0);
        this.rightWing.rotation.y = -0.4;
        this.group.add(this.rightWing);

        const glow = new THREE.PointLight(0x00ffcc, 2.5, 40);
        this.group.add(glow);

        this.scene.add(this.group);
    }

    update(time) {
        const orbit = 14;
        this.group.position.x = Math.cos(time * 0.35) * orbit;
        this.group.position.z = 12 + Math.sin(time * 0.35) * orbit;
        this.group.position.y = 52 + Math.sin(time * 1.8) * 1.5;
        this.core.rotation.y = time * 0.6;
        const flap = Math.sin(time * 4) * 0.35;
        this.leftWing.rotation.z = 0.25 + flap;
        this.rightWing.rotation.z = -0.25 - flap;
    }
}

class OrbitEngine {
    constructor() {
        this.container = document.getElementById('canvas-container');
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x020108);
        this.scene.fog = new THREE.FogExp2(0x020108, 0.00085);
        
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
        
        this.portalRings = [];
        this.worldLabels = [];
        this.doors = [];
        this.isTransitioning = false;
        this.treeRotationPaused = false;
        this._hoveredWorldId = null;
        this._fitCameraState = null;
        this._treeBaseScale = 1;

        window.OrbitEngine = this;
        this.init();
    }

    init() {
        console.log("🌌 [Oracle] Initializing Weltenbaum Sequence...");

        if (window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches) {
            this.createStars();
            this.createConstellations();
            this.createAfricaSource();
            this.createYggdrasil();
            this.createAdinkraLeaves();
            this.companion = new FloweeCompanion(this.scene);
            this.animate();
            setTimeout(() => this.skipIntro(), 400);
            return;
        }
        
        this.createStars();
        this.createConstellations();
        this.createMeteorSystem();
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

        const worldLight = new THREE.PointLight(0xd4af37, 3, 120);
        worldLight.position.set(0, 45, 30);
        this.scene.add(worldLight);

        window.addEventListener('resize', () => this.onResize());
        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', () => this.onResize());
        }
        window.addEventListener('LANDING_CHROME_SYNC', () => this.onResize());
        window.addEventListener('LANDING_INTRO_COMPLETE', () => this.onResize());
        window.addEventListener('mousemove', (e) => this._setPointerFromEvent(e));
        window.addEventListener('mousemove', (e) => this._setPointerFromEvent(e));
        window.addEventListener('pointerdown', (e) => {
            this._setPointerFromEvent(e);
            this.onClick();
        });

        // Bind Skip Button
        const skipBtn = document.getElementById('btn-skip');
        if(skipBtn) skipBtn.onclick = () => this.skipIntro();

        this.animate();

        // Initial reveal — zoom into a viewport-fitted frame (full tree visible)
        this._adaptTreeScale();
        const fit = this.fitTreeInView({ padding: 1.38, animate: false });
        const startZ = fit.position.z * 2.6;
        this.camera.position.set(fit.position.x, fit.position.y, startZ);
        this.camera.lookAt(fit.target);
        gsap.to(this.camera.position, {
            z: fit.position.z,
            duration: 3,
            ease: 'expo.out',
            onUpdate: () => this.camera.lookAt(fit.target),
        });
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
        if (this._storyTl) {
            this._storyTl.kill();
            this._storyTl = null;
        }
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

        // Frame the Tree — all four worlds visible
        this.frameTreeForInteraction();
        
        // Reset Transition Flag (Crucial Fix)
        this.isTransitioning = false;
        console.log("🔓 [Oracle] Interaction Unlocked.");
        this._signalIntroComplete();
    }

    createStars() {
        const geo = new THREE.BufferGeometry();
        const count = 10000;
        const pos = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            const i3 = i * 3;
            const radius = 600 + Math.random() * 900;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            pos[i3] = radius * Math.sin(phi) * Math.cos(theta);
            pos[i3 + 1] = Math.abs(radius * Math.cos(phi)) * 0.55 + 80;
            pos[i3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
            const tint = 0.75 + Math.random() * 0.25;
            colors[i3] = tint;
            colors[i3 + 1] = tint;
            colors[i3 + 2] = 0.92 + Math.random() * 0.08;
        }
        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        const mat = new THREE.PointsMaterial({
            size: 1.4,
            vertexColors: true,
            transparent: true,
            opacity: 0.92,
            sizeAttenuation: true,
            depthWrite: false,
        });
        this.stars = new THREE.Points(geo, mat);
        this.scene.add(this.stars);

        this.updateCelestialRotation();
    }

    createConstellations() {
        if (!this.stars) return;
        this.constellationGroup = new THREE.Group();
        const defs = [
            { name: 'Navigator', color: 0x00ffcc, points: [[-120, 280, -80], [-60, 320, -40], [0, 300, 20], [-80, 250, -100]] },
            { name: 'Armillary', color: 0xd4af37, points: [[100, 350, -120], [160, 330, -90], [200, 280, -60], [140, 260, -130]] },
            { name: 'Flow Gate', color: 0xff66cc, points: [[-20, 220, -200], [40, 260, -160], [0, 290, -120], [-50, 240, -180]] },
        ];
        defs.forEach((c) => {
            const verts = [];
            c.points.forEach((p) => verts.push(p[0], p[1], p[2]));
            const lineGeo = new THREE.BufferGeometry();
            lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
            const line = new THREE.Line(
                lineGeo,
                new THREE.LineBasicMaterial({ color: c.color, transparent: true, opacity: 0.5 })
            );
            this.constellationGroup.add(line);
            c.points.forEach((p) => {
                const node = new THREE.Mesh(
                    new THREE.SphereGeometry(1.4, 8, 8),
                    new THREE.MeshBasicMaterial({ color: c.color, transparent: true, opacity: 0.88 })
                );
                node.position.set(p[0], p[1], p[2]);
                this.constellationGroup.add(node);
            });
        });
        this.stars.add(this.constellationGroup);
    }

    createMeteorSystem() {
        this._meteors = [];
        for (let i = 0; i < 14; i++) {
            const geo = new THREE.BufferGeometry();
            geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3));
            const line = new THREE.Line(
                geo,
                new THREE.LineBasicMaterial({
                    color: 0xffffff,
                    transparent: true,
                    opacity: 0,
                    blending: THREE.AdditiveBlending,
                })
            );
            line.frustumCulled = false;
            this.scene.add(line);
            this._meteors.push({
                line,
                active: false,
                t: 0,
                duration: 1,
                start: new THREE.Vector3(),
                end: new THREE.Vector3(),
                dir: new THREE.Vector3(),
            });
        }
    }

    _spawnMeteor() {
        const m = this._meteors?.find((x) => !x.active);
        if (!m) return;
        const sx = (Math.random() - 0.5) * 1400;
        const sy = 220 + Math.random() * 420;
        const sz = (Math.random() - 0.5) * 1400;
        m.start.set(sx, sy, sz);
        m.dir.set(-0.35 - Math.random() * 0.35, -0.55 - Math.random() * 0.25, -0.15 + Math.random() * 0.35).normalize();
        m.end.copy(m.start).addScaledVector(m.dir, 160 + Math.random() * 140);
        m.t = 0;
        m.duration = 0.55 + Math.random() * 0.75;
        m.active = true;
        m.line.material.opacity = 0.95;
    }

    _updateMeteors() {
        if (!this._meteors?.length) return;
        if (Math.random() < 0.014) this._spawnMeteor();
        this._meteors.forEach((m) => {
            if (!m.active) return;
            m.t += 0.018;
            const p = Math.min(1, m.t / m.duration);
            const pos = m.line.geometry.attributes.position;
            const x = m.start.x + (m.end.x - m.start.x) * p;
            const y = m.start.y + (m.end.y - m.start.y) * p;
            const z = m.start.z + (m.end.z - m.start.z) * p;
            const tail = 42;
            pos.setXYZ(0, x - m.dir.x * tail, y - m.dir.y * tail, z - m.dir.z * tail);
            pos.setXYZ(1, x, y, z);
            pos.needsUpdate = true;
            m.line.material.opacity = p < 0.8 ? 0.85 : 0.85 * (1 - p);
            if (p >= 1) {
                m.active = false;
                m.line.material.opacity = 0;
            }
        });
    }

    _narrate(text, key) {
        window.dispatchEvent(new CustomEvent('INTRO_NARRATIVE_LINE', { detail: { key, text } }));
        const whisper = document.getElementById('flowee-intro-text');
        if (whisper) whisper.textContent = text;
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
            emissiveIntensity: 0.85,
            wireframe: true,
            transparent: true,
            opacity: 0.32
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
        // Front-facing arc — all four worlds visible to camera at z ≈ 88
        const isMobile = window.innerWidth < 768;
        const spread = isMobile ? 1.15 : 1;
        const classes = [
            { id: 'luvo', label: 'LUVO', color: 0xd4af37, pos: [-14 * spread, 50, 24] },
            { id: 'bantaba', label: 'BANTABA', color: 0x00ff88, pos: [14 * spread, 50, 24] },
            { id: 'archive', label: 'ARCHIVE', color: 0x00f0ff, pos: [-16 * spread, 34, 20] },
            { id: 'heart', label: 'HEART', color: 0xff5522, pos: [16 * spread, 34, 20] },
        ];

        this.leaves = [];
        classes.forEach((c) => {
            const leafGeo = new THREE.IcosahedronGeometry(isMobile ? 4.2 : 3.5, 0);
            const leafMat = new THREE.MeshStandardMaterial({
                color: c.color,
                emissive: c.color,
                emissiveIntensity: 2.5,
                transparent: true,
                opacity: 0.95,
            });
            const leaf = new THREE.Mesh(leafGeo, leafMat);
            leaf.position.set(...c.pos);
            leaf.userData = { id: c.id };
            this.treeGroup.add(leaf);
            this.leaves.push(leaf);

            const ringGeo = new THREE.TorusGeometry(isMobile ? 6 : 5, 0.12, 16, 32);
            const ringMat = new THREE.MeshBasicMaterial({ color: c.color, transparent: true, opacity: 0.9 });
            const portalRing = new THREE.Mesh(ringGeo, ringMat);
            portalRing.position.set(...c.pos);
            portalRing.name = 'portal_ring_' + c.id;
            portalRing.userData = { id: c.id };
            this.treeGroup.add(portalRing);
            this.portalRings.push(portalRing);

            gsap.to(portalRing.scale, { x: 1.35, y: 1.35, z: 1.35, duration: 2, repeat: -1, ease: 'sine.inOut' });
            gsap.to(portalRing.material, { opacity: 0.35, duration: 2, repeat: -1, ease: 'power1.in' });
            gsap.to(leaf.scale, { x: 1.15, y: 1.15, z: 1.15, duration: 2, repeat: -1, yoyo: true, ease: 'sine.inOut' });

            const label = this.makeTextSprite(c.label, '', this._hexColor(c.color));
            label.position.set(c.pos[0], c.pos[1] + (isMobile ? 10 : 8), c.pos[2]);
            const lw = isMobile ? 18 : 14;
            const lh = isMobile ? 4.5 : 3.5;
            label.scale.set(lw, lh, 1);
            label.userData = { id: c.id };
            label.renderOrder = 999;
            this.treeGroup.add(label);
            this.worldLabels.push(label);
        });
    }

    _worldRoutes() {
        return {
            luvo: { luvo: true, msg: 'Entering Luvo Chamber…', color: '#d4af37' },
            bantaba: { url: 'pages/bantaba.html', msg: 'Entering Bantaba…', color: '#00ff88' },
            archive: { url: 'pages/archive.html', msg: 'Entering The Archive…', color: '#00f0ff' },
            heart: { url: 'pages/kyh/', msg: 'Entering Kiss Your Heart…', subtitle: 'Creative Project Management Studio', color: '#ff5522' },
        };
    }

    _signalIntroComplete() {
        window.__landingIntroDone = true;
        window.dispatchEvent(new CustomEvent('LANDING_INTRO_COMPLETE'));
    }

    navigateToWorld(url, msg, color) {
        if (!url) { this.isTransitioning = false; return; }
        const overlay = document.getElementById('flowee-intro');
        if (overlay) {
            overlay.style.display = 'flex';
            overlay.innerHTML = `<h2 style="color:${color};font-family:Cinzel,serif;text-align:center;padding:24px">${msg}</h2>`;
            gsap.to(overlay, { opacity: 1, duration: 0.6, onComplete: () => {
                window.location.href = url;
            }});
        } else {
            window.location.href = url;
        }
    }

    _getUiInsets() {
        const { width, height } = this._viewportSize();
        const isMobile = width < 768;
        const short = height < 520;
        const worldNav = document.getElementById('world-quick-nav');
        const navVisible = worldNav?.classList.contains('visible');
        const bubbleOpen = document.body.classList.contains('flowee-bubble-open');
        let bottom = isMobile ? 20 : 32;
        if (isMobile) {
            if (bubbleOpen) bottom = short ? 72 : 80;
            else if (navVisible) bottom = short ? 100 : 112;
            else bottom = short ? 56 : 64;
        }
        return {
            top: isMobile ? 50 : 40,
            bottom: Math.min(bottom, height * 0.28),
            left: 0,
            right: isMobile ? 32 : 0,
        };
    }

    _applyViewOffset() {
        const { width, height } = this._viewportSize();
        const ins = this._getUiInsets();
        const viewW = Math.max(1, width - ins.left - ins.right);
        const viewH = Math.max(1, height - ins.top - ins.bottom);
        this.camera.clearViewOffset();
        this.camera.setViewOffset(width, height, ins.left, ins.top, viewW, viewH);
        this.camera.updateProjectionMatrix();
    }

    _adaptTreeScale() {
        if (!this.treeGroup) return;
        const { width, height } = this._viewportSize();
        let s = 1;
        if (height < 460) s = 0.52;
        else if (height < 520) s = 0.62;
        else if (height < 600) s = 0.72;
        else if (height < 720) s = 0.82;
        else if (width < 768) s = 0.9;
        this._treeBaseScale = s;
        this.treeGroup.scale.setScalar(s);
        if (this.africaSource) {
            this.africaSource.scale.setScalar(s);
            this.africaSource.position.y = -60 * s;
        }
        if (this.sourceAnchor) {
            this.sourceAnchor.scale.setScalar(s);
            this.sourceAnchor.position.y = -60 * s;
        }
    }

    _getTreeBounds() {
        const box = new THREE.Box3();
        if (this.treeGroup) box.setFromObject(this.treeGroup);
        if (this.africaSource) box.expandByObject(this.africaSource);
        if (box.isEmpty()) {
            box.set(new THREE.Vector3(-22, -70, -12), new THREE.Vector3(22, 68, 32));
        }
        return box;
    }

    /**
     * Fit the entire Weltenbaum into the visible viewport (above bottom UI chrome).
     */
    fitTreeInView(opts = {}) {
        const padding = opts.padding ?? 1.18;
        const animate = opts.animate ?? false;
        const duration = opts.duration ?? 1.8;

        this._adaptTreeScale();
        this._applyViewOffset();

        const { width, height } = this._viewportSize();
        const ins = this._getUiInsets();
        const viewAspect = (width - ins.left - ins.right) / Math.max(1, height - ins.top - ins.bottom);

        const box = this._getTreeBounds();
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        const target = center.clone();
        target.y += size.y * 0.04;

        const vfov = (this.camera.fov * Math.PI) / 180;
        const hfov = 2 * Math.atan(Math.tan(vfov / 2) * viewAspect);
        const distY = (size.y / 2) / Math.tan(vfov / 2);
        const distX = (size.x / 2) / Math.tan(hfov / 2);
        const distance = Math.max(distX, distY) * padding;

        const camPos = new THREE.Vector3(center.x, center.y, center.z + distance);
        this._fitCameraState = { position: camPos.clone(), target: target.clone(), distance };

        const aim = () => this.camera.lookAt(target);
        if (animate) {
            gsap.to(this.camera.position, {
                x: camPos.x,
                y: camPos.y,
                z: camPos.z,
                duration,
                ease: 'power2.out',
                onUpdate: aim,
                onComplete: aim,
            });
        } else {
            this.camera.position.copy(camPos);
            aim();
        }
        return this._fitCameraState;
    }

    frameTreeForInteraction() {
        this.treeRotationPaused = true;
        if (this.treeGroup) this.treeGroup.rotation.y = 0;
        this.fitTreeInView({ padding: 1.16, animate: true, duration: 1.8 });
    }

    _setPointerFromEvent(e) {
        const rect = this.renderer.domElement.getBoundingClientRect();
        const cx = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
        const cy = e.clientY ?? e.touches?.[0]?.clientY ?? 0;
        const x = (cx - rect.left) / rect.width;
        const y = (cy - rect.top) / rect.height;
        this.mouse.x = x * 2 - 1;
        this.mouse.y = -(y * 2 - 1);
    }

    _hexColor(c) {
        return '#' + c.toString(16).padStart(6, '0');
    }

    onClick() {
        if(this.isTransitioning) return;

        this.raycaster.setFromCamera(this.mouse, this.camera);
        
        const targets = [...this.leaves, ...(this.portalRings || []), ...(this.worldLabels || []), ...this.doors];
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
            if (obj.userData.doorType) {
                this.animateDoorOpen(obj);
                return;
            }
            if (id) {
                this.enterWorld(id);
                return;
            }

            if (obj === this.sourceAnchor) {
                this.transitionToLuvo(obj);
            }
        }
    }

    enterWorld(id) {
        if (!id || this.isTransitioning) return;
        this.showWorldOverlay(id);
        this.handleOverlayClick(id);
    }

    handleOverlayClick(id) {
        if (!id || this.isTransitioning) return;

        const routes = this._worldRoutes();
        const route = routes[id];

        if (route?.luvo) {
            const leaf = this.leaves.find((l) => l.userData.id === 'luvo');
            this.transitionToLuvo(leaf || null);
            return;
        }

        if (route?.modal) {
            const modal = document.getElementById('connection-modal');
            if (modal) modal.classList.remove('opacity-0', 'pointer-events-none');
            this.isTransitioning = false;
            return;
        }

        if (!route?.url) {
            this.isTransitioning = false;
            return;
        }

        this.isTransitioning = true;
        const line = route.subtitle
            ? `${route.msg}<br><span style="font-size:0.85em;opacity:0.85;font-family:Inter,sans-serif">${route.subtitle}</span>`
            : route.msg;
        this.navigateToWorld(route.url, line, route.color);
    }

    highlightWorld(id) {
        if (!id || !this.leaves?.length) return;
        const leaf = this.leaves.find((l) => l.userData.id === id);
        if (!leaf) return;
        const target = new THREE.Vector3();
        leaf.getWorldPosition(target);
        const camPos = new THREE.Vector3(target.x, target.y + 6, target.z + 28);
        gsap.to(this.camera.position, {
            x: camPos.x,
            y: camPos.y,
            z: camPos.z,
            duration: 1.4,
            ease: 'power2.out',
            onUpdate: () => this.camera.lookAt(target),
            onComplete: () => this.camera.lookAt(target),
        });
        gsap.fromTo(leaf.scale, { x: 1, y: 1, z: 1 }, { x: 1.35, y: 1.35, z: 1.35, duration: 0.45, yoyo: true, repeat: 1 });
        this.showWorldOverlay(id);
    }

    runStorySequence() {
        console.log("🎬 [Oracle] Starting Story Sequence...");
        this.isTransitioning = true;
        
        const lang = localStorage.getItem('cqr_lang') || 'en';
        const dict = window.i18n[lang] || window.i18n.en;
        
        const tl = gsap.timeline();
        this._storyTl = tl;
        const textOverlay = document.getElementById('narrative-overlay');
        const textEl = document.getElementById('narrative-text');
        
        tl.to(['#hold-hint', '#flowee-intro'], { opacity: 0, duration: 1 });

        const fit = this.fitTreeInView({ padding: 1.24, animate: false });
        const p = fit.position;
        const look = fit.target;
        const aim = () => this.camera.lookAt(look);

        tl.to(this.camera.position, {
            x: p.x - 6, y: p.y + 4, z: p.z * 1.04,
            duration: 2.5, ease: 'power2.inOut', onUpdate: aim,
        }, 0);
        tl.call(() => {
            textEl.innerHTML = dict.intro_1;
            this._narrate(dict.intro_1, 'intro_1');
            gsap.to(textOverlay, { opacity: 1, duration: 1 });
        }, null, 0.8);
        tl.to(textOverlay, { opacity: 0, duration: 1 }, 3.5);

        tl.to(this.camera.position, {
            x: p.x + 6, y: p.y + 6, z: p.z,
            duration: 3, ease: 'power1.inOut', onUpdate: aim,
        }, 4);
        tl.call(() => {
            textEl.innerHTML = dict.intro_2;
            this._narrate(dict.intro_2, 'intro_2');
            gsap.to(textOverlay, { opacity: 1, duration: 1 });
        }, null, 4.5);
        tl.to(textOverlay, { opacity: 0, duration: 1 }, 7);

        tl.to(this.camera.position, {
            x: p.x, y: p.y + 10, z: p.z * 0.92,
            duration: 2.8, ease: 'sine.inOut', onUpdate: aim,
        }, 7.5);
        tl.call(() => {
            const treeLine = dict.intro_tree || dict.intro_2;
            textEl.innerHTML = treeLine;
            this._narrate(treeLine, 'intro_tree');
            gsap.to(textOverlay, { opacity: 1, duration: 1 });
            if (this.trunk?.material) gsap.to(this.trunk.material, { opacity: 0.48, duration: 1.5 });
        }, null, 8);
        tl.to(textOverlay, { opacity: 0, duration: 1 }, 10.5);

        tl.to(this.camera.position, {
            x: p.x, y: p.y + 2, z: p.z * 0.97,
            duration: 2.5, ease: 'sine.inOut', onUpdate: aim,
        }, 10.5);
        tl.call(() => {
            textEl.innerHTML = dict.intro_3;
            this._narrate(dict.intro_3, 'intro_3');
            gsap.to(textOverlay, { opacity: 1, duration: 1 });
        }, null, 11);
        tl.to(textOverlay, { opacity: 0, duration: 1 }, 13.5);

        tl.call(() => {
            this.isTransitioning = false;
            this.frameTreeForInteraction();
            gsap.to('#title-overlay', { opacity: 1, duration: 2 });
            gsap.to('#title-overlay', { opacity: 0, duration: 2, delay: 6 });
            
            gsap.to('#btn-skip', { opacity: 0, duration: 0.5, onComplete: () => {
                const btn = document.getElementById('btn-skip');
                if (btn) btn.style.display = 'none';
                this._signalIntroComplete();
            }});
        }, null, 14.5);
        
        if(window.Pusher) window.Pusher.showToast("The Source Awakens...", "mystic");
    }

    showWorldOverlay(id) {
        const overlay = document.getElementById('world-info-overlay');
        const title = document.getElementById('world-title');
        const desc = document.getElementById('world-slogan');
        const hint = document.querySelector('.dive-hint');

        if(!overlay || !title || !desc) return;

        // Set Data
        title.setAttribute('data-world-id', id);
        title.setAttribute('data-i18n', `world_${id}_tit`);
        desc.setAttribute('data-i18n', `world_${id}_desc`);
        if(hint) hint.innerHTML = window.matchMedia('(max-width: 768px)').matches
            ? "[ TAP TO ENTER ]"
            : "[ CLICK TO ENTER ]";

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
        const isMobile = width < 768;
        const short = height < 560;
        this.camera.fov = isMobile ? (short ? 68 : 64) : 60;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height, false);
        this._applyViewOffset();
    }

    onResize() {
        this._applyRendererSize();
        if (this.treeGroup && window.__landingIntroDone && !this.isTransitioning) {
            this.fitTreeInView({ padding: 1.16, animate: false });
        }
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        const time = this.clock.getElapsedTime();

        if (this.africaSource) this.africaSource.material.uniforms.time.value = time;
        if (this.stars) {
            this.stars.rotation.y += 0.00035;
            if (this.stars.material) {
                this.stars.material.opacity = 0.86 + Math.sin(time * 0.55) * 0.06;
            }
        }
        this._updateMeteors();
        if (this.treeGroup && !this.treeRotationPaused) this.treeGroup.rotation.y += 0.001;
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
            const worldTargets = [...(this.leaves || []), ...(this.portalRings || []), ...(this.worldLabels || [])];
            if (worldTargets.length > 0) {
                const leafHits = this.raycaster.intersectObjects(worldTargets, true);
                if (leafHits.length > 0) {
                    let hitLeaf = leafHits[0].object;
                    while(hitLeaf && !hitLeaf.userData.id) hitLeaf = hitLeaf.parent;
                    if(hitLeaf && hitLeaf.userData.id) hoveredLeafId = hitLeaf.userData.id;
                }
            }

            if (hoveredLeafId && hoveredLeafId !== this._hoveredWorldId) {
                this._hoveredWorldId = hoveredLeafId;
                this.showWorldOverlay(hoveredLeafId);
            } else if (!hoveredLeafId) {
                this._hoveredWorldId = null;
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
        canvas.height = 280;

        ctx.textAlign = 'center';
        ctx.font = 'Bold 82px Cinzel, Georgia, serif';
        const fill = typeof customColor === 'number' ? '#' + customColor.toString(16).padStart(6, '0') : customColor;
        ctx.fillStyle = fill;
        ctx.shadowColor = 'rgba(0,0,0,0.95)';
        ctx.shadowBlur = 20;
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 8;
        ctx.strokeText(title, 512, 110);
        ctx.fillText(title, 512, 110);
        
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

