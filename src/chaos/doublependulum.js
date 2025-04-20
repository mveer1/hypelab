class DoublePendulum {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        
        // Physics constants
        this.gravity = 9.81;
        this.damping = 0.999; // Damping factor (1.0 = no damping)
        
        // Pendulum properties
        this.length1 = 120;
        this.length2 = 120;
        this.mass1 = 10;
        this.mass2 = 10;
        this.angle1 = Math.PI / 4; // Initial angle of first pendulum
        this.angle2 = Math.PI / 2; // Initial angle of second pendulum
        this.angularVelocity1 = 0;
        this.angularVelocity2 = 0;
        
        // For comparison mode
        this.showComparison = false;
        this.comparisonAngle1 = this.angle1 * 1.001; // Slightly different initial condition
        this.comparisonAngle2 = this.angle2 * 1.001;
        this.comparisonAngularVelocity1 = 0;
        this.comparisonAngularVelocity2 = 0;
        
        // For trail
        this.trailEnabled = true;
        this.trailPoints = [];
        this.maxTrailPoints = 200;
        this.trailColor = getComputedStyle(document.body).getPropertyValue('--accent-color');
        
        // Animation state
        this.isPaused = false;
        this.chaosMode = false;
        this.chaosTrials = [];
        this.chaosTrialCount = 10;
        
        // Energy data
        this.energyData = {
            kinetic: 0,
            potential: 0,
            total: 0
        };
        
        // Time tracking
        this.lastTimestamp = 0;
        this.timeScale = 1.0;
        
        // Define parameters for UI controls
        this.parameters = [
            {
                id: 'gravity',
                name: 'Gravity (m/s²)',
                min: 1,
                max: 20,
                step: 0.1,
                value: this.gravity,
                onChange: (value) => {
                    this.gravity = value;
                    this.reset();
                }
            },
            {
                id: 'damping',
                name: 'Damping',
                min: 0.9,
                max: 1.0,
                step: 0.001,
                value: this.damping,
                onChange: (value) => {
                    this.damping = value;
                    this.reset();
                }
            },
            {
                id: 'length1',
                name: 'Length 1',
                min: 50,
                max: 200,
                step: 1,
                value: this.length1,
                onChange: (value) => {
                    this.length1 = value;
                    this.reset();
                }
            },
            {
                id: 'length2',
                name: 'Length 2',
                min: 50,
                max: 200,
                step: 1,
                value: this.length2,
                onChange: (value) => {
                    this.length2 = value;
                    this.reset();
                }
            },
            {
                id: 'mass1',
                name: 'Mass 1',
                min: 1,
                max: 20,
                step: 0.1,
                value: this.mass1,
                onChange: (value) => {
                    this.mass1 = value;
                    this.reset();
                }
            },
            {
                id: 'mass2',
                name: 'Mass 2',
                min: 1,
                max: 20,
                step: 0.1,
                value: this.mass2,
                onChange: (value) => {
                    this.mass2 = value;
                    this.reset();
                }
            },
            {
                id: 'angle1',
                name: 'Angle 1',
                min: -Math.PI,
                max: Math.PI,
                step: 0.01,
                value: this.angle1,
                onChange: (value) => {
                    this.angle1 = value;
                    if (!this.isPaused) {
                        this.angularVelocity1 = 0;
                    }
                    this.reset();
                }
            },
            {
                id: 'angle2',
                name: 'Angle 2',
                min: -Math.PI,
                max: Math.PI,
                step: 0.01,
                value: this.angle2,
                onChange: (value) => {
                    this.angle2 = value;
                    if (!this.isPaused) {
                        this.angularVelocity2 = 0;
                    }
                    this.reset();
                }
            },
            {
                id: 'trail',
                name: 'Show Trail',
                type: 'checkbox',
                value: this.trailEnabled,
                onChange: (value) => {
                    this.trailEnabled = value;
                    if (!value) {
                        this.trailPoints = [];
                    }
                    this.reset();
                }
            },
            {
                id: 'comparison',
                name: 'Show Comparison',
                type: 'checkbox',
                value: this.showComparison,
                onChange: (value) => {
                    this.showComparison = value;
                    if (value) {
                        this.comparisonAngle1 = this.angle1 * 1.001;
                        this.comparisonAngle2 = this.angle2 * 1.001;
                        this.comparisonAngularVelocity1 = this.angularVelocity1;
                        this.comparisonAngularVelocity2 = this.angularVelocity2;
                    }
                    this.reset();
                }
            },
            {
                id: 'chaos',
                name: 'Chaos Mode',
                type: 'checkbox',
                value: this.chaosMode,
                onChange: (value) => {
                    this.chaosMode = value;
                    if (value) {
                        this.initChaosMode();
                    } else {
                        this.chaosTrials = [];
                    }
                    this.reset();
                }
            },
            {
                id: 'pause',
                name: 'Pause/Play',
                type: 'button',
                onClick: () => {
                    this.isPaused = !this.isPaused;
                    return this.isPaused ? 'Play' : 'Pause';
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
        
        // Define values for display
        this.values = [
            {
                id: 'kineticEnergy',
                name: 'Kinetic Energy (J)',
                value: 0,
                precision: 2
            },
            {
                id: 'potentialEnergy',
                name: 'Potential Energy (J)',
                value: 0,
                precision: 2
            },
            {
                id: 'totalEnergy',
                name: 'Total Energy (J)',
                value: 0,
                precision: 2
            },
            {
                id: 'angularMomentum',
                name: 'Angular Momentum',
                value: 0,
                precision: 2
            }
        ];
        
        // Define formulas
        this.formulas = [
            {
                title: 'Equations of Motion',
                description: 'The double pendulum is governed by coupled differential equations.',
                equation: 'θ̈₁ = f₁(θ₁, θ₂, θ̇₁, θ̇₂) and θ̈₂ = f₂(θ₁, θ₂, θ̇₁, θ̇₂)'
            },
            {
                title: 'Lyapunov Exponent',
                description: 'Measures the rate at which nearby trajectories diverge, indicating chaos.',
                equation: 'λ = lim(t→∞) (1/t) ln(|δz(t)|/|δz₀|)'
            },
            {
                title: 'Total Energy',
                description: 'Sum of kinetic and potential energy in the system.',
                equation: 'E = T + V = ½m₁L₁²θ̇₁² + ½m₂(L₁²θ̇₁² + L₂²θ̇₂² + 2L₁L₂θ̇₁θ̇₂cos(θ₁-θ₂)) + (m₁+m₂)gL₁(1-cosθ₁) + m₂gL₂(1-cosθ₂)'
            }
        ];
        
        // Energy chart
        this.energyChart = null;

        // Initialize positions
        this.calculatePositions();

        // Initialize energy chart
        this.initEnergyChart();
    }
    
    reset() {
        // Reset pendulum state
        this.angle1 = Math.PI / 4;
        this.angle2 = Math.PI / 2;
        this.angularVelocity1 = 0;
        this.angularVelocity2 = 0;
        
        if (this.showComparison) {
            this.comparisonAngle1 = this.angle1 * 1.001;
            this.comparisonAngle2 = this.angle2 * 1.001;
            this.comparisonAngularVelocity1 = 0;
            this.comparisonAngularVelocity2 = 0;
        }
        
        // Clear trail
        this.trailPoints = [];
        
        // Reset chaos mode
        if (this.chaosMode) {
            this.initChaosMode();
        } else {
            this.chaosTrials = [];
        }
        
        // Update parameter values in UI
        this.parameters.forEach(param => {
            if (param.id === 'angle1') param.value = this.angle1;
            if (param.id === 'angle2') param.value = this.angle2;
        });
        
        // Calculate positions
        this.calculatePositions();
    }
    
    initChaosMode() {
        this.chaosTrials = [];
        for (let i = 0; i < this.chaosTrialCount; i++) {
            // Create slightly different initial conditions
            const variation = 0.01 * (Math.random() * 2 - 1);
            this.chaosTrials.push({
                angle1: this.angle1 * (1 + variation),
                angle2: this.angle2 * (1 + variation),
                angularVelocity1: 0,
                angularVelocity2: 0,
                x1: 0, y1: 0, x2: 0, y2: 0
            });
        }
    }
    
    onResize(width, height) {
        // Calculate the center point for the pendulum
        this.centerX = width / 2;
        this.centerY = height / 3;
        
        // Recalculate positions
        this.calculatePositions();
    }
    
    calculatePositions() {
        // Calculate positions of pendulum bobs
        this.x1 = this.centerX + this.length1 * Math.sin(this.angle1);
        this.y1 = this.centerY + this.length1 * Math.cos(this.angle1);
        
        this.x2 = this.x1 + this.length2 * Math.sin(this.angle2);
        this.y2 = this.y1 + this.length2 * Math.cos(this.angle2);
        
        // Calculate comparison pendulum positions if enabled
        if (this.showComparison) {
            this.comparisonX1 = this.centerX + this.length1 * Math.sin(this.comparisonAngle1);
            this.comparisonY1 = this.centerY + this.length1 * Math.cos(this.comparisonAngle1);
            
            this.comparisonX2 = this.comparisonX1 + this.length2 * Math.sin(this.comparisonAngle2);
            this.comparisonY2 = this.comparisonY1 + this.length2 * Math.cos(this.comparisonAngle2);
        }
        
        // Calculate chaos trial positions
        if (this.chaosMode) {
            this.chaosTrials.forEach(trial => {
                trial.x1 = this.centerX + this.length1 * Math.sin(trial.angle1);
                trial.y1 = this.centerY + this.length1 * Math.cos(trial.angle1);
                
                trial.x2 = trial.x1 + this.length2 * Math.sin(trial.angle2);
                trial.y2 = trial.y1 + this.length2 * Math.cos(trial.angle2);
            });
        }
    }
    
    update(dt) {
        if (this.isPaused) return;
        
        // Use smaller time steps for numerical stability
        const subSteps = 10;
        const subDt = dt / subSteps;
        
        for (let step = 0; step < subSteps; step++) {
            // Update main pendulum
            this.updatePendulumPhysics(
                subDt, 
                this.angle1, this.angle2, 
                this.angularVelocity1, this.angularVelocity2,
                (a1, a2, av1, av2) => {
                    this.angle1 = a1;
                    this.angle2 = a2;
                    this.angularVelocity1 = av1;
                    this.angularVelocity2 = av2;
                }
            );
            
            // Update comparison pendulum if enabled
            if (this.showComparison) {
                this.updatePendulumPhysics(
                    subDt,
                    this.comparisonAngle1, this.comparisonAngle2,
                    this.comparisonAngularVelocity1, this.comparisonAngularVelocity2,
                    (a1, a2, av1, av2) => {
                        this.comparisonAngle1 = a1;
                        this.comparisonAngle2 = a2;
                        this.comparisonAngularVelocity1 = av1;
                        this.comparisonAngularVelocity2 = av2;
                    }
                );
            }
            
            // Update chaos trials if enabled
            if (this.chaosMode) {
                this.chaosTrials.forEach(trial => {
                    this.updatePendulumPhysics(
                        subDt,
                        trial.angle1, trial.angle2,
                        trial.angularVelocity1, trial.angularVelocity2,
                        (a1, a2, av1, av2) => {
                            trial.angle1 = a1;
                            trial.angle2 = a2;
                            trial.angularVelocity1 = av1;
                            trial.angularVelocity2 = av2;
                        }
                    );
                });
            }
        }
        
        // Update positions
        this.calculatePositions();
        
        // Add point to trail
        if (this.trailEnabled) {
            this.trailPoints.push({ x: this.x2, y: this.y2 });
            if (this.trailPoints.length > this.maxTrailPoints) {
                this.trailPoints.shift();
            }
        }
        
        // Calculate energy values
        this.calculateEnergy();
        
        // Draw the simulation
        this.draw();
    }
    
    updatePendulumPhysics(dt, angle1, angle2, angularVelocity1, angularVelocity2, updateCallback) {
        // Calculate derivatives using the equations of motion for a double pendulum
        const g = this.gravity;
        const m1 = this.mass1;
        const m2 = this.mass2;
        const l1 = this.length1;
        const l2 = this.length2;
        
        const delta = angle1 - angle2;
        const denominator = (m1 + m2) * l1 - m2 * l1 * Math.cos(delta) * Math.cos(delta);
        
        // Calculate angular accelerations
        const angularAcceleration1 = (
            -g * (m1 + m2) * Math.sin(angle1) - 
            m2 * g * Math.sin(angle1 - 2 * angle2) - 
            2 * Math.sin(delta) * m2 * (
                angularVelocity2 * angularVelocity2 * l2 + 
                angularVelocity1 * angularVelocity1 * l1 * Math.cos(delta)
            )
        ) / denominator;
        
        const angularAcceleration2 = (
            2 * Math.sin(delta) * (
                angularVelocity1 * angularVelocity1 * l1 * (m1 + m2) + 
                g * (m1 + m2) * Math.cos(angle1) + 
                angularVelocity2 * angularVelocity2 * l2 * m2 * Math.cos(delta)
            )
        ) / (m2 * l2 * denominator / l1);
        
        // Update angular velocities using Euler integration
        let newAngularVelocity1 = angularVelocity1 + angularAcceleration1 * dt;
        let newAngularVelocity2 = angularVelocity2 + angularAcceleration2 * dt;
        
        // Apply damping
        newAngularVelocity1 *= this.damping;
        newAngularVelocity2 *= this.damping;
        
        // Update angles
        let newAngle1 = angle1 + newAngularVelocity1 * dt;
        let newAngle2 = angle2 + newAngularVelocity2 * dt;
        
        // Update the pendulum state
        updateCallback(newAngle1, newAngle2, newAngularVelocity1, newAngularVelocity2);
    }
    
    calculateEnergy() {
        const m1 = this.mass1;
        const m2 = this.mass2;
        const l1 = this.length1;
        const l2 = this.length2;
        const g = this.gravity;
        
        const theta1 = this.angle1;
        const theta2 = this.angle2;
        const omega1 = this.angularVelocity1;
        const omega2 = this.angularVelocity2;
        
        // Calculate velocities of the masses
        const v1x = l1 * omega1 * Math.cos(theta1);
        const v1y = l1 * omega1 * Math.sin(theta1);
        const v2x = l1 * omega1 * Math.cos(theta1) + l2 * omega2 * Math.cos(theta2);
        const v2y = l1 * omega1 * Math.sin(theta1) + l2 * omega2 * Math.sin(theta2);
        
        // Calculate kinetic energy: T = 0.5 * m1 * v1^2 + 0.5 * m2 * v2^2
        const kineticEnergy = 0.5 * m1 * (v1x*v1x + v1y*v1y) + 0.5 * m2 * (v2x*v2x + v2y*v2y);
        
        // Calculate potential energy: V = m1 * g * h1 + m2 * g * h2
        // where h1 and h2 are heights of the masses relative to the pivot
        const h1 = l1 * (1 - Math.cos(theta1));
        const h2 = l1 * (1 - Math.cos(theta1)) + l2 * (1 - Math.cos(theta2));
        const potentialEnergy = m1 * g * h1 + m2 * g * h2;
        
        // Calculate angular momentum: L = m1 * r1^2 * omega1 + m2 * (r1^2 * omega1 + r2^2 * omega2 + 2 * r1 * r2 * omega1 * omega2 * cos(theta1 - theta2))
        const angularMomentum = m1 * l1 * l1 * omega1 + 
                              m2 * (l1 * l1 * omega1 + l2 * l2 * omega2 + 
                                    2 * l1 * l2 * omega1 * omega2 * Math.cos(theta1 - theta2));
        
        // Update values
        this.values[0].value = kineticEnergy;
        this.values[1].value = potentialEnergy;
        this.values[2].value = kineticEnergy + potentialEnergy;
        this.values[3].value = angularMomentum;
        
        // Store energy data for chart
        this.energyData = {
            kinetic: kineticEnergy,
            potential: potentialEnergy,
            total: kineticEnergy + potentialEnergy
        };
    }
    
    getEnergy() {
        return this.energyData;
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
        this.energyChart.data.datasets[0].data.push(this.energyData.kinetic);
        this.energyChart.data.datasets[1].data.push(this.energyData.potential);
        this.energyChart.data.datasets[2].data.push(this.energyData.total);
        
        // Update chart
        this.energyChart.update();
    }
    
    
    draw() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw trail if enabled
        if (this.trailEnabled && this.trailPoints.length > 0) {
            this.ctx.beginPath();
            this.ctx.moveTo(this.trailPoints[0].x, this.trailPoints[0].y);
            
            for (let i = 1; i < this.trailPoints.length; i++) {
                this.ctx.lineTo(this.trailPoints[i].x, this.trailPoints[i].y);
            }
            
            this.ctx.strokeStyle = this.trailColor;
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
        }
        
        // Draw chaos trials if enabled
        if (this.chaosMode) {
            this.chaosTrials.forEach((trial, index) => {
                const alpha = 0.3;
                
                // Draw strings
                this.ctx.beginPath();
                this.ctx.moveTo(this.centerX, this.centerY);
                this.ctx.lineTo(trial.x1, trial.y1);
                this.ctx.lineTo(trial.x2, trial.y2);
                this.ctx.strokeStyle = `rgba(150, 150, 150, ${alpha})`;
                this.ctx.lineWidth = 1;
                this.ctx.stroke();
                
                // Draw masses
                this.ctx.beginPath();
                this.ctx.arc(trial.x1, trial.y1, 5, 0, Math.PI * 2);
                this.ctx.fillStyle = `rgba(100, 100, 100, ${alpha})`;
                this.ctx.fill();
                
                this.ctx.beginPath();
                this.ctx.arc(trial.x2, trial.y2, 5, 0, Math.PI * 2);
                this.ctx.fillStyle = `rgba(200, 100, 100, ${alpha})`;
                this.ctx.fill();
            });
        }
        
        // Draw comparison pendulum if enabled
        if (this.showComparison) {
            // Draw strings
            this.ctx.beginPath();
            this.ctx.moveTo(this.centerX, this.centerY);
            this.ctx.lineTo(this.comparisonX1, this.comparisonY1);
            this.ctx.lineTo(this.comparisonX2, this.comparisonY2);
            this.ctx.strokeStyle = 'rgba(255, 100, 100, 0.6)';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
            
            // Draw masses
            const radius1 = 5 + this.mass1 / 2;
            const radius2 = 5 + this.mass2 / 2;
            
            this.ctx.beginPath();
            this.ctx.arc(this.comparisonX1, this.comparisonY1, radius1, 0, Math.PI * 2);
            this.ctx.fillStyle = 'rgba(255, 100, 100, 0.6)';
            this.ctx.fill();
            this.ctx.strokeStyle = 'rgba(200, 50, 50, 0.8)';
            this.ctx.lineWidth = 1;
            this.ctx.stroke();
            
            this.ctx.beginPath();
            this.ctx.arc(this.comparisonX2, this.comparisonY2, radius2, 0, Math.PI * 2);
            this.ctx.fillStyle = 'rgba(255, 100, 100, 0.6)';
            this.ctx.fill();
            this.ctx.strokeStyle = 'rgba(200, 50, 50, 0.8)';
            this.ctx.lineWidth = 1;
            this.ctx.stroke();
        }
        
        // Draw main pendulum
        // Draw strings
        this.ctx.beginPath();
        this.ctx.moveTo(this.centerX, this.centerY);
        this.ctx.lineTo(this.x1, this.y1);
        this.ctx.lineTo(this.x2, this.y2);
        this.ctx.strokeStyle = getComputedStyle(document.body).getPropertyValue('--text-color');
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        
        // Draw pivot point
        this.ctx.beginPath();
        this.ctx.arc(this.centerX, this.centerY, 5, 0, Math.PI * 2);
        this.ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--border-color');
        this.ctx.fill();
        this.ctx.strokeStyle = getComputedStyle(document.body).getPropertyValue('--text-color');
        this.ctx.lineWidth = 1;
        this.ctx.stroke();
        
        // Draw masses (size proportional to mass)
        const radius1 = 5 + this.mass1 / 2;
        const radius2 = 5 + this.mass2 / 2;
        
        this.ctx.beginPath();
        this.ctx.arc(this.x1, this.y1, radius1, 0, Math.PI * 2);
        this.ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--primary-color');
        this.ctx.fill();
        this.ctx.strokeStyle = getComputedStyle(document.body).getPropertyValue('--text-color');
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        
        this.ctx.beginPath();
        this.ctx.arc(this.x2, this.y2, radius2, 0, Math.PI * 2);
        this.ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--secondary-color');
        this.ctx.fill();
        this.ctx.strokeStyle = getComputedStyle(document.body).getPropertyValue('--text-color');
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
    }

}