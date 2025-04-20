// src/quantum/particleInBox.js
class ParticleInBox {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
 
        // Simulation parameters
        this.n = 1;
        this.boxWidth = 300;
        this.time = 0;

        // UI controls
        this.parameters = [
            { id: 'n', name: 'Quantum Number', min: 1, max: 5, step: 1, value: 1,
                onChange: (value) => {
                    this.totalPendulums = value;
                    this.reset()}},
            { id: 'width', name: 'Box Width', min: 200, max: 600, step: 50, value: 300,
                onChange: (value) => {
                    this.totalPendulums = value;
                    this.reset()}}
        ];

        // Formulas
        this.formulas = [
            { title: "Wave Function", equation: "Ψₙ(x) = √(2/L)sin(nπx/L)" },
            { title: "Energy Levels", equation: "Eₙ = (n²h²)/(8mL²)" }
        ];

        this.onResize(canvas.width, canvas.height);
    }

    update(dt) {
        this.time += dt;
        this.draw();
    }

    draw() {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw box
        ctx.strokeStyle = '#4a90e2';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.boxX, this.boxY, this.boxWidth, 100);
        
        // Draw probability density
        ctx.fillStyle = 'rgba(228, 76, 76, 0.2)';
        const L = this.boxWidth;
        for(let x = 0; x < L; x++) {
            const psi = Math.sqrt(2/L) * Math.sin(this.n * Math.PI * x/L);
            const height = psi ** 2 * 100;
            ctx.fillRect(this.boxX + x, this.boxY + 100 - height, 1, height);
        }
    }

    onResize(width, height) {
        this.boxX = (width - this.boxWidth)/2;
        this.boxY = (height - 150)/2;
    }

    reset() {
        this.time = 0;
    }
}
