// src/core/harmonicOscillator.js
class HarmonicOscillator {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;

        // Physics parameters
        this.mass = 1.0; // kg
        this.springConstant = 10.0; // N/m
        this.damping = 0.05; // damping coefficient c
        this.gravity = 9.81; // m/s^2
        this.position = 0; // displacement x (m)
        this.velocity = 0; // velocity dx/dt (m/s)
        this.acceleration = 0; // acceleration d2x/dt2 (m/s^2)

        // Driving force parameters
        this.driveAmplitude = 0; // amplitude of driving force (N)
        this.driveFrequency = 0; // frequency of driving force (Hz)
        this.driveAngularFrequency = 0; // omega = 2*pi*f

        // Initial conditions
        this.initialPosition = 1.0; // start with some displacement
        this.initialVelocity = 0;

        // Time tracking
        this.time = 0;

        // For dragging interaction
        this.isDragging = false;
        this.dragStartX = 0;
        this.dragStartPos = 0;

        // Parameters for UI controls
        this.parameters = [
            {
                id: 'mass',
                name: 'Mass (kg)',
                min: 0.1,
                max: 10,
                step: 0.1,
                value: this.mass,
                onChange: (value) => {
                    this.mass = value;
                    this.calculateNaturalFrequency();
                }
            },
            {
                id: 'springConstant',
                name: 'Spring Constant (N/m)',
                min: 0.1,
                max: 50,
                step: 0.1,
                value: this.springConstant,
                onChange: (value) => {
                    this.springConstant = value;
                    this.calculateNaturalFrequency();
                }
            },
            {
                id: 'damping',
                name: 'Damping Coefficient',
                min: 0,
                max: 2,
                step: 0.01,
                value: this.damping,
                onChange: (value) => {
                    this.damping = value;
                    this.calculateDampingRatio();
                }
            },
            {
                id: 'initialPosition',
                name: 'Initial Displacement (m)',
                min: -3,
                max: 3,
                step: 0.1,
                value: this.initialPosition,
                onChange: (value) => {
                    this.initialPosition = value;
                    this.reset();
                }
            },
            {
                id: 'initialVelocity',
                name: 'Initial Velocity (m/s)',
                min: -5,
                max: 5,
                step: 0.1,
                value: this.initialVelocity,
                onChange: (value) => {
                    this.initialVelocity = value;
                    this.reset();
                }
            },
            {
                id: 'driveAmplitude',
                name: 'Drive Amplitude (N)',
                min: 0,
                max: 10,
                step: 0.1,
                value: this.driveAmplitude,
                onChange: (value) => {
                    this.driveAmplitude = value;
                }
            },
            {
                id: 'driveFrequency',
                name: 'Drive Frequency (Hz)',
                min: 0,
                max: 5,
                step: 0.05,
                value: this.driveFrequency,
                onChange: (value) => {
                    this.driveFrequency = value;
                    this.driveAngularFrequency = 2 * Math.PI * value;
                }
            },
            {
                id: 'reset',
                name: 'Reset',
                type: 'button',
                onClick: () => {
                    this.reset();
                    return 'Reset';
                }
            }
        ];

        // Values for display
        this.values = [
            { id: 'position', name: 'Position (m)', value: 0, precision: 3 },
            { id: 'velocity', name: 'Velocity (m/s)', value: 0, precision: 3 },
            { id: 'acceleration', name: 'Acceleration (m/s²)', value: 0, precision: 3 },
            { id: 'period', name: 'Period (s)', value: 0, precision: 3 },
            { id: 'frequency', name: 'Natural Frequency (Hz)', value: 0, precision: 3 },
            { id: 'dampingRatio', name: 'Damping Ratio', value: 0, precision: 3 },
            // { id: 'dampingType', name: 'Damping Type', value: 'Underdamped', precision: 0 },
            { id: 'kineticEnergy', name: 'Kinetic Energy (J)', value: 0, precision: 3 },
            { id: 'potentialEnergy', name: 'Potential Energy (J)', value: 0, precision: 3 },
            { id: 'totalEnergy', name: 'Total Energy (J)', value: 0, precision: 3 }
        ];

        // Formulas
        this.formulas = [
            {
                title: 'Equation of Motion',
                description: 'The differential equation governing the motion of a damped, driven harmonic oscillator',
                equation: 'm\u00B7d²x/dt² + c\u00B7dx/dt + kx = F₀cos(ωt)'
            },
            {
                title: 'Natural Frequency',
                description: 'The frequency at which the system naturally oscillates without damping',
                equation: 'ω₀ = √(k/m)'
            },
            {
                title: 'Period',
                description: 'The time taken for one complete oscillation',
                equation: 'T = 2π/ω₀ = 2π√(m/k)'
            },
            {
                title: 'Damping Ratio',
                description: 'Determines the type of damping in the system',
                equation: 'ζ = c/(2√(km))'
            },
            {
                title: 'Damping Types',
                description: 'Classification based on damping ratio',
                equation: 'ζ < 1: Underdamped, ζ = 1: Critically damped, ζ > 1: Overdamped'
            }
        ];

        // Canvas dimensions and scaling
        this.originX = 150; // x position of spring anchor
        this.originY = canvas.height / 2;
        this.pixelsPerMeter = 100; // scale for drawing

        // Data for graphs
        this.timeData = [];
        this.positionData = [];
        this.velocityData = [];
        this.kineticEnergyData = [];
        this.potentialEnergyData = [];
        this.totalEnergyData = [];
        this.phaseData = [];
        this.maxDataPoints = 300;

        // Initialize
        this.calculateNaturalFrequency();
        this.calculateDampingRatio();
        this.reset();

        // Bind event handlers for dragging
        this.canvas.addEventListener('mousedown', this.onMouseDown.bind(this));
        this.canvas.addEventListener('mousemove', this.onMouseMove.bind(this));
        this.canvas.addEventListener('mouseup', this.onMouseUp.bind(this));
        this.canvas.addEventListener('mouseleave', this.onMouseUp.bind(this));

        // Initialize energy chart
        this.initEnergyChart();
    }

    calculateNaturalFrequency() {
        this.naturalAngularFrequency = Math.sqrt(this.springConstant / this.mass);
        this.period = 2 * Math.PI / this.naturalAngularFrequency;
        this.naturalFrequency = 1 / this.period;
        
        // Update values
        this.values.find(v => v.id === 'period').value = this.period;
        this.values.find(v => v.id === 'frequency').value = this.naturalFrequency;
        
        // Recalculate damping ratio as it depends on natural frequency
        this.calculateDampingRatio();
    }

    calculateDampingRatio() {
        this.dampingRatio = this.damping / (2 * Math.sqrt(this.mass * this.springConstant));
        this.values.find(v => v.id === 'dampingRatio').value = this.dampingRatio;
        
    //     // Determine damping type
    //     let dampingType;
    //     if (this.dampingRatio < 0.98) {
    //         dampingType = 'Underdamped';
    //     } else if (this.dampingRatio > 1.02) {
    //         dampingType = 'Overdamped';
    //     } else {
    //         dampingType = 'Critically Damped';
    //     }
    //     // this.values.find(v => v.id === 'dampingType').value = dampingType;
    }

    reset() {
        this.time = 0;
        this.position = this.initialPosition;
        this.velocity = this.initialVelocity;
        this.acceleration = 0;

        // Clear graph data
        this.timeData = [];
        this.positionData = [];
        this.velocityData = [];
        this.kineticEnergyData = [];
        this.potentialEnergyData = [];
        this.totalEnergyData = [];
        this.phaseData = [];

        // Update values
        this.updateValues();
    }

    updateValues() {
        // Update position, velocity, acceleration
        this.values.find(v => v.id === 'position').value = this.position;
        this.values.find(v => v.id === 'velocity').value = this.velocity;
        this.values.find(v => v.id === 'acceleration').value = this.acceleration;

        // Calculate energies
        const kinetic = 0.5 * this.mass * this.velocity * this.velocity;
        const potential = 0.5 * this.springConstant * this.position * this.position;
        const total = kinetic + potential;
        
        // Update energy values
        this.values.find(v => v.id === 'kineticEnergy').value = kinetic;
        this.values.find(v => v.id === 'potentialEnergy').value = potential;
        this.values.find(v => v.id === 'totalEnergy').value = total;
    }

    onResize(width, height) {
        this.originY = height / 2;
    }

    update(dt) {
        // If dragging, don't update physics
        if (this.isDragging) {
            this.updateValues();
            this.draw();
            return;
        }

        // Use RK4 integration for better accuracy
        this.updatePhysics(dt);
        
        // Calculate acceleration for display
        this.acceleration = this.calculateAcceleration(this.time, this.position, this.velocity);
        
        // Update values display
        this.updateValues();
        
        // Store data for graphs
        this.storeGraphData();
        
        // Update energy chart
        this.updateEnergyChart();
        
        // Draw simulation
        this.draw();
    }

    calculateAcceleration(time, position, velocity) {
        // Calculate driving force
        const drivingForce = this.driveAmplitude * Math.cos(this.driveAngularFrequency * time);
        
        // Calculate spring force (Hooke's Law)
        const springForce = -this.springConstant * position;
        
        // Calculate damping force
        const dampingForce = -this.damping * velocity;
        
        // Sum forces and apply F=ma
        return (springForce + dampingForce + drivingForce) / this.mass;
    }

    updatePhysics(dt) {
        // Implement 4th order Runge-Kutta method for numerical integration
        const k1v = this.calculateAcceleration(this.time, this.position, this.velocity) * dt;
        const k1x = this.velocity * dt;
        
        const k2v = this.calculateAcceleration(this.time + dt/2, this.position + k1x/2, this.velocity + k1v/2) * dt;
        const k2x = (this.velocity + k1v/2) * dt;
        
        const k3v = this.calculateAcceleration(this.time + dt/2, this.position + k2x/2, this.velocity + k2v/2) * dt;
        const k3x = (this.velocity + k2v/2) * dt;
        
        const k4v = this.calculateAcceleration(this.time + dt, this.position + k3x, this.velocity + k3v) * dt;
        const k4x = (this.velocity + k3v) * dt;
        
        // Update velocity and position
        this.velocity += (k1v + 2*k2v + 2*k3v + k4v) / 6;
        this.position += (k1x + 2*k2x + 2*k3x + k4x) / 6;
        
        // Increment time
        this.time += dt;
    }

    storeGraphData() {
        // Store current state for graphing
        this.timeData.push(this.time);
        this.positionData.push(this.position);
        this.velocityData.push(this.velocity);
        
        // Calculate energies
        const kinetic = 0.5 * this.mass * this.velocity * this.velocity;
        const potential = 0.5 * this.springConstant * this.position * this.position;
        const total = kinetic + potential;
        
        this.kineticEnergyData.push(kinetic);
        this.potentialEnergyData.push(potential);
        this.totalEnergyData.push(total);
        
        // Store phase data (position vs velocity)
        this.phaseData.push({x: this.position, y: this.velocity});
        
        // Limit data points to prevent memory issues
        if (this.timeData.length > this.maxDataPoints) {
            this.timeData.shift();
            this.positionData.shift();
            this.velocityData.shift();
            this.kineticEnergyData.shift();
            this.potentialEnergyData.shift();
            this.totalEnergyData.shift();
            this.phaseData.shift();
        }
    }

    initEnergyChart() {
        const graphCanvas = document.getElementById('energy-graph');
        if (!graphCanvas || !(graphCanvas instanceof HTMLCanvasElement)) {
            console.error('Energy graph canvas not found or not a canvas element');
            return;
        }
        
        const ctx = graphCanvas.getContext('2d');
        this.energyChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: Array(100).fill(''),
                datasets: [
                    {
                        label: 'Kinetic Energy',
                        data: Array(100).fill(0),
                        borderColor: getComputedStyle(document.body).getPropertyValue('--primary-color'),
                        tension: 0.4,
                        fill: false
                    },
                    {
                        label: 'Potential Energy',
                        data: Array(100).fill(0),
                        borderColor: getComputedStyle(document.body).getPropertyValue('--secondary-color'),
                        tension: 0.4,
                        fill: false
                    },
                    {
                        label: 'Total Energy',
                        data: Array(100).fill(0),
                        borderColor: getComputedStyle(document.body).getPropertyValue('--accent-color'),
                        tension: 0.4,
                        fill: false
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: {
                    duration: 0
                },
                scales: {
                    x: {
                        display: false
                    },
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    updateEnergyChart() {
        if (!this.energyChart) return;
        
        // Shift data to the left
        this.energyChart.data.datasets[0].data.shift();
        this.energyChart.data.datasets[1].data.shift();
        this.energyChart.data.datasets[2].data.shift();
        
        // Add new data point
        const kinetic = this.values.find(v => v.id === 'kineticEnergy').value;
        const potential = this.values.find(v => v.id === 'potentialEnergy').value;
        const total = this.values.find(v => v.id === 'totalEnergy').value;
        
        this.energyChart.data.datasets[0].data.push(kinetic);
        this.energyChart.data.datasets[1].data.push(potential);
        this.energyChart.data.datasets[2].data.push(total);
        
        // Update chart
        this.energyChart.update();
    }

    draw() {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw wall (fixed point)
        ctx.fillStyle = '#555';
        ctx.fillRect(this.originX - 10, this.originY - 30, 10, 60);

        // Draw spring
        this.drawSpring(ctx, this.originX, this.originY, this.position * this.pixelsPerMeter);

        // Draw mass
        const massX = this.originX + this.position * this.pixelsPerMeter;
        const massRadius = 15 + this.mass * 2; // Size proportional to mass
        
        ctx.beginPath();
        ctx.arc(massX, this.originY, massRadius, 0, 2 * Math.PI);
        ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--primary-color');
        ctx.fill();
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw equilibrium line
        ctx.beginPath();
        ctx.moveTo(this.originX, this.originY - 50);
        ctx.lineTo(this.originX, this.originY + 50);
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Draw ground line
        ctx.beginPath();
        ctx.moveTo(this.originX - 50, this.originY + 50);
        ctx.lineTo(this.canvas.width - 50, this.originY + 50);
        ctx.strokeStyle = '#555';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw driving force indicator if active
        if (this.driveAmplitude > 0) {
            const forceDirection = Math.cos(this.driveAngularFrequency * this.time);
            const forceLength = this.driveAmplitude * 5;
            const arrowX = massX + forceLength * forceDirection;
            
            ctx.beginPath();
            ctx.moveTo(massX, this.originY);
            ctx.lineTo(arrowX, this.originY);
            ctx.strokeStyle = '#e24a4a';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // Draw arrowhead
            const arrowSize = 8;
            ctx.beginPath();
            if (forceDirection > 0) {
                ctx.moveTo(arrowX, this.originY);
                ctx.lineTo(arrowX - arrowSize, this.originY - arrowSize/2);
                ctx.lineTo(arrowX - arrowSize, this.originY + arrowSize/2);
            } else {
                ctx.moveTo(arrowX, this.originY);
                ctx.lineTo(arrowX + arrowSize, this.originY - arrowSize/2);
                ctx.lineTo(arrowX + arrowSize, this.originY + arrowSize/2);
            }
            ctx.fillStyle = '#e24a4a';
            ctx.fill();
        }
    }

    drawSpring(ctx, x1, y, extension) {
        const x2 = x1 + extension;
        const springWidth = 40;
        const numCoils = 10;
        const coilWidth = Math.abs(extension) / numCoils;
        
        ctx.beginPath();
        ctx.moveTo(x1, y);
        
        // Draw first straight segment
        const straightLength = 10;
        let currentX = x1 + straightLength;
        ctx.lineTo(currentX, y);
        
        // Draw coils
        for (let i = 0; i < numCoils; i++) {
            currentX += coilWidth * 0.25;
            ctx.lineTo(currentX, y - springWidth/2);
            
            currentX += coilWidth * 0.5;
            ctx.lineTo(currentX, y + springWidth/2);
            
            currentX += coilWidth * 0.25;
            ctx.lineTo(currentX, y);
        }
        
        // Draw final straight segment
        ctx.lineTo(x2, y);
        
        ctx.strokeStyle = '#4a90e2';
        ctx.lineWidth = 3;
        ctx.stroke();
    }

    // Mouse interaction handlers
    onMouseDown(event) {
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;
        
        const massX = this.originX + this.position * this.pixelsPerMeter;
        const massY = this.originY;
        const massRadius = 15 + this.mass * 2;
        
        // Check if click is inside the mass
        const dx = mouseX - massX;
        const dy = mouseY - massY;
        const distance = Math.sqrt(dx*dx + dy*dy);
        
        if (distance <= massRadius) {
            this.isDragging = true;
            this.dragStartX = mouseX;
            this.dragStartPos = this.position;
        }
    }

    onMouseMove(event) {
        if (!this.isDragging) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        
        // Calculate new position based on drag
        const dx = mouseX - this.dragStartX;
        this.position = this.dragStartPos + dx / this.pixelsPerMeter;
        
        // Reset velocity when dragging
        this.velocity = 0;
        
        // Update values and redraw
        this.updateValues();
        this.draw();
    }

    onMouseUp() {
        this.isDragging = false;
    }

    getEnergy() {
        return {
            kinetic: this.values.find(v => v.id === 'kineticEnergy').value,
            potential: this.values.find(v => v.id === 'potentialEnergy').value,
            total: this.values.find(v => v.id === 'totalEnergy').value
        };
    }
}
