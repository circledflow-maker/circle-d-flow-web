import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.158.0/build/three.module.js';

class VisionSanctuary {
    constructor() {
        this.container = document.getElementById('canvas-container');
        this.mouse = new THREE.Vector2();
        this.raycaster = new THREE.Raycaster();
        this.sceneReady = false;
        this.autoPilotAngle = 0;
        this.targetRotation = new THREE.Vector2();
        this.hoveredOrb = null;
        this.time = 0;
        window.Sanctuary = this; 
        this.init();
    }

    init() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, logarithmicDepthBuffer: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.container.appendChild(this.renderer.domElement);

        // v8.0.0 LIQUID ENVIRONMENT
        const loader = new THREE.TextureLoader();
        loader.load('../Assets/images/equirectangular_grotto.png', (texture) => {
            const sphereGeo = new THREE.SphereGeometry(100, 64, 32);
            const sphereMat = new THREE.MeshBasicMaterial({ map: texture, side: THREE.BackSide });
            this.envSphere = new THREE.Mesh(sphereGeo, sphereMat);
            this.scene.add(this.envSphere);
        }, undefined, (err) => console.error("Env load error:", err));

        // SUNLIGHT & ATMOSPHERE
        const ambient = new THREE.AmbientLight(0x5A2A84, 0.8); 
        this.scene.add(ambient);
        
        // The Golden Sun (Match background horizon)
        this.sun = new THREE.PointLight(0xd4af37, 2, 200);
        this.sun.position.set(0, 5, -90);
        this.scene.add(this.sun);

        this.orbs = [];
        this.create3DOrbs();

        this.kylarGroup = new THREE.Group();
        this.createKylarHologram();
        this.scene.add(this.kylarGroup);

        this.createLiquidOcean();
        this.createDynamicFoliage();
        // this.createAdinkraWalls(); // DELETED: Not implemented
        this.createSankofaCrown();
        this.createLogPose();

        this.camera.position.set(0, 0, 15);
        this.animate();

        window.addEventListener('resize', () => this.onResize());
        window.addEventListener('mousemove', (e) => this.onMouseMove(e));
        window.addEventListener('click', (e) => this.onClick(e));
        
        this.orbsVisible = false;
        
        console.log("[v9.7] Living Liquidity Shift Initialized.");
        // Immediate Ready Signal
        if (window.SanctuaryLogic) window.SanctuaryLogic.on3DReady();
    }

    create3DOrbs() {
        const orbConfigs = [
            { id: 'garden', color: 0x4ade80, pos: [-7, 2, -6], label: 'Sacred Garden', url: 'memory_cave' },
            { id: 'oasis', color: 0x60a5fa, pos: [0, 5, -8], label: 'The Vision Oasis', url: 'vision_oasis' },
            { id: 'voyage', color: 0xd4af37, pos: [7, 2, -6], label: 'Voyage Portfolio', url: 'voyage_portfolio' },
            { id: 'collab', color: 0xa855f7, pos: [12, 0, -10], label: 'Collaborations', url: '/pages/kiss-your-heart.html#services' }
        ];

        orbConfigs.forEach(conf => {
            const group = new THREE.Group();
            group.position.set(...conf.pos);
            group.userData = { id: conf.id, url: conf.url };
            group.name = conf.id; // Crucial for Log Pose tracking
            group.visible = false; // Hidden until manifested

            const orbGeo = new THREE.IcosahedronGeometry(0.8, 2);
            const orbMat = new THREE.MeshPhongMaterial({ 
                color: conf.color, emissive: conf.color, emissiveIntensity: 0.8, 
                transparent: true, opacity: 0.8, shininess: 100
            });
            const orb = new THREE.Mesh(orbGeo, orbMat);
            group.add(orb);

            const pLight = new THREE.PointLight(conf.color, 1.5, 8);
            group.add(pLight);

            const ringGeo = new THREE.TorusGeometry(1.2, 0.03, 16, 100);
            const ringMat = new THREE.MeshBasicMaterial({ color: conf.color, transparent: true, opacity: 0.4 });
            const ring = new THREE.Mesh(ringGeo, ringMat);
            group.add(ring);

            this.orbs.push(group);
            this.scene.add(group);
        });
    }

    revealOrbs() {
        if (this.orbsVisible) return;
        this.orbsVisible = true;
        console.log("[v9.7] Manifesting Divine Crystals...");
        this.orbs.forEach((orb, i) => {
            orb.visible = true;
            orb.scale.set(0.1, 0.1, 0.1);
            orb.userData.animating = true;
            if (typeof gsap !== 'undefined') {
                gsap.to(orb.scale, { 
                    x: 1, y: 1, z: 1, 
                    duration: 1.5, 
                    delay: i * 0.2, 
                    ease: "back.out(1.7)",
                    onComplete: () => { orb.userData.animating = false; }
                });
            } else {
                orb.scale.set(1, 1, 1);
                orb.userData.animating = false;
            }
        });
    }

    createKylarHologram() {
        const loader = new THREE.TextureLoader();
        loader.load('../assets/images/kylar_avatar.png', (texture) => {
            const material = new THREE.MeshBasicMaterial({
                map: texture,
                transparent: true,
                side: THREE.DoubleSide
            });

            this.kylarSprite = new THREE.Mesh(new THREE.PlaneGeometry(12, 12), material);
            this.kylarSprite.position.set(0, -6, -12);
            this.kylarSprite.scale.set(0.4, 0.4, 0.4);
            this.kylarGroup.add(this.kylarSprite);

            console.log("[v9.7] Kylar Manifested.");
            if (this.entranceRequested) {
                this.playEntrance();
            }
            // Redundant signal to ensure sync
            if (window.SanctuaryLogic) window.SanctuaryLogic.on3DReady();
        }, undefined, (err) => {
            console.error("Kylar load error:", err);
            // Fallback signal if texture missing
            if (window.SanctuaryLogic) window.SanctuaryLogic.on3DReady();
        });
    }

    playEntrance() {
        this.entranceRequested = true;
        if (!this.kylarSprite) return;
        if (typeof gsap !== 'undefined') {
            gsap.to(this.kylarSprite.position, { y: -1.5, z: 0, duration: 5, ease: "power2.out" });
            gsap.to(this.kylarSprite.scale, { x: 1, y: 1, z: 1, duration: 5, ease: "power2.out" });
        } else {
            this.kylarSprite.position.set(0, -1.5, 0);
            this.kylarSprite.scale.set(1, 1, 1);
        }
    }

    createLiquidOcean() {
        // v8.0.0 LIQUID WATER SHADER
        const waterGeo = new THREE.PlaneGeometry(300, 300, 128, 128);
        this.waterMat = new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                uSunPos: { value: new THREE.Vector3(0, 5, -90) },
                uWaterColor: { value: new THREE.Color(0x1a0b2e) },
                uHighlightColor: { value: new THREE.Color(0xd4af37) }
            },
            vertexShader: `
                uniform float uTime;
                varying vec3 vPos;
                varying vec2 vUv;
                
                // Classic Perlin Noise simplified
                float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }
                float noise(vec2 p) {
                    vec2 i = floor(p); vec2 f = fract(p);
                    vec2 u = f*f*(3.0-2.0*f);
                    return mix(mix(hash(i + vec2(0,0)), hash(i + vec2(1,0)), u.x),
                               mix(hash(i + vec2(0,1)), hash(i + vec2(1,1)), u.x), u.y);
                }

                void main() {
                    vUv = uv;
                    vec3 pos = position;
                    float h = noise(uv * 10.0 + uTime * 0.2) * 1.5;
                    h += sin(pos.x * 0.1 + uTime) * 0.5;
                    pos.z += h;
                    vPos = pos;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
                }
            `,
            fragmentShader: `
                uniform float uTime;
                uniform vec3 uSunPos;
                uniform vec3 uWaterColor;
                uniform vec3 uHighlightColor;
                varying vec3 vPos;
                varying vec2 vUv;

                void main() {
                    vec3 normal = vec3(0.0, 0.0, 1.0); // Simple normal for base
                    vec3 viewDir = normalize(cameraPosition - vPos);
                    vec3 sunDir = normalize(uSunPos - vPos);
                    
                    // Specular Highlight (Golden Sunset Shimmer)
                    float spec = pow(max(dot(reflect(-sunDir, normal), viewDir), 0.0), 32.0);
                    vec3 finalColor = mix(uWaterColor, uHighlightColor, spec * 1.5); // Boosted shimmer
                    
                    // Distance Fade (Seamless Horizon)
                    float dist = length(vPos.xy);
                    float edgeFade = smoothstep(120.0, 50.0, dist);
                    
                    // Ripple effect
                    float ripples = sin(vUv.y * 100.0 + uTime * 2.0) * 0.1;
                    finalColor += ripples * 0.2;

                    gl_FragColor = vec4(finalColor, 0.8 * edgeFade);
                }
            `,
            transparent: true,
            side: THREE.DoubleSide
        });

        this.ocean = new THREE.Mesh(waterGeo, this.waterMat);
        this.ocean.rotation.x = -Math.PI / 2;
        this.ocean.position.y = -5;
        this.scene.add(this.ocean);
    }

    createDynamicFoliage() {
        // Removed as requested
        this.leaves = [];
    }

    createSankofaCrown() {
        // Feature retired: "S" removed from sky
        const crownLight = new THREE.PointLight(0xd4af37, 1, 40);
        crownLight.position.set(0, 25, -50);
        this.scene.add(crownLight);
    }

    createLogPose() {
        // v9.3.1 LOG POSE (Cinematic Navigation Needle)
        this.logPose = new THREE.Group();
        
        // Sphere house
        const glassGeo = new THREE.SphereGeometry(1.5, 32, 32);
        const glassMat = new THREE.MeshPhongMaterial({ color: 0xffffff, transparent: true, opacity: 0.2, shininess: 100 });
        const glass = new THREE.Mesh(glassGeo, glassMat);
        this.logPose.add(glass);

        // Needle
        const needleGeo = new THREE.ConeGeometry(0.2, 1.2, 8);
        const needleMat = new THREE.MeshBasicMaterial({ color: 0xd4af37 });
        this.needle = new THREE.Mesh(needleGeo, needleMat);
        this.needle.rotation.x = Math.PI / 2;
        this.logPose.add(this.needle);

        this.logPose.position.set(5, -3, 5); // Floating near camera
        this.camera.add(this.logPose);
        this.scene.add(this.camera); // Ensure camera is in scene for nested logPose
    }

    onMouseMove(e) {
        this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
        this.targetRotation.y = this.mouse.x * 0.15;
        this.targetRotation.x = -this.mouse.y * 0.08;
    }

    onClick(e) {
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.orbs, true);
        if (intersects.length > 0) {
            let target = intersects[0].object;
            while(target.parent && !target.userData.id) target = target.parent;
            if (target.userData.url && window.SanctuaryLogic) window.SanctuaryLogic.beamTo(target.userData.url);
        }
    }

    onResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        this.time += 0.01;

        // Auto-Pilot Drift
        this.autoPilotAngle += 0.001;
        this.camera.position.x += (Math.sin(this.autoPilotAngle) * 3 - this.camera.position.x) * 0.02;
        this.camera.position.y += (Math.cos(this.autoPilotAngle * 0.5) * 1.5 - this.camera.position.y) * 0.02;
        this.camera.lookAt(0, 2, -10);

        // Kylar Living State
        if(this.kylarSprite) {
            this.kylarSprite.material.uniforms.uTime.value = this.time;
            this.kylarGroup.rotation.y += (this.targetRotation.y - this.kylarGroup.rotation.y) * 0.05;
            this.kylarGroup.rotation.x += (this.targetRotation.x - this.kylarGroup.rotation.x) * 0.05;
        }

        // Ocean Flow & Shimmer
        if(this.waterMat) {
            this.waterMat.uniforms.uTime.value = this.time;
        }

        // Wind-Driven Foliage & Log Pose Update
        if(this.logPose && this.hoveredOrb) {
             // Needle points towards hovered target
             const target = this.scene.getObjectByName(this.hoveredOrb);
             if(target) this.needle.lookAt(target.position);
        }
        if (this.leaves) {
            this.leaves.forEach(l => {
                const p = l.userData;
                l.position.y += Math.sin(this.time * p.speed + p.phase) * 0.02;
                l.position.x += Math.cos(this.time * 0.5 * p.speed + p.phase) * 0.01;
                l.rotation.z += 0.005;
                l.rotation.x += Math.sin(this.time) * 0.002;
            });
        }

        // Crystal Orb Living State
        this.orbs.forEach((orb, i) => {
            orb.position.y += Math.sin(this.time + i) * 0.01;
            orb.rotation.y += 0.005;
            
            this.raycaster.setFromCamera(this.mouse, this.camera);
            const intersects = this.raycaster.intersectObjects([orb], true);
            
            if (!orb.userData.animating) {
                if (intersects.length > 0) {
                    if (this.hoveredOrb !== orb.userData.id) {
                        this.hoveredOrb = orb.userData.id;
                        if (window.SanctuaryLogic) window.SanctuaryLogic.onOrbHover(orb.userData.id);
                    }
                    orb.scale.lerp(new THREE.Vector3(1.3, 1.3, 1.3), 0.1);
                } else {
                    if (this.hoveredOrb === orb.userData.id) this.hoveredOrb = null;
                    orb.scale.lerp(new THREE.Vector3(1.0, 1.0, 1.0), 0.1);
                }
            }
        });

        this.renderer.render(this.scene, this.camera);
    }
}

export { VisionSanctuary };
window.Sanctuary = new VisionSanctuary();
