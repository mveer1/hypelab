// src/quantum/waveFunction.js
class WaveFunction {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;

        // Simulation parameters
        this.amplitude = 1.0;
        this.wavelength = 100;
        this.frequency = 1.0;
        this.time = 0;

        // UI controls
        this.parameters = [
            { id: 'amp', name: 'Amplitude', min: 0.1, max: 2, step: 0.1, value: 1.0,
                onChange: (value) => {
                    this.totalPendulums = value;
                    this.reset()}},
            { id: 'wave', name: 'Wavelength', min: 50, max: 200, step: 10, value: 100,
                onChange: (value) => {
                    this.totalPendulums = value;
                    this.reset()}},
            { id: 'freq', name: 'Frequency', min: 0.5, max: 5, step: 0.1, value: 1.0,
                onChange: (value) => {
                    this.totalPendulums = value;
                    this.reset()}}
        ];

        // Formulas
        this.formulas = [
            { title: "Wave Function", equation: "Ψ(x,t) = Asin(kx - ωt)" },
            { title: "Wave Number", equation: "k = 2π/λ" }
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
        
        ctx.beginPath();
        ctx.strokeStyle = '#4ae2a3';
        ctx.lineWidth = 2;
        
        const k = (2 * Math.PI) / this.wavelength;
        const ω = 2 * Math.PI * this.frequency;
        
        for(let x = 0; x < this.canvas.width; x++) {
            const y = this.baseY + this.amplitude * 50 * Math.sin(k * x - ω * this.time);
            ctx.lineTo(x, y);
        }
        
        ctx.stroke();
    }

    onResize(width, height) {
        this.baseY = height/2;
    }

    reset() {
        this.time = 0;
    }
}
