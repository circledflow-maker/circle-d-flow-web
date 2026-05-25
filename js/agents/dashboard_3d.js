/**
 * Agent: Dashboard 3D Background (Community Web)
 * Purpose: Renders a cinematic 3D connection web honoring the narrative of community building.
 */

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('bg-canvas');
    if (!canvas || !window.THREE) return;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0a0a0a, 0.002);

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 2000);
    camera.position.z = 400;

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);

    // Particles Data
    const particlesData = [];
    const maxParticleCount = 150;
    const r = 800; // Radius

    // Geometry & Materials
    const pMaterial = new THREE.PointsMaterial({
        color: 0xd4af37,
        size: 3,
        blending: THREE.AdditiveBlending,
        transparent: true,
        sizeAttenuation: false
    });

    const particles = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(maxParticleCount * 3);

    for (let i = 0; i < maxParticleCount; i++) {
        const x = Math.random() * r - r / 2;
        const y = Math.random() * r - r / 2;
        const z = Math.random() * r - r / 2;

        particlePositions[i * 3]     = x;
        particlePositions[i * 3 + 1] = y;
        particlePositions[i * 3 + 2] = z;

        particlesData.push({
            velocity: new THREE.Vector3(-1 + Math.random() * 2, -1 + Math.random() * 2, -1 + Math.random() * 2),
            numConnections: 0
        });
    }

    particles.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const pointCloud = new THREE.Points(particles, pMaterial);
    scene.add(pointCloud);

    // Lines for Connections
    const linesGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array((maxParticleCount * maxParticleCount) * 3);
    const colors = new Float32Array((maxParticleCount * maxParticleCount) * 3);
    
    linesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3).setUsage(THREE.DynamicDrawUsage));
    linesGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3).setUsage(THREE.DynamicDrawUsage));
    linesGeometry.computeBoundingSphere();
    linesGeometry.setDrawRange(0, 0);

    const material = new THREE.LineBasicMaterial({
        vertexColors: true,
        blending: THREE.AdditiveBlending,
        transparent: true,
        opacity: 0.15
    });

    const linesMesh = new THREE.LineSegments(linesGeometry, material);
    scene.add(linesMesh);

    // Animation Loop
    const effectController = {
        showDots: true,
        showLines: true,
        minDistance: 120,
        limitConnections: false,
        maxConnections: 20
    };

    function render() {
        let vertexpos = 0;
        let colorpos = 0;
        let numConnected = 0;

        for (let i = 0; i < maxParticleCount; i++) particlesData[i].numConnections = 0;

        for (let i = 0; i < maxParticleCount; i++) {
            const particleData = particlesData[i];

            particlePositions[i * 3]     += particleData.velocity.x * 0.2;
            particlePositions[i * 3 + 1] += particleData.velocity.y * 0.2;
            particlePositions[i * 3 + 2] += particleData.velocity.z * 0.2;

            if (particlePositions[i * 3 + 1] < -r / 2 || particlePositions[i * 3 + 1] > r / 2) particleData.velocity.y = -particleData.velocity.y;
            if (particlePositions[i * 3] < -r / 2 || particlePositions[i * 3] > r / 2) particleData.velocity.x = -particleData.velocity.x;
            if (particlePositions[i * 3 + 2] < -r / 2 || particlePositions[i * 3 + 2] > r / 2) particleData.velocity.z = -particleData.velocity.z;

            // Check Connections
            for (let j = i + 1; j < maxParticleCount; j++) {
                const particleDataB = particlesData[j];
                const dx = particlePositions[i * 3]     - particlePositions[j * 3];
                const dy = particlePositions[i * 3 + 1] - particlePositions[j * 3 + 1];
                const dz = particlePositions[i * 3 + 2] - particlePositions[j * 3 + 2];
                const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

                if (dist < effectController.minDistance) {
                    particleData.numConnections++;
                    particleDataB.numConnections++;

                    const alpha = 1.0 - dist / effectController.minDistance;

                    positions[vertexpos++] = particlePositions[i * 3];
                    positions[vertexpos++] = particlePositions[i * 3 + 1];
                    positions[vertexpos++] = particlePositions[i * 3 + 2];

                    positions[vertexpos++] = particlePositions[j * 3];
                    positions[vertexpos++] = particlePositions[j * 3 + 1];
                    positions[vertexpos++] = particlePositions[j * 3 + 2];

                    colors[colorpos++] = 0.8;
                    colors[colorpos++] = 0.6;
                    colors[colorpos++] = 0.2;

                    colors[colorpos++] = 0.8;
                    colors[colorpos++] = 0.6;
                    colors[colorpos++] = 0.2;

                    numConnected++;
                }
            }
        }

        linesMesh.geometry.setDrawRange(0, numConnected * 2);
        linesMesh.geometry.attributes.position.needsUpdate = true;
        linesMesh.geometry.attributes.color.needsUpdate = true;
        pointCloud.geometry.attributes.position.needsUpdate = true;
    }

    function animate() {
        requestAnimationFrame(animate);
        
        // Gentle rotation
        scene.rotation.y += 0.001;
        scene.rotation.x += 0.0005;

        render();
        renderer.render(scene, camera);
    }

    animate();

    // Mouse Parallax Interaction
    window.addEventListener('mousemove', (e) => {
        const mouseX = (e.clientX / window.innerWidth) * 2 - 1;
        const mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
        
        camera.position.x += (mouseX * 50 - camera.position.x) * 0.05;
        camera.position.y += (mouseY * 50 - camera.position.y) * 0.05;
        camera.lookAt(scene.position);
    });

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
});
