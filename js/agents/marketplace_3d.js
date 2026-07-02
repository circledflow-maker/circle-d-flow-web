/**
 * Marketplace3D - The Village Engine v4.0
 * Afro-futuristic 'Tata Somba' 3D Environment
 */

window.Marketplace3D = {
    scene: null,
    camera: null,
    renderer: null,
    nodes: [],
    raycaster: new THREE.Raycaster(),
    mouse: new THREE.Vector2(),
    hoveredNode: null,
    isInitialized: false,
    
    // Animation States
    isZooming: false,
    zoomProgress: 0,
    targetNode: null,

    init: function() {
        console.log("[Marketplace3D] V5.0 Fail-Safe Engine Initializing...");
        const canvas = document.getElementById('market-3d-canvas');
        if (!canvas) {
            console.error("[Marketplace3D] ERROR: Canvas 'market-3d-canvas' not found!");
            return;
        }

        try {
            // Scene Setup
            this.scene = new THREE.Scene();
            this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
            this.camera.position.set(0, 5, 20);

            this.renderer = new THREE.WebGLRenderer({ 
                canvas: canvas, 
                alpha: true, 
                antialias: true,
                powerPreference: "high-performance"
            });
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

            // Force Canvas Visibility
            canvas.style.opacity = "1";
            canvas.style.display = "block";

            // Lights
            const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
            this.scene.add(ambientLight);
            const pointLight = new THREE.PointLight(0xffae42, 2, 50);
            pointLight.position.set(0, 10, 10);
            this.scene.add(pointLight);

            // Create Village
            this.createVillage();
            this.createTooltip();

            // Events
            window.addEventListener('mousemove', (e) => this.onMouseMove(e));
            window.addEventListener('click', (e) => this.onClick(e));
            window.addEventListener('resize', () => this.onResize());

            this.isInitialized = true;
            console.log("[Marketplace3D] Village Forge Complete. Nodes:", this.nodes.length);
            this.animate();
        } catch (err) {
            console.error("[Marketplace3D] CRITICAL INITIALIZATION ERROR:", err);
        }
    },

    createVillage: function() {
        const guilds = [
            { name: 'Arts', color: 0xFF00EA, info: 'Royal Gild Stall', target: '/pages/arts_stall.html', x: -15, z: 2 },
            { name: 'Skills', color: 0x00FFD4, info: 'Gild Academy Counter', target: '/pages/skills_stall.html', x: -9, z: 0 },
            { name: 'Sounds', color: 0xFFAE42, info: 'Sound Atelier Desk', target: '/pages/sound_stall.html', x: -3, z: -1 },
            { name: 'Healing', color: 0x00FF00, info: "The Oracle's Altar", target: '/pages/healing_stall.html', x: 3, z: -1 },
            { name: 'Products', color: 0xCD7F32, info: 'Bazaar Artifacts', target: '/pages/product_stall.html', x: 9, z: 0 },
            { name: 'Services', color: 0x5A2A84, info: 'Community Gateway', target: '/pages/services_stall.html', x: 15, z: 2 },
        ];

        guilds.forEach((guild, i) => {
            const group = new THREE.Group();
            
            const baseGeo = new THREE.CylinderGeometry(0.8, 1, 1.5, 8);
            const baseMat = new THREE.MeshLambertMaterial({ color: 0x3E2723 });
            const base = new THREE.Mesh(baseGeo, baseMat);
            group.add(base);
            
            const roofGeo = new THREE.ConeGeometry(1.2, 1.2, 8);
            const roofMat = new THREE.MeshLambertMaterial({ color: 0x5D4037 });
            const roof = new THREE.Mesh(roofGeo, roofMat);
            roof.position.y = 1.2;
            group.add(roof);

            const emblemGeo = new THREE.SphereGeometry(0.3, 16, 16);
            const emblemMat = new THREE.MeshBasicMaterial({ color: guild.color });
            const emblem = new THREE.Mesh(emblemGeo, emblemMat);
            emblem.position.y = 2;
            group.add(emblem);

            group.position.set(guild.x, 0, guild.z);
            group.userData = { guild: guild.name, info: guild.info, target: guild.target, bobOffset: i * 0.7 };
            
            this.scene.add(group);
            this.nodes.push(group);
        });

        this.camera.position.set(0, 8, 22);
        this.camera.lookAt(0, 1, 0);
    },

    createTooltip: function() {
        const tip = document.createElement('div');
        tip.id = 'market-3d-tooltip';
        tip.style.cssText = `
            position: fixed; display: none; pointer-events: none;
            background: rgba(18, 8, 24, 0.9); border: 1px solid #FFAE42;
            color: #FFAE42; padding: 10px 15px; font-family: 'Outfit', sans-serif;
            font-size: 10px; border-radius: 4px; z-index: 1000;
            box-shadow: 0 0 15px rgba(255, 174, 66, 0.3);
            text-transform: uppercase; letter-spacing: 2px;
        `;
        document.body.appendChild(tip);
    },

    animate: function() {
        if(!this.isInitialized) return;
        requestAnimationFrame(() => this.animate());
        
        // Static huts — gentle bob only (no orbital rotation)
        if (!this.isZooming) {
            const t = Date.now() * 0.001;
            this.nodes.forEach((node) => {
                const off = node.userData.bobOffset || 0;
                node.position.y = Math.sin(t + off) * 0.06;
            });
        } else {
            // ZOOM ANIMATION LOGIC
            this.zoomProgress += 0.02;
            if (this.zoomProgress <= 1.0) {
                const targetPos = this.targetNode.position.clone();
                targetPos.y += 1.5; // Move towards emblem
                this.camera.position.lerp(targetPos, 0.05);
                this.camera.lookAt(this.targetNode.position);
                
                // Fade out effect
                const canvas = document.getElementById('market-3d-canvas');
                if(canvas) canvas.style.opacity = 1 - this.zoomProgress;
            } else {
                this.isZooming = false;
                this.executeNavigation();
            }
        }

        // Raycasting for Hover
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.nodes, true);

        const tooltip = document.getElementById('market-3d-tooltip');
        if (intersects.length > 0 && !this.isZooming) {
            let target = intersects[0].object;
            while(target.parent && !target.userData.guild) target = target.parent;

            if (target.userData.guild) {
                this.hoveredNode = target;
                if(tooltip) {
                    tooltip.style.display = 'block';
                    tooltip.style.left = (this.mouse.x * 0.5 + 0.5) * window.innerWidth + 20 + 'px';
                    tooltip.style.top = (-(this.mouse.y * 0.5 - 0.5) * window.innerHeight) - 40 + 'px';
                    
                    const dest = target.userData.target === 'filter' ? 'Live Filter' : target.userData.target;
                    tooltip.innerHTML = `
                        <div style="border-bottom:1px solid #FFAE42;margin-bottom:5px;padding-bottom:2px">
                            <strong style="color:#FFAE42">${target.userData.guild}</strong>
                        </div>
                        <div style="color:white;font-size:8px;opacity:0.8">Sector: ${target.userData.info}</div>
                        <div style="color:#00FFD4;font-size:7px;margin-top:3px">➔ Navigate to: ${dest}</div>
                    `;
                }
                target.scale.set(1.3, 1.3, 1.3);
            }
        } else {
            if (this.hoveredNode) {
                this.hoveredNode.scale.set(1, 1, 1);
                this.hoveredNode = null;
            }
            if(tooltip) tooltip.style.display = 'none';
        }

        if(this.renderer) this.renderer.render(this.scene, this.camera);
    },

    onMouseMove: function(event) {
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    },

    onClick: function(event) {
        if(this.isZooming) return;

        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.nodes, true);

        if (intersects.length > 0) {
            let target = intersects[0].object;
            while(target.parent && !target.userData.guild) target = target.parent;

            if(target.userData.guild) {
                console.log("[Marketplace3D] Commencing Entrance to:", target.userData.guild);
                this.isZooming = true;
                this.zoomProgress = 0;
                this.targetNode = target;
                
                if(window.SoundEngineer) window.SoundEngineer.playSFX('ui_click_hover');
            }
        }
    },

    executeNavigation: function() {
        if(!this.targetNode) return;
        const destination = this.targetNode.userData.target;
        const guild = this.targetNode.userData.guild;

        if (destination === 'filter') {
            if(window.filterMarket) window.filterMarket(guild);
            
            // Smoothly bring back the canvas after a delay
            setTimeout(() => {
                const canvas = document.getElementById('market-3d-canvas');
                if(canvas) canvas.style.opacity = 1;
                this.camera.position.set(0, 5, 20);
                this.camera.lookAt(0, 0, 0);
                this.targetNode = null;
            }, 800);
        } else {
            console.log("[Marketplace3D] Navigating to:", destination);
            window.location.href = destination;
        }
    },

    onResize: function() {
        if(!this.camera || !this.renderer) return;
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
};
