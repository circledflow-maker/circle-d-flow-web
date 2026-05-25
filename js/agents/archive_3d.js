import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.158.0/build/three.module.js';

class ArchiveLibrary {
    constructor() {
        this.container = document.getElementById('archive-container');
        this.volumes = [];
        this.init();
    }

    init() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.container.appendChild(this.renderer.domElement);

        // MISTY CAVE LIGHTING
        const ambient = new THREE.AmbientLight(0x221144, 1);
        this.scene.add(ambient);
        const bluePoint = new THREE.PointLight(0x60a5fa, 2, 50);
        bluePoint.position.set(0, 5, 5);
        this.scene.add(bluePoint);

        this.createMangaTablets();

        this.camera.position.z = 10;
        this.animate();
    }

    createMangaTablets() {
        // v9.7 - Manifesting floating stone tablets for volumes
        const volumeList = ['I', 'II', 'III']; // Roman Progression
        
        volumeList.forEach((num, i) => {
            const group = new THREE.Group();
            
            // The Tablet (Stone appearance)
            const geo = new THREE.BoxGeometry(2, 3, 0.2);
            const mat = new THREE.MeshPhongMaterial({ color: 0x333333, shininess: 5 });
            const tablet = new THREE.Mesh(geo, mat);
            group.add(tablet);

            // Glow Border
            const wireGeo = new THREE.EdgesGeometry(geo);
            const wireMat = new THREE.LineBasicMaterial({ color: 0xd4af37 });
            const line = new THREE.LineSegments(wireGeo, wireMat);
            group.add(line);

            // ROMAN TEXT (Canvas Texture)
            const canvas = document.createElement('canvas');
            canvas.width = 256; canvas.height = 256;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = "#d4af37";
            ctx.font = "bold 120px serif";
            ctx.textAlign = "center";
            ctx.fillText(num, 128, 160);
            
            const tex = new THREE.CanvasTexture(canvas);
            const labelMat = new THREE.MeshBasicMaterial({ map: tex, transparent: true });
            const label = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.5), labelMat);
            label.position.z = 0.15;
            group.add(label);

            group.position.x = (i - 1) * 4;
            group.position.y = Math.sin(i) * 1;
            
            this.volumes.push(group);
            this.scene.add(group);
        });
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        const time = Date.now() * 0.001;

        this.volumes.forEach((v, i) => {
            v.position.y += Math.sin(time + i) * 0.005;
            v.rotation.y = Math.cos(time * 0.5) * 0.1;
        });

        this.renderer.render(this.scene, this.camera);
    }
}

window.Archive = new ArchiveLibrary();
