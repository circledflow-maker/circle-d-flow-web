/**
 * AURA VISUALIZER
 * Purpose: Renders audio-reactive visuals (The Vibe) on the canvas.
 */

class AuraVisualizer {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.animationId = null;
        // Mock Audio Data
        this.dataArray = new Uint8Array(64).map(() => Math.random() * 255); 
        this.init();
    }

    init() {
        this.createCanvas();
        this.animate();
    }

    createCanvas() {
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'aura-canvas';
        this.canvas.style.cssText = `
            position: fixed;
            bottom: 0;
            left: 0;
            width: 100%;
            height: 150px;
            pointer-events: none;
            z-index: 10;
            mix-blend-mode: screen;
            opacity: 0.6;
        `;
        document.body.appendChild(this.canvas);
        this.ctx = this.canvas.getContext('2d');
        
        window.addEventListener('resize', () => this.resize());
        this.resize();
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = 150;
    }

    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Simulate Audio Analysis Update
        this.updateMockData();

        const barWidth = (this.canvas.width / this.dataArray.length) * 2;
        let x = 0;

        for (let i = 0; i < this.dataArray.length; i++) {
            const barHeight = this.dataArray[i] / 2;
            
            // Dynamic Color (Electric Purple to Green)
            const r = 154; // Electric Purple Base
            const g = barHeight + 50;
            const b = 255;
            
            this.ctx.fillStyle = `rgba(${r},${g},${b},0.6)`;
            this.ctx.fillRect(x, this.canvas.height - barHeight, barWidth, barHeight);

            x += barWidth + 1;
        }

        this.animationId = requestAnimationFrame(() => this.animate());
    }

    updateMockData() {
        // Shift data to create "wave" effect
        // Randomize slightly to simulated FFT
        for(let i=0; i<this.dataArray.length; i++) {
             let change = (Math.random() - 0.5) * 50;
             this.dataArray[i] = Math.max(0, Math.min(255, this.dataArray[i] + change));
        }
    }

    stop() {
        cancelAnimationFrame(this.animationId);
        if (this.canvas) this.canvas.remove();
    }
}

// Initialize
if (window.location.href.includes('outbreak_tunes.html')) {
    window.AuraVisualizer = new AuraVisualizer();
}
