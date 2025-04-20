// src/core/harmonicOscillator.js
class HarmonicOscillator {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;

        // Physics parameters
        this.mass = 1.0;
        this.springConstant = 10.0;
        this.damping = 0.05;
        this.position = 100;
        this.velocity = 0;
        this.equilibriumX = 0;

        // UI parameters
        this.parameters = [
            { id: 'mass', name: 'Mass (kg)', min: 0.1, max: 5, step: 0.1, value: 1.0, 
                onChange: (value) => {
                this.totalPendulums = value;
                this.reset()}},
            { id: 'spring', name: 'Spring Constant', min: 1, max: 50, step: 1, value: 10.0,
                onChange: (value) => {
                    this.totalPendulums = value;
                    this.reset()}},
            { id: 'damping', name: 'Damping', min: 0, max: 0.5, step: 0.01, value: 0.05,
                onChange: (value) => {
                    this.totalPendulums = value;
                    this.reset()}}
        ];

        // Values display
        this.values = [
            { id: 'kinetic', name: 'Kinetic Energy', value: 0, precision: 2 },
            { id: 'potential', name: 'Potential Energy', value: 0, precision: 2 }
        ];

        // Formulas
        this.formulas = [
            { title: "Hooke's Law", equation: "F = -kx" },
            { title: "Energy Conservation", equation: "E = ½kx² + ½mv²" }
        ];

        this.onResize(canvas.width, canvas.height);
    }

    onResize(width, height) {
        this.equilibriumX = width/2 - 100;
        this.baseY = height/2;
    }

    update(dt) {
        // Physics calculations
        const force = -this.springConstant * this.position - this.damping * this.velocity;
        const acceleration = force / this.mass;
        this.velocity += acceleration * dt;
        this.position += this.velocity * dt;

        // Update values
        this.values[0].value = 0.5 * this.mass * this.velocity ** 2;
        this.values[1].value = 0.5 * this.springConstant * this.position ** 2;
        
        this.draw();
    }

    draw() {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw spring
        ctx.beginPath();
        ctx.moveTo(this.equilibriumX - 150, this.baseY);
        ctx.lineTo(this.equilibriumX + this.position, this.baseY);
        ctx.strokeStyle = '#4a90e2';
        ctx.lineWidth = 4;
        ctx.stroke();

        // Draw mass
        ctx.beginPath();
        ctx.arc(this.equilibriumX + this.position, this.baseY, 20, 0, Math.PI*2);
        ctx.fillStyle = '#e24a4a';
        ctx.fill();
    }

    reset() {
        this.position = 100;
        this.velocity = 0;
    }
}
