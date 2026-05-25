import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.158.0/build/three.module.js';
import { gsap } from 'https://cdn.jsdelivr.net/npm/gsap@3.12.5/index.js';

class InitiationOrbit {
    constructor() {
        this.container = document.body;
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        
        this.state = 'TUNNEL'; // TUNNEL, ALTAR, TABLET, MESSAGE, QUIZ, DOOR
        this.init();
    }

    init() {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        document.body.appendChild(this.renderer.domElement);
        this.renderer.domElement.id = "initiation-canvas";
        this.renderer.domElement.style.position = "absolute";
        this.renderer.domElement.style.top = "0";
        this.renderer.domElement.style.zIndex = "-1";

        this.scene.fog = new THREE.FogExp2(0x050505, 0.05);

        this.initLights();
        this.createRuinTunnel();
        this.createDecisionAltar();
        
        this.camera.position.set(0, 0, 10);

        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });

        this.animate = this.animate.bind(this);
        this.animate();
    }

    initLights() {
        const ambient = new THREE.AmbientLight(0x404040, 0.5);
        this.scene.add(ambient);
        
        this.mainPoint = new THREE.PointLight(0x9a4dff, 5, 100);
        this.mainPoint.position.set(0, 5, -10);
        this.scene.add(this.mainPoint);

        // Sub-pulses for gold cracks
        this.goldLight = new THREE.PointLight(0xd4af37, 2, 50);
        this.scene.add(this.goldLight);
    }

    createRuinTunnel() {
        this.tunnelGroup = new THREE.Group();
        this.scene.add(this.tunnelGroup);

        // 1. BASE STONE SHELL (Dark Obsidian)
        const tunnelGeo = new THREE.CylinderGeometry(12, 12, 600, 16, 60, true);
        const tunnelMat = new THREE.MeshStandardMaterial({
            color: 0x0a0a0a,
            side: THREE.BackSide,
            roughness: 1.0,
            metalness: 0.1
        });
        const shell = new THREE.Mesh(tunnelGeo, tunnelMat);
        shell.rotation.x = Math.PI / 2;
        shell.position.z = -250;
        this.tunnelGroup.add(shell);

        // 2. DETAILED STONE BLOCKS (Ruin segments)
        const blockMat = new THREE.MeshStandardMaterial({
            color: 0x222222,
            roughness: 0.9,
            metalness: 0.05
        });

        for(let i=0; i<40; i++) {
            const z = - (i * 15);
            const r = 11.5;
            const segments = 4;
            for(let s=0; s<segments; s++) {
                if(Math.random() > 0.4) {
                    const angle = (s / segments) * Math.PI * 2 + (i * 0.2);
                    const blockGeo = new THREE.BoxGeometry(
                        8 + Math.random() * 4,
                        1 + Math.random() * 0.5,
                        10 + Math.random() * 5
                    );
                    const block = new THREE.Mesh(blockGeo, blockMat);
                    
                    block.position.set(Math.cos(angle)*r, Math.sin(angle)*r, z);
                    block.lookAt(0, 0, z);
                    block.rotation.z += (Math.random() - 0.5) * 0.2; // Jitter for ruin feel
                    this.tunnelGroup.add(block);
                }
            }
        }

        // 3. GOLDEN ENERGY CRACKS (Glowing veins)
        const crackGeo = new THREE.CylinderGeometry(11.8, 11.8, 600, 8, 30, true);
        const crackMat = new THREE.MeshStandardMaterial({
            color: 0xd4af37,
            emissive: 0xd4af37,
            emissiveIntensity: 2.0,
            wireframe: true,
            transparent: true,
            opacity: 0.4,
            side: THREE.BackSide,
            blending: THREE.AdditiveBlending
        });
        const cracks = new THREE.Mesh(crackGeo, crackMat);
        cracks.rotation.x = Math.PI / 2;
        cracks.position.z = -250;
        this.tunnelGroup.add(cracks);
        
        // Pulse the cracks
        gsap.to(crackMat, { emissiveIntensity: 4.0, duration: 2, repeat: -1, yoyo: true, ease: "sine.inOut" });

        // 4. FLOATING VINES
        this.roots = new THREE.Group();
        for(let i=0; i<60; i++) {
            const rGeo = new THREE.CylinderGeometry(0.12, 0.04, 30, 8);
            const rMat = new THREE.MeshStandardMaterial({ color: 0x120802, roughness: 1 });
            const root = new THREE.Mesh(rGeo, rMat);
            const angle = Math.random() * Math.PI * 2;
            const dist = 8 + Math.random() * 3;
            root.position.set(
                Math.cos(angle) * dist,
                Math.sin(angle) * dist,
                -Math.random() * 500
            );
            root.rotation.set(Math.random(), Math.random(), Math.random());
            this.roots.add(root);
        }
        this.scene.add(this.roots);
    }

    createDecisionAltar() {
        const altarGroup = new THREE.Group();
        
        // MULTI-TIERED PREMIUM ALTAR
        // 1. Foundation
        const base1Geo = new THREE.CylinderGeometry(5, 5.5, 1.5, 32);
        const stoneMat = new THREE.MeshStandardMaterial({ color: 0x151515, roughness: 0.9, metalness: 0.1 });
        const base1 = new THREE.Mesh(base1Geo, stoneMat);
        altarGroup.add(base1);

        // 2. Middle Tier
        const base2Geo = new THREE.CylinderGeometry(4.2, 4.8, 1.8, 32);
        const base2 = new THREE.Mesh(base2Geo, stoneMat);
        base2.position.y = 1.6;
        altarGroup.add(base2);

        // 3. Top Offering Table (Glowing Rim)
        const topGeo = new THREE.CylinderGeometry(3.8, 4.0, 0.6, 64);
        const topMat = new THREE.MeshStandardMaterial({ 
            color: 0x222222, 
            emissive: 0x9a4dff, 
            emissiveIntensity: 0.8,
            roughness: 0.3 
        });
        const top = new THREE.Mesh(topGeo, topMat);
        top.position.y = 2.8;
        altarGroup.add(top);

        // 4. Central Energy Core
        const coreGeo = new THREE.SphereGeometry(1.2, 32, 16);
        const coreMat = new THREE.MeshStandardMaterial({ 
            color: 0x9a4dff, 
            emissive: 0x9a4dff, 
            emissiveIntensity: 2.0,
            transparent: true,
            opacity: 0.8
        });
        this.altarCore = new THREE.Mesh(coreGeo, coreMat);
        this.altarCore.position.y = 4.2;
        altarGroup.add(this.altarCore);
        
        // Pulse the core
        gsap.to(this.altarCore.scale, { x: 1.2, y: 1.2, z: 1.2, duration: 1.5, repeat: -1, yoyo: true, ease: "sine.inOut" });

        altarGroup.position.set(0, -5, -45);
        this.scene.add(altarGroup);
        this.altar = altarGroup;

        // Floating Interactive Tokens (Simplified 3D Icons)
        this.symbols = new THREE.Group();
        this.scene.add(this.symbols);
        
        const tokenGeo = new THREE.IcosahedronGeometry(0.6, 1);
        for(let i=0; i<3; i++) {
            const tokenMat = new THREE.MeshStandardMaterial({ 
                color: 0xffffff, 
                emissive: 0x9a4dff,
                emissiveIntensity: 1.5 
            });
            const token = new THREE.Mesh(tokenGeo, tokenMat);
            const angle = (i / 3) * Math.PI * 2;
            token.position.set(Math.cos(angle) * 6, 1, -45 + Math.sin(angle) * 6);
            this.symbols.add(token);
        }
    }

    animate() {
        requestAnimationFrame(this.animate);
        const time = performance.now() * 0.001;

        // Camera Logic based on State
        let targetZ = this.camera.position.z;
        let targetY = 1.6; // Eye level

        if (this.state === 'TUNNEL') {
            targetZ -= 0.05; // Slow drift
        } else if (this.state === 'ALTAR') {
            targetZ = -30; // Move to altar
        } else if (this.state === 'TABLET') {
            targetZ = -60; // Further in
        } else if (this.state === 'QUIZ') {
            targetZ = -120; // Deeper
        } else if (this.state === 'DOOR') {
            targetZ = -400; // Pass through
        }

        this.camera.position.z += (targetZ - this.camera.position.z) * 0.02;
        this.camera.position.y += (targetY - this.camera.position.y) * 0.02;
        
        // Tilt based on mouse
        const mx = (window.mouseX || 0) / window.innerWidth - 0.5;
        const my = (window.mouseY || 0) / window.innerHeight - 0.5;
        this.camera.rotation.y = -mx * 0.1;
        this.camera.rotation.x = -my * 0.1;

        // Animate Props
        if(this.symbols) {
            this.symbols.children.forEach((s, i) => {
                s.position.y = 4 + Math.sin(time * 2 + i) * 0.2;
                s.rotation.y += 0.01;
            });
        }

        this.goldLight.position.set(
            Math.sin(time) * 5,
            Math.cos(time * 0.5) * 5,
            this.camera.position.z - 10
        );

        this.renderer.render(this.scene, this.camera);
    }

    createAdinkraSymbol(type) {
        const shape = new THREE.Shape();
        // Simplified procedural shapes for Adinkra
        if(type === 'SANKOFA') {
            // Heart-like spiral
            shape.moveTo(0, 0);
            shape.absarc(0, 0, 1, 0, Math.PI * 2, false);
        } else if(type === 'ANANSE') {
            // Web/Spider
            for(let i=0; i<8; i++) {
                const angle = (i/8) * Math.PI * 2;
                shape.lineTo(Math.cos(angle)*2, Math.sin(angle)*2);
                shape.lineTo(0, 0);
            }
        } else {
            // Default Circle
            shape.absarc(0, 0, 1, 0, Math.PI * 2, false);
        }

        const extrude = new THREE.ExtrudeGeometry(shape, { depth: 0.2, bevelEnabled: true, bevelSize: 0.1 });
        const mat = new THREE.MeshStandardMaterial({ 
            color: 0xd4af37, 
            emissive: 0xd4af37, 
            emissiveIntensity: 0.5,
            metalness: 0.8,
            roughness: 0.2 
        });
        const mesh = new THREE.Mesh(extrude, mat);
        return mesh;
    }

    showSymbolResult(type) {
        if(this.resultSymbol) this.scene.remove(this.resultSymbol);
        this.resultSymbol = this.createAdinkraSymbol(type);
        this.resultSymbol.position.set(0, 2, -130);
        this.resultSymbol.scale.set(0,0,0);
        this.scene.add(this.resultSymbol);
        
        gsap.to(this.resultSymbol.scale, { x: 2, y: 2, z: 2, duration: 1, ease: "back.out(1.7)" });
    }
}

export default InitiationOrbit;
