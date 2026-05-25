import * as THREE from 'three';

class DMap3D {
    constructor() {
        this.container = document.getElementById('dmap-3d-container');
        if (!this.container) return;
        
        this.mouse = new THREE.Vector2();
        this.raycaster = new THREE.Raycaster();
        this.hoveredNode = null;
        this.nodes = [];
        this.time = 0;
        
        this.init();
    }

    init() {
        // Scene setup
        this.scene = new THREE.Scene();
        // Set background to a warm deep brown/black
        this.scene.background = new THREE.Color(0x1a1005);
        this.scene.fog = new THREE.FogExp2(0x1a1005, 0.05);

        // Camera
        this.camera = new THREE.PerspectiveCamera(60, this.container.clientWidth / this.container.clientHeight, 0.1, 1000);
        this.camera.position.set(0, 5, 12);
        this.camera.lookAt(0, 0, 0);

        // Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.container.appendChild(this.renderer.domElement);

        // Lighting
        const ambient = new THREE.AmbientLight(0x4a2a14, 1.5); // Warm ambient
        this.scene.add(ambient);

        const goldPoint = new THREE.PointLight(0xd4af37, 2, 50);
        goldPoint.position.set(0, 10, 0);
        this.scene.add(goldPoint);

        const purplePoint = new THREE.PointLight(0x8A2BE2, 1.5, 50);
        purplePoint.position.set(-5, -5, 5);
        this.scene.add(purplePoint);

        // Base Ring (The Flow Grid)
        const ringGeo = new THREE.TorusGeometry(8, 0.02, 16, 100);
        const ringMat = new THREE.MeshBasicMaterial({ color: 0xd4af37, transparent: true, opacity: 0.2 });
        this.baseRing = new THREE.Mesh(ringGeo, ringMat);
        this.baseRing.rotation.x = Math.PI / 2;
        this.scene.add(this.baseRing);

        // Inner Ring
        const ringGeo2 = new THREE.TorusGeometry(5, 0.05, 16, 100);
        const ringMat2 = new THREE.MeshBasicMaterial({ color: 0x8A2BE2, transparent: true, opacity: 0.1 });
        this.innerRing = new THREE.Mesh(ringGeo2, ringMat2);
        this.innerRing.rotation.x = Math.PI / 2;
        this.scene.add(this.innerRing);

        this.createNodes();
        this.createDustParticles();

        // Event Listeners
        window.addEventListener('resize', () => this.onResize());
        this.container.addEventListener('mousemove', (e) => this.onMouseMove(e));
        this.container.addEventListener('click', (e) => this.onClick(e));
        // Also listen on touch for mobile
        this.container.addEventListener('touchstart', (e) => {
            if (e.touches.length > 0) {
                this.updateMousePos(e.touches[0].clientX, e.touches[0].clientY);
                this.onClick(e.touches[0]);
            }
        });

        this.animate();
        console.log("🌍 [D Map 3D] Oracle Awakening Complete.");
    }

    createNodes() {
        const nodeData = [
            { id: 'colosseum', name: 'The Colosseum', color: 0xd4af37, pos: [0, 1, 0], url: 'pages/colosseum.html', shape: 'Octahedron' },
            { id: 'arena', name: 'Arena', color: 0xff3333, pos: [-6, 0.5, -4], url: 'pages/arena.html', shape: 'Icosahedron' },
            { id: 'hall_of_legends', name: 'Hall of Legends', color: 0x8A2BE2, pos: [6, 0.5, -4], url: 'pages/hall_of_legends.html', shape: 'Icosahedron' }
        ];

        nodeData.forEach((data, index) => {
            const group = new THREE.Group();
            group.position.set(...data.pos);
            group.userData = { id: data.id, url: data.url, name: data.name, basePos: new THREE.Vector3(...data.pos), index: index };

            // Core Crystal
            let geo;
            if (data.shape === 'Octahedron') {
                geo = new THREE.OctahedronGeometry(1.2, 0);
            } else {
                geo = new THREE.IcosahedronGeometry(0.8, 0);
            }

            const mat = new THREE.MeshPhongMaterial({
                color: data.color,
                emissive: data.color,
                emissiveIntensity: 0.4,
                transparent: true,
                opacity: 0.9,
                shininess: 100,
                wireframe: false
            });
            const mesh = new THREE.Mesh(geo, mat);
            group.add(mesh);

            // Wireframe Aura
            const wireGeo = new THREE.EdgesGeometry(geo);
            const wireMat = new THREE.LineBasicMaterial({ color: data.color, transparent: true, opacity: 0.5 });
            const wireMesh = new THREE.LineSegments(wireGeo, wireMat);
            wireMesh.scale.set(1.2, 1.2, 1.2);
            group.add(wireMesh);

            // Point Light
            const light = new THREE.PointLight(data.color, 1, 5);
            group.add(light);

            this.scene.add(group);
            this.nodes.push(group);
        });
    }

    createDustParticles() {
        const partGeo = new THREE.BufferGeometry();
        const partCount = 300;
        const posArray = new Float32Array(partCount * 3);
        
        for (let i = 0; i < partCount * 3; i++) {
            posArray[i] = (Math.random() - 0.5) * 30; // Spread wide
        }
        
        partGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
        const partMat = new THREE.PointsMaterial({
            color: 0xd4af37,
            size: 0.1,
            transparent: true,
            opacity: 0.5,
            blending: THREE.AdditiveBlending
        });
        
        this.particles = new THREE.Points(partGeo, partMat);
        this.scene.add(this.particles);
    }

    updateMousePos(clientX, clientY) {
        const rect = this.container.getBoundingClientRect();
        this.mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    }

    onMouseMove(e) {
        this.updateMousePos(e.clientX, e.clientY);
    }

    onClick(e) {
        this.raycaster.setFromCamera(this.mouse, this.camera);
        // Intersect against all children of node groups
        const intersectObjects = this.nodes.map(n => n.children[0]); 
        const intersects = this.raycaster.intersectObjects(intersectObjects);

        if (intersects.length > 0) {
            let targetGroup = intersects[0].object.parent;
            if (targetGroup.userData.url) {
                // Play sound if available
                if (window.SoundEngineer) window.SoundEngineer.playSFX('ui_hover');
                
                // Add a small visual explosion effect or just redirect
                document.body.style.opacity = '0';
                document.body.style.transition = 'opacity 0.5s';
                
                setTimeout(() => {
                    window.location.href = targetGroup.userData.url;
                }, 500);
            }
        }
    }

    onResize() {
        if (!this.container) return;
        this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        this.time += 0.01;

        // Rotate Rings
        if (this.baseRing) this.baseRing.rotation.z -= 0.001;
        if (this.innerRing) this.innerRing.rotation.z += 0.002;

        // Animate Dust
        if (this.particles) {
            this.particles.rotation.y += 0.001;
            this.particles.position.y += Math.sin(this.time) * 0.002;
        }

        // Animate Camera slowly drifting
        this.camera.position.x = Math.sin(this.time * 0.2) * 2;
        this.camera.position.z = 12 + Math.cos(this.time * 0.1) * 1;
        this.camera.lookAt(0, 0, 0);

        // Raycast for hover effects
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersectObjects = this.nodes.map(n => n.children[0]);
        const intersects = this.raycaster.intersectObjects(intersectObjects);

        let currentHover = null;
        if (intersects.length > 0) {
            currentHover = intersects[0].object.parent.userData.id;
            document.body.style.cursor = 'pointer';
        } else {
            document.body.style.cursor = 'default';
        }

        // Animate Nodes
        this.nodes.forEach(node => {
            const data = node.userData;
            
            // Floating bounce
            node.position.y = data.basePos.y + Math.sin(this.time * 2 + data.index) * 0.3;
            
            // Rotation
            node.children[0].rotation.y += 0.01; // Mesh
            node.children[1].rotation.x -= 0.02; // Wireframe Aura
            node.children[1].rotation.y += 0.015;

            // Hover effect
            if (currentHover === data.id) {
                node.scale.lerp(new THREE.Vector3(1.3, 1.3, 1.3), 0.1);
                node.children[1].material.opacity = 1.0;
            } else {
                node.scale.lerp(new THREE.Vector3(1.0, 1.0, 1.0), 0.1);
                node.children[1].material.opacity = 0.5;
            }
        });

        this.renderer.render(this.scene, this.camera);
    }
}

// Auto Initialize
window.addEventListener('DOMContentLoaded', () => {
    window.DMapEngine = new DMap3D();
});
