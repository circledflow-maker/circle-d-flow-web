/**
 * Agent: Dashboard 3D Background (Community Web)
 * Purpose: Renders a cinematic 3D connection web honoring the narrative of community building.
 * Mobile: skipped by default to save CPU and network on narrow viewports.
 */

(function initDashboard3D() {
    const MOBILE_MAX = 768;
    const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function shouldRun() {
        if (REDUCED_MOTION) return false;
        if (window.innerWidth < MOBILE_MAX) return false;
        if (window.matchMedia('(hover: none) and (pointer: coarse)').matches) return false;
        return true;
    }

    function waitForThree(maxMs) {
        return new Promise((resolve) => {
            if (window.THREE) {
                resolve(true);
                return;
            }
            const started = Date.now();
            const tick = () => {
                if (window.THREE) {
                    resolve(true);
                    return;
                }
                if (Date.now() - started > maxMs) {
                    resolve(false);
                    return;
                }
                requestAnimationFrame(tick);
            };
            tick();
        });
    }

    async function boot() {
        if (!shouldRun()) {
            const canvas = document.getElementById('bg-canvas');
            if (canvas) canvas.style.display = 'none';
            return;
        }

        const ready = await waitForThree(8000);
        if (!ready) return;

        const canvas = document.getElementById('bg-canvas');
        if (!canvas || !window.THREE) return;

        let renderer;
        try {
            renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false, powerPreference: 'high-performance' });
            const gl = renderer.getContext();
            if (!gl) throw new Error('WebGL context unavailable');
        } catch (err) {
            console.warn('[Dashboard3D] WebGL unavailable — using static backdrop.', err);
            canvas.style.display = 'none';
            return;
        }

        const scene = new THREE.Scene();
        scene.fog = new THREE.FogExp2(0x0a0a0a, 0.002);

        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 2000);
        camera.position.z = 400;

        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
        renderer.setSize(window.innerWidth, window.innerHeight);

        const particlesData = [];
        const maxParticleCount = 80;
        const r = 800;

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

            particlePositions[i * 3] = x;
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

        const effectController = {
            minDistance: 120
        };

        let running = true;
        document.addEventListener('visibilitychange', () => {
            running = document.visibilityState === 'visible';
        });

        function render() {
            let vertexpos = 0;
            let colorpos = 0;
            let numConnected = 0;

            for (let i = 0; i < maxParticleCount; i++) particlesData[i].numConnections = 0;

            for (let i = 0; i < maxParticleCount; i++) {
                const particleData = particlesData[i];

                particlePositions[i * 3] += particleData.velocity.x * 0.2;
                particlePositions[i * 3 + 1] += particleData.velocity.y * 0.2;
                particlePositions[i * 3 + 2] += particleData.velocity.z * 0.2;

                if (particlePositions[i * 3 + 1] < -r / 2 || particlePositions[i * 3 + 1] > r / 2) particleData.velocity.y = -particleData.velocity.y;
                if (particlePositions[i * 3] < -r / 2 || particlePositions[i * 3] > r / 2) particleData.velocity.x = -particleData.velocity.x;
                if (particlePositions[i * 3 + 2] < -r / 2 || particlePositions[i * 3 + 2] > r / 2) particleData.velocity.z = -particleData.velocity.z;

                for (let j = i + 1; j < maxParticleCount; j++) {
                    const dx = particlePositions[i * 3] - particlePositions[j * 3];
                    const dy = particlePositions[i * 3 + 1] - particlePositions[j * 3 + 1];
                    const dz = particlePositions[i * 3 + 2] - particlePositions[j * 3 + 2];
                    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

                    if (dist < effectController.minDistance) {
                        particleData.numConnections++;
                        particlesData[j].numConnections++;

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
            if (!running) return;

            scene.rotation.y += 0.001;
            scene.rotation.x += 0.0005;
            render();
            renderer.render(scene, camera);
        }

        animate();

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
    }

    function schedule() {
        const start = () => boot();
        if ('requestIdleCallback' in window) {
            requestIdleCallback(start, { timeout: 2500 });
        } else {
            setTimeout(start, 1200);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', schedule);
    } else {
        schedule();
    }
})();
