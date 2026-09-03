/**
 * Calypso Protocol — vanilla Three.js cup + dice (no React).
 * Mounts into #calypso-canvas. Falls back silently if THREE is missing.
 */
(function (global) {
    const CalypsoScene = {
        renderer: null,
        scene: null,
        camera: null,
        dice: null,
        cup: null,
        raf: null,
        rolling: false,
        result: null,
        clock: 0,
        _last: 0,

        mount(container) {
            if (!global.THREE || !container) return false;
            this.dispose();
            const THREE = global.THREE;
            const w = container.clientWidth || 640;
            const h = container.clientHeight || 480;

            this.scene = new THREE.Scene();
            this.scene.background = new THREE.Color(0x020617);
            this.camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 100);
            this.camera.position.set(0, 4, 8);
            this.camera.lookAt(0, 0.5, 0);

            this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
            this.renderer.setPixelRatio(Math.min(global.devicePixelRatio || 1, 2));
            this.renderer.setSize(w, h);
            this.renderer.shadowMap.enabled = true;
            container.innerHTML = '';
            container.appendChild(this.renderer.domElement);

            this.scene.add(new THREE.AmbientLight(0xffffff, 0.45));
            const spot = new THREE.SpotLight(0xffffff, 1.6, 40, 0.35, 1);
            spot.position.set(5, 10, 5);
            spot.castShadow = true;
            this.scene.add(spot);

            const floor = new THREE.Mesh(
                new THREE.PlaneGeometry(50, 50),
                new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.85, metalness: 0.1 })
            );
            floor.rotation.x = -Math.PI / 2;
            floor.position.y = -0.5;
            floor.receiveShadow = true;
            this.scene.add(floor);

            this.dice = new THREE.Mesh(
                new THREE.BoxGeometry(1, 1, 1),
                new THREE.MeshStandardMaterial({ color: 0x4f46e5, roughness: 0.2, metalness: 0.75 })
            );
            this.dice.castShadow = true;
            this.scene.add(this.dice);

            this.cup = new THREE.Group();
            const wall = new THREE.Mesh(
                new THREE.CylinderGeometry(1.2, 1.2, 2, 32, 1, true),
                new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.9, metalness: 0.1, side: THREE.DoubleSide })
            );
            wall.castShadow = true;
            const lid = new THREE.Mesh(
                new THREE.CylinderGeometry(1.2, 1.2, 0.1, 32),
                new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.9, metalness: 0.1 })
            );
            lid.position.y = 1;
            this.cup.add(wall, lid);
            this.cup.position.y = 3;
            this.scene.add(this.cup);

            this._onResize = () => {
                if (!this.renderer || !container) return;
                const nw = container.clientWidth || 640;
                const nh = container.clientHeight || 480;
                this.camera.aspect = nw / nh;
                this.camera.updateProjectionMatrix();
                this.renderer.setSize(nw, nh);
            };
            global.addEventListener('resize', this._onResize);

            this._last = performance.now();
            const loop = (now) => {
                this.raf = requestAnimationFrame(loop);
                const dt = Math.min(0.05, (now - this._last) / 1000);
                this._last = now;
                this.clock += dt;
                this._tick(dt);
                this.renderer.render(this.scene, this.camera);
            };
            this.raf = requestAnimationFrame(loop);
            return true;
        },

        setRolling(on) {
            this.rolling = !!on;
            if (on) this.result = null;
        },

        setResult(n) {
            this.rolling = false;
            this.result = n;
        },

        _tick(dt) {
            if (!this.dice || !this.cup) return;
            if (this.rolling) {
                this.dice.rotation.x += dt * 10;
                this.dice.rotation.y += dt * 15;
                this.cup.position.y += (0.5 - this.cup.position.y) * 0.08;
                if (this.cup.position.y < 0.7) {
                    this.cup.position.x = Math.sin(this.clock * 40) * 0.1;
                }
            } else {
                this.cup.position.x += (0 - this.cup.position.x) * 0.1;
                this.cup.position.y += (3 - this.cup.position.y) * 0.06;
                if (this.result) {
                    this.dice.rotation.x += (0 - this.dice.rotation.x) * 0.1;
                    this.dice.rotation.y += (0 - this.dice.rotation.y) * 0.1;
                    const s = this.dice.scale.x + (2 - this.dice.scale.x) * 0.05;
                    this.dice.scale.set(s, s, s);
                    this.dice.position.y += (1 - this.dice.position.y) * 0.05;
                } else {
                    this.dice.scale.set(1, 1, 1);
                    this.dice.position.y += (0 - this.dice.position.y) * 0.08;
                }
            }
        },

        dispose() {
            if (this.raf) cancelAnimationFrame(this.raf);
            if (this._onResize) global.removeEventListener('resize', this._onResize);
            if (this.renderer) {
                this.renderer.dispose();
                if (this.renderer.domElement && this.renderer.domElement.parentNode) {
                    this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
                }
            }
            this.renderer = this.scene = this.camera = this.dice = this.cup = this.raf = null;
        }
    };

    global.CalypsoScene = CalypsoScene;
})(window);
