/**
 * Double Pendulum Simulation
 * A physics simulation demonstrating chaotic dynamics in a double pendulum system
 * Implements Lagrangian mechanics with RK4 integration for accurate physics
 */
class DoublePendulum {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        
        // Physical constants
        this.gravity = 9.81; // m/s²
        this.damping = 0.01; // Damping coefficient (air resistance)
        
        // Pendulum properties
        this.length1 = 150; // Length of first pendulum arm (pixels)
        this.length2 = 150; // Length of second pendulum arm (pixels)
        this.mass1 = 10; // Mass of first pendulum bob
        this.mass2 = 10; // Mass of second pendulum bob
        this.angle1 = Math.PI / 2; // Initial angle of first pendulum (radians)
        this.angle2 = Math.PI / 2; // Initial angle of second pendulum (radians)
        this.angularVelocity1 = 0; // Initial angular velocity of first pendulum (rad/s)
        this.angularVelocity2 = 0; // Initial angular velocity of second pendulum (rad/s)
        
        // For comparison pendulum (to demonstrate chaos)
        this.showComparison = true;
        this.comparisonAngle1 = this.angle1 * 1.001; // Slightly different initial condition
        this.comparisonAngle2 = this.angle2 * 1.001;
        this.comparisonAngularVelocity1 = this.angularVelocity1;
        this.comparisonAngularVelocity2 = this.angularVelocity2;
        this.comparisonColor = 'rgba(255, 100, 100, 0.6)'; // Color for comparison pendulum
        
        // For phase space trajectory
        this.phaseSpaceData = {
            angle1: [],
            velocity1: [],
            angle2: [],
            velocity2: []
        };
        this.maxPhasePoints = 500; // Maximum number of points in phase space
        
        // For energy tracking
        this.energyData = {
            time: [],
            kinetic: [],
            potential: [],
            total: []
        };
        this.maxEnergyPoints = 300;
        
        // For trail of second pendulum bob
        this.trailPoints = [];
        this.maxTrailPoints = 500;
        this.trailColor = 'rgba(255, 0, 0, 0.7)';
        
        // Lyapunov exponent calculation
        this.lyapunovExponent = 0;
        this.lyapunovTime = 0;
        this.lyapunovDelta0 = 0.001; // Initial separation
        this.lyapunovDelta = this.lyapunovDelta0;
        this.lyapunovHistory = [];
        this.maxLyapunovPoints = 200;
        
        // Simulation state
        this.isPaused = false;
        this.timeStep = 1/60; // Fixed time step for physics (seconds)
        this.time = 0; // Total simulation time
        
        // Center point for drawing
        this.centerX = this.canvas.width / 2;
        this.centerY = this.canvas.height / 3;
        
        // Define parameters for UI controls
        this.parameters = [
            {
                id: 'mass1',
                name: 'Mass 1',
                min: 1,
                max: 20,
                step: 0.1,
                value: this.mass1,
                onChange: (value) => {
                    this.mass1 = value;
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
                }
            },
            {
                id: 'length1',
                name: 'Length 1',
                min: 50,
                max: 300,
                step: 1,
                value: this.length1,
                onChange: (value) => {
                    this.length1 = value;
                }
            },
            {
                id: 'length2',
                name: 'Length 2',
                min: 50,
                max: 300,
                step: 1,
                value: this.length2,
                onChange: (value) => {
                    this.length2 = value;
                }
            },
            {
                id: 'angle1',
                name: 'Initial Angle 1 (rad)',
                min: -Math.PI,
                max: Math.PI,
                step: 0.01,
                value: this.angle1,
                onChange: (value) => {
                    this.angle1 = value;
                    this.reset();
                }
            },
            {
                id: 'angle2',
                name: 'Initial Angle 2 (rad)',
                min: -Math.PI,
                max: Math.PI,
                step: 0.01,
                value: this.angle2,
                onChange: (value) => {
                    this.angle2 = value;
                    this.reset();
                }
            },
            {
                id: 'angularVelocity1',
                name: 'Initial Angular Velocity 1',
                min: -5,
                max: 5,
                step: 0.1,
                value: this.angularVelocity1,
                onChange: (value) => {
                    this.angularVelocity1 = value;
                    this.reset();
                }
            },
            {
                id: 'angularVelocity2',
                name: 'Initial Angular Velocity 2',
                min: -5,
                max: 5,
                step: 0.1,
                value: this.angularVelocity2,
                onChange: (value) => {
                    this.angularVelocity2 = value;
                    this.reset();
                }
            },
            {
                id: 'gravity',
                name: 'Gravity (m/s²)',
                min: 1,
                max: 20,
                step: 0.1,
                value: this.gravity,
                onChange: (value) => {
                    this.gravity = value;
                }
            },
            {
                id: 'damping',
                name: 'Damping',
                min: 0,
                max: 0.1,
                step: 0.001,
                value: this.damping,
                onChange: (value) => {
                    this.damping = value;
                }
            },
            {
                id: 'showComparison',
                name: 'Show Comparison Pendulum',
                type: 'checkbox',
                value: this.showComparison,
                onChange: (value) => {
                    this.showComparison = value;
                    if (value) {
                        this.resetComparison();
                    }
                }
            },
            {
                id: 'clearTrail',
                name: 'Clear Trail',
                type: 'button',
                onClick: () => {
                    this.trailPoints = [];
                    this.phaseSpaceData = {
                        angle1: [],
                        velocity1: [],
                        angle2: [],
                        velocity2: []
                    };
                    this.energyData = {
                        time: [],
                        kinetic: [],
                        potential: [],
                        total: []
                    };
                    this.lyapunovHistory = [];
                    return 'Clear Trail';
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
        
        // Values for display
        this.values = [
            { id: 'angle1', name: 'Angle 1 (rad)', value: this.angle1, precision: 3 },
            { id: 'angle2', name: 'Angle 2 (rad)', value: this.angle2, precision: 3 },
            { id: 'angularVelocity1', name: 'Angular Velocity 1 (rad/s)', value: this.angularVelocity1, precision: 3 },
            { id: 'angularVelocity2', name: 'Angular Velocity 2 (rad/s)', value: this.angularVelocity2, precision: 3 },
            { id: 'kineticEnergy', name: 'Kinetic Energy (J)', value: 0, precision: 3 },
            { id: 'potentialEnergy', name: 'Potential Energy (J)', value: 0, precision: 3 },
            { id: 'totalEnergy', name: 'Total Energy (J)', value: 0, precision: 3 },
            { id: 'lyapunovExponent', name: 'Lyapunov Exponent', value: 0, precision: 5 },
            { id: 'divergenceTime', name: 'Divergence Time (s)', value: 0, precision: 2 }
        ];
        
        // Formulas
        this.formulas = [
            {
                title: 'Lagrangian of the System',
                description: 'L = T - V, where T is kinetic energy and V is potential energy',
                equation: 'L = ½m₁l₁²θ̇₁² + ½m₂(l₁²θ̇₁² + l₂²θ̇₂² + 2l₁l₂θ̇₁θ̇₂cos(θ₁ - θ₂)) - m₁gl₁(1-cosθ₁) - m₂g(l₁(1-cosθ₁) + l₂(1-cosθ₂))'
            },
            {
                title: 'Equations of Motion',
                description: 'Derived from Lagrangian mechanics using Euler-Lagrange equations',
                equation: 'θ̈₁ = f(θ₁, θ₂, θ̇₁, θ̇₂), θ̈₂ = g(θ₁, θ₂, θ̇₁, θ̇₂)'
            },
            {
                title: 'Energy Conservation',
                description: 'Total energy remains constant in absence of damping',
                equation: 'E = T + V = constant'
            },
            {
                title: 'Lyapunov Exponent',
                description: 'Measures sensitivity to initial conditions, positive values indicate chaos',
                equation: 'λ = lim(t→∞) (1/t) ln(|δz(t)|/|δz₀|)'
            }
        ];
        
        // Initialize energy chart
        this.initEnergyChart();
        
        // Initialize the simulation
        this.reset();
    }
    
    reset() {
        // Reset pendulum state to initial values
        this.angle1 = this.parameters.find(p => p.id === 'angle1').value;
        this.angle2 = this.parameters.find(p => p.id === 'angle2').value;
        this.angularVelocity1 = this.parameters.find(p => p.id === 'angularVelocity1').value;
        this.angularVelocity2 = this.parameters.find(p => p.id === 'angularVelocity2').value;
        
        // Reset time and data arrays
        this.time = 0;
        this.trailPoints = [];
        this.phaseSpaceData = {
            angle1: [],
            velocity1: [],
            angle2: [],
            velocity2: []
        };
        this.energyData = {
            time: [],
            kinetic: [],
            potential: [],
            total: []
        };
        
        // Reset Lyapunov calculation
        this.lyapunovExponent = 0;
        this.lyapunovTime = 0;
        this.lyapunovDelta = this.lyapunovDelta0;
        this.lyapunovHistory = [];
        
        // Reset comparison pendulum if enabled
        if (this.showComparison) {
            this.resetComparison();
        }
        
        // Calculate initial energy
        this.calculateEnergy();
    }
    
    resetComparison() {
        // Reset comparison pendulum with slightly different initial conditions
        this.comparisonAngle1 = this.angle1 * 1.001;
        this.comparisonAngle2 = this.angle2 * 1.001;
        this.comparisonAngularVelocity1 = this.angularVelocity1;
        this.comparisonAngularVelocity2 = this.angularVelocity2;
    }
    
    onResize(width, height) {
        // Update center point when canvas is resized
        this.centerX = width / 2;
        this.centerY = height / 3;
    }
    
    update(dt) {
        if (this.isPaused) return;
        
        // Use fixed time step for stability
        const fixedDt = this.timeStep;
        
        // Update main pendulum using RK4 integration
        this.updatePendulum(fixedDt);
        
        // Update comparison pendulum if enabled
        if (this.showComparison) {
            this.updateComparisonPendulum(fixedDt);
            
            // Calculate Lyapunov exponent
            this.calculateLyapunovExponent(fixedDt);
        }
        
        // Update time
        this.time += fixedDt;
        
        // Store trail point for second bob
        const x2 = this.centerX + this.length1 * Math.sin(this.angle1) + this.length2 * Math.sin(this.angle2);
        const y2 = this.centerY + this.length1 * Math.cos(this.angle1) + this.length2 * Math.cos(this.angle2);
        this.trailPoints.push({ x: x2, y: y2 });
        if (this.trailPoints.length > this.maxTrailPoints) {
            this.trailPoints.shift();
        }
        
        // Store phase space data
        this.phaseSpaceData.angle1.push(this.angle1);
        this.phaseSpaceData.velocity1.push(this.angularVelocity1);
        this.phaseSpaceData.angle2.push(this.angle2);
        this.phaseSpaceData.velocity2.push(this.angularVelocity2);
        
        // Limit phase space data points
        if (this.phaseSpaceData.angle1.length > this.maxPhasePoints) {
            this.phaseSpaceData.angle1.shift();
            this.phaseSpaceData.velocity1.shift();
            this.phaseSpaceData.angle2.shift();
            this.phaseSpaceData.velocity2.shift();
        }
        
        // Calculate energy
        this.calculateEnergy();
        
        // Store energy data
        this.energyData.time.push(this.time);
        this.energyData.kinetic.push(this.values.find(v => v.id === 'kineticEnergy').value);
        this.energyData.potential.push(this.values.find(v => v.id === 'potentialEnergy').value);
        this.energyData.total.push(this.values.find(v => v.id === 'totalEnergy').value);
        
        // Limit energy data points
        if (this.energyData.time.length > this.maxEnergyPoints) {
            this.energyData.time.shift();
            this.energyData.kinetic.shift();
            this.energyData.potential.shift();
            this.energyData.total.shift();
        }
        
        // Update energy chart
        this.updateEnergyChart();
        
        // Update displayed values
        this.values.find(v => v.id === 'angle1').value = this.angle1;
        this.values.find(v => v.id === 'angle2').value = this.angle2;
        this.values.find(v => v.id === 'angularVelocity1').value = this.angularVelocity1;
        this.values.find(v => v.id === 'angularVelocity2').value = this.angularVelocity2;
        this.values.find(v => v.id === 'lyapunovExponent').value = this.lyapunovExponent;
        
        // Calculate time to divergence (when Lyapunov delta exceeds 1.0)
        const divergenceTime = Math.log(1.0 / this.lyapunovDelta0) / this.lyapunovExponent;
        this.values.find(v => v.id === 'divergenceTime').value = divergenceTime > 0 ? divergenceTime : 0;
        
        // Draw the simulation
        this.draw();
    }
    
    updatePendulum(dt) {
        // Implement 4th order Runge-Kutta method for the pendulum system
        const k1 = this.derivatives(this.angle1, this.angularVelocity1, this.angle2, this.angularVelocity2);
        const k2 = this.derivatives(
            this.angle1 + k1.dTheta1 * dt/2,
            this.angularVelocity1 + k1.dOmega1 * dt/2,
            this.angle2 + k1.dTheta2 * dt/2,
            this.angularVelocity2 + k1.dOmega2 * dt/2
        );
        const k3 = this.derivatives(
            this.angle1 + k2.dTheta1 * dt/2,
            this.angularVelocity1 + k2.dOmega1 * dt/2,
            this.angle2 + k2.dTheta2 * dt/2,
            this.angularVelocity2 + k2.dOmega2 * dt/2
        );
        const k4 = this.derivatives(
            this.angle1 + k3.dTheta1 * dt,
            this.angularVelocity1 + k3.dOmega1 * dt,
            this.angle2 + k3.dTheta2 * dt,
            this.angularVelocity2 + k3.dOmega2 * dt
        );
        
        // Update angles and angular velocities
        this.angle1 += (k1.dTheta1 + 2*k2.dTheta1 + 2*k3.dTheta1 + k4.dTheta1) * dt/6;
        this.angularVelocity1 += (k1.dOmega1 + 2*k2.dOmega1 + 2*k3.dOmega1 + k4.dOmega1) * dt/6;
        this.angle2 += (k1.dTheta2 + 2*k2.dTheta2 + 2*k3.dTheta2 + k4.dTheta2) * dt/6;
        this.angularVelocity2 += (k1.dOmega2 + 2*k2.dOmega2 + 2*k3.dOmega2 + k4.dOmega2) * dt/6;
        
        // Normalize angles to [-π, π]
        this.angle1 = this.normalizeAngle(this.angle1);
        this.angle2 = this.normalizeAngle(this.angle2);
    }
    
    updateComparisonPendulum(dt) {
        // Same RK4 method for the comparison pendulum
        const k1 = this.derivatives(this.comparisonAngle1, this.comparisonAngularVelocity1, this.comparisonAngle2, this.comparisonAngularVelocity2);
        const k2 = this.derivatives(
            this.comparisonAngle1 + k1.dTheta1 * dt/2,
            this.comparisonAngularVelocity1 + k1.dOmega1 * dt/2,
            this.comparisonAngle2 + k1.dTheta2 * dt/2,
            this.comparisonAngularVelocity2 + k1.dOmega2 * dt/2
        );
        const k3 = this.derivatives(
            this.comparisonAngle1 + k2.dTheta1 * dt/2,
            this.comparisonAngularVelocity1 + k2.dOmega1 * dt/2,
            this.comparisonAngle2 + k2.dTheta2 * dt/2,
            this.comparisonAngularVelocity2 + k2.dOmega2 * dt/2
        );
        const k4 = this.derivatives(
            this.comparisonAngle1 + k3.dTheta1 * dt,
            this.comparisonAngularVelocity1 + k3.dOmega1 * dt,
            this.comparisonAngle2 + k3.dTheta2 * dt,
            this.comparisonAngularVelocity2 + k3.dOmega2 * dt
        );
        
        // Update angles and angular velocities for comparison pendulum
        this.comparisonAngle1 += (k1.dTheta1 + 2*k2.dTheta1 + 2*k3.dTheta1 + k4.dTheta1) * dt/6;
        this.comparisonAngularVelocity1 += (k1.dOmega1 + 2*k2.dOmega1 + 2*k3.dOmega1 + k4.dOmega1) * dt/6;
        this.comparisonAngle2 += (k1.dTheta2 + 2*k2.dTheta2 + 2*k3.dTheta2 + k4.dTheta2) * dt/6;
        this.comparisonAngularVelocity2 += (k1.dOmega2 + 2*k2.dOmega2 + 2*k3.dOmega2 + k4.dOmega2) * dt/6;
        
        // Normalize angles
        this.comparisonAngle1 = this.normalizeAngle(this.comparisonAngle1);
        this.comparisonAngle2 = this.normalizeAngle(this.comparisonAngle2);
    }
    
    derivatives(theta1, omega1, theta2, omega2) {
        // Calculate derivatives for the double pendulum system
        // These are the equations of motion derived from the Lagrangian
        
        const m1 = this.mass1;
        const m2 = this.mass2;
        const l1 = this.length1;
        const l2 = this.length2;
        const g = this.gravity;
        const d = this.damping;
        
        // Calculate intermediate values
        const delta = theta2 - theta1;
        const cosDelta = Math.cos(delta);
        const sinDelta = Math.sin(delta);
        
        // Denominator terms (from the matrix inversion)
        const den1 = (m1 + m2) * l1 - m2 * l1 * cosDelta * cosDelta;
        const den2 = (l2 / l1) * den1;
        
        // Calculate angular accelerations
        const dOmega1 = (
            m2 * l1 * omega1 * omega1 * sinDelta * cosDelta +
            m2 * g * Math.sin(theta2) * cosDelta +
            m2 * l2 * omega2 * omega2 * sinDelta -
            (m1 + m2) * g * Math.sin(theta1) -
            d * omega1 * den1
        ) / den1;
        
        const dOmega2 = (
            -m2 * l2 * omega2 * omega2 * sinDelta * cosDelta +
            (m1 + m2) * g * Math.sin(theta1) * cosDelta -
            (m1 + m2) * l1 * omega1 * omega1 * sinDelta -
            (m1 + m2) * g * Math.sin(theta2) -
            d * omega2 * den2
        ) / den2;
        
        return {
            dTheta1: omega1,
            dOmega1: dOmega1,
            dTheta2: omega2,
            dOmega2: dOmega2
        };
    }
    
    normalizeAngle(angle) {
        // Normalize angle to [-π, π]
        return ((angle + Math.PI) % (2 * Math.PI)) - Math.PI;
    }
    
    calculateLyapunovExponent(dt) {
        // Update Lyapunov time
        this.lyapunovTime += dt;
        
        // Calculate phase space distance between main and comparison pendulums
        const deltaTheta1 = this.angle1 - this.comparisonAngle1;
        const deltaTheta2 = this.angle2 - this.comparisonAngle2;
        const deltaOmega1 = this.angularVelocity1 - this.comparisonAngularVelocity1;
        const deltaOmega2 = this.angularVelocity2 - this.comparisonAngularVelocity2;
        
        // Calculate Euclidean distance in phase space
        this.lyapunovDelta = Math.sqrt(
            deltaTheta1*deltaTheta1 + 
            deltaTheta2*deltaTheta2 + 
            deltaOmega1*deltaOmega1 + 
            deltaOmega2*deltaOmega2
        );
        
        // If separation has grown significantly, calculate Lyapunov exponent and renormalize
        if (this.lyapunovDelta > 0.01) {
            // Calculate Lyapunov exponent: λ = (1/t) * ln(|δz(t)|/|δz₀|)
            this.lyapunovExponent = Math.log(this.lyapunovDelta / this.lyapunovDelta0) / this.lyapunovTime;
            
            // Store in history
            this.lyapunovHistory.push({
                time: this.time,
                value: this.lyapunovExponent
            });
            
            // Limit history size
            if (this.lyapunovHistory.length > this.maxLyapunovPoints) {
                this.lyapunovHistory.shift();
            }
            
            // Renormalize the comparison pendulum to maintain small separation
            const scale = this.lyapunovDelta0 / this.lyapunovDelta;
            this.comparisonAngle1 = this.angle1 - deltaTheta1 * scale;
            this.comparisonAngle2 = this.angle2 - deltaTheta2 * scale;
            this.comparisonAngularVelocity1 = this.angularVelocity1 - deltaOmega1 * scale;
            this.comparisonAngularVelocity2 = this.angularVelocity2 - deltaOmega2 * scale;
            
            // Reset Lyapunov time for next calculation
            this.lyapunovTime = 0;
        }
    }
    
    calculateEnergy() {
        // Calculate kinetic and potential energy of the system
        const m1 = this.mass1;
        const m2 = this.mass2;
        const l1 = this.length1;
        const l2 = this.length2;
        const g = this.gravity;
        
        // Positions of the bobs
        const x1 = l1 * Math.sin(this.angle1);
        const y1 = l1 * Math.cos(this.angle1);
        const x2 = x1 + l2 * Math.sin(this.angle2);
        const y2 = y1 + l2 * Math.cos(this.angle2);
        
        // Velocities of the bobs
        const v1x = l1 * this.angularVelocity1 * Math.cos(this.angle1);
        const v1y = -l1 * this.angularVelocity1 * Math.sin(this.angle1);
        const v2x = v1x + l2 * this.angularVelocity2 * Math.cos(this.angle2);
        const v2y = v1y - l2 * this.angularVelocity2 * Math.sin(this.angle2);
        
        // Kinetic energy: T = (1/2) * m1 * v1² + (1/2) * m2 * v2²
        const kinetic = 0.5 * m1 * (v1x*v1x + v1y*v1y) + 0.5 * m2 * (v2x*v2x + v2y*v2y);
        
        // Potential energy: V = m1 * g * h1 + m2 * g * h2
        // Heights are measured from the pivot point
        const h1 = -y1; // Height of first bob (negative because y increases downward)
        const h2 = -y2; // Height of second bob
        const potential = m1 * g * h1 + m2 * g * h2;
        
        // Total energy
        const total = kinetic + potential;
        
        // Update values
        this.values.find(v => v.id === 'kineticEnergy').value = kinetic;
        this.values.find(v => v.id === 'potentialEnergy').value = potential;
        this.values.find(v => v.id === 'totalEnergy').value = total;
        
        return { kinetic, potential, total };
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
                labels: this.energyData.time,
                datasets: [
                    {
                        label: 'Kinetic Energy',
                        data: this.energyData.kinetic,
                        borderColor: getComputedStyle(document.body).getPropertyValue('--primary-color'),
                        tension: 0.4,
                        fill: false
                    },
                    {
                        label: 'Potential Energy',
                        data: this.energyData.potential,
                        borderColor: getComputedStyle(document.body).getPropertyValue('--secondary-color'),
                        tension: 0.4,
                        fill: false
                    },
                    {
                        label: 'Total Energy',
                        data: this.energyData.total,
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
                        type: 'linear',
                        position: 'bottom',
                        title: {
                            display: true,
                            text: 'Time (s)'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Energy (J)'
                        }
                    }
                }
            }
        });
    }
    
    updateEnergyChart() {
        if (!this.energyChart) return;
        
        // Update chart data
        this.energyChart.data.labels = this.energyData.time;
        this.energyChart.data.datasets[0].data = this.energyData.kinetic;
        this.energyChart.data.datasets[1].data = this.energyData.potential;
        this.energyChart.data.datasets[2].data = this.energyData.total;
        
        // Update chart
        this.energyChart.update();
    }
    
    draw() {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw phase space in top-right corner
        this.drawPhaseSpace(ctx);
        
        // Draw Lyapunov exponent graph in bottom-right corner
        this.drawLyapunovGraph(ctx);
        
        // Draw trail of second pendulum bob
        ctx.beginPath();
        ctx.strokeStyle = this.trailColor;
        ctx.lineWidth = 2;
        for (let i = 0; i < this.trailPoints.length; i++) {
            const p = this.trailPoints[i];
            if (i === 0) ctx.moveTo(p.x, p.y);
            else ctx.lineTo(p.x, p.y);
        }
        ctx.stroke();
        
        // Draw comparison pendulum if enabled
        if (this.showComparison) {
            this.drawPendulum(
                ctx,
                this.comparisonAngle1,
                this.comparisonAngle2,
                this.comparisonColor,
                0.7 // Lower opacity for comparison
            );
        }
        
        // Draw main pendulum
        this.drawPendulum(
            ctx,
            this.angle1,
            this.angle2,
            getComputedStyle(document.body).getPropertyValue('--primary-color'),
            1.0 // Full opacity
        );
        
        // Draw pivot point
        ctx.beginPath();
        ctx.arc(this.centerX, this.centerY, 5, 0, 2 * Math.PI);
        ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--text-color');
        ctx.fill();
        
        // Draw info text
        ctx.font = '14px Arial';
        ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--text-color');
        ctx.fillText(`Time: ${this.time.toFixed(2)} s`, 10, 20);
        ctx.fillText(`Lyapunov Exponent: ${this.lyapunovExponent.toFixed(5)}`, 10, 40);
        
        // Draw legend
        ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--primary-color');
        ctx.fillRect(10, 60, 15, 15);
        ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--text-color');
        ctx.fillText('Main Pendulum', 30, 72);
        
        if (this.showComparison) {
            ctx.fillStyle = this.comparisonColor;
            ctx.fillRect(10, 85, 15, 15);
            ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--text-color');
            ctx.fillText('Comparison (Δθ₁ = 0.1%)', 30, 97);
        }
    }
    
    drawPendulum(ctx, angle1, angle2, color, opacity) {
        // Calculate positions of the pendulum bobs
        const x1 = this.centerX + this.length1 * Math.sin(angle1);
        const y1 = this.centerY + this.length1 * Math.cos(angle1);
        const x2 = x1 + this.length2 * Math.sin(angle2);
        const y2 = y1 + this.length2 * Math.cos(angle2);
        
        // Draw pendulum arms
        ctx.beginPath();
        ctx.moveTo(this.centerX, this.centerY);
        ctx.lineTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = getComputedStyle(document.body).getPropertyValue('--text-color');
        ctx.globalAlpha = opacity;
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Draw pendulum bobs
        // First bob
        ctx.beginPath();
        ctx.arc(x1, y1, 5 + this.mass1 / 2, 0, 2 * Math.PI);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = getComputedStyle(document.body).getPropertyValue('--text-color');
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // Second bob
        ctx.beginPath();
        ctx.arc(x2, y2, 5 + this.mass2 / 2, 0, 2 * Math.PI);
        ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--secondary-color');
        ctx.fill();
        ctx.strokeStyle = getComputedStyle(document.body).getPropertyValue('--text-color');
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // Reset opacity
        ctx.globalAlpha = 1.0;
    }
    
    drawPhaseSpace(ctx) {
        // Draw phase space plot in top-right corner
        const size = 150;
        const margin = 10;
        const x = this.canvas.width - size - margin;
        const y = margin;
        
        // Draw background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.fillRect(x, y, size, size);
        
        // Draw axes
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 1;
        
        // Horizontal axis (angle)
        ctx.beginPath();
        ctx.moveTo(x, y + size/2);
        ctx.lineTo(x + size, y + size/2);
        ctx.stroke();
        
        // Vertical axis (angular velocity)
        ctx.beginPath();
        ctx.moveTo(x + size/2, y);
        ctx.lineTo(x + size/2, y + size);
        ctx.stroke();
        
        // Draw phase space trajectory for second pendulum
        if (this.phaseSpaceData.angle2.length > 1) {
            ctx.beginPath();
            
            // Scale factors for plotting
            const scaleX = size / (2 * Math.PI); // Scale angle to fit in plot
            const scaleY = size / 20; // Scale velocity to fit in plot
            
            for (let i = 0; i < this.phaseSpaceData.angle2.length; i++) {
                const px = x + size/2 + this.phaseSpaceData.angle2[i] * scaleX;
                const py = y + size/2 - this.phaseSpaceData.velocity2[i] * scaleY;
                
                if (i === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            }
            
            ctx.strokeStyle = this.trailColor;
            ctx.lineWidth = 1;
            ctx.stroke();
        }
        
        // Draw current point
        const px = x + size/2 + this.angle2 * size / (2 * Math.PI);
        const py = y + size/2 - this.angularVelocity2 * size / 20;
        ctx.beginPath();
        ctx.arc(px, py, 3, 0, 2 * Math.PI);
        ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--secondary-color');
        ctx.fill();
        
        // Draw labels
        ctx.font = '12px Arial';
        ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--text-color');
        ctx.fillText('Phase Space (θ₂, ω₂)', x + 5, y + 15);
        ctx.fillText('θ₂', x + size - 15, y + size/2 - 5);
        ctx.fillText('ω₂', x + size/2 + 5, y + 15);
    }
    
    drawLyapunovGraph(ctx) {
        // Draw Lyapunov exponent graph in bottom-right corner
        const size = 150;
        const margin = 10;
        const x = this.canvas.width - size - margin;
        const y = this.canvas.height - size - margin;
        
        // Draw background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.fillRect(x, y, size, size);
        
        // Draw horizontal axis (time)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, y + size - 20);
        ctx.lineTo(x + size, y + size - 20);
        ctx.stroke();
        
        // Draw Lyapunov history
        if (this.lyapunovHistory.length > 1) {
            ctx.beginPath();
            
            // Scale factors
            const maxTime = Math.max(10, this.time);
            const scaleX = size / maxTime;
            const scaleY = 30; // Scale for Lyapunov exponent
            
            for (let i = 0; i < this.lyapunovHistory.length; i++) {
                const point = this.lyapunovHistory[i];
                const px = x + point.time * scaleX;
                const py = y + size - 20 - point.value * scaleY;
                
                if (i === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            }
            
            ctx.strokeStyle = 'rgba(255, 100, 100, 0.8)';
            ctx.lineWidth = 2;
            ctx.stroke();
        }
        
        // Draw current Lyapunov exponent
        const px = x + this.time * size / Math.max(10, this.time);
        const py = y + size - 20 - this.lyapunovExponent * 30;
        ctx.beginPath();
        ctx.arc(px, py, 3, 0, 2 * Math.PI);
        ctx.fillStyle = 'rgba(255, 100, 100, 0.8)';
        ctx.fill();
        
        // Draw labels
        ctx.font = '12px Arial';
        ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--text-color');
        ctx.fillText('Lyapunov Exponent', x + 5, y + 15);
        ctx.fillText('Time', x + size - 30, y + size - 5);
        ctx.fillText('λ', x + 5, y + 30);
        
        // Draw zero line
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, y + size - 20);
        ctx.lineTo(x + size, y + size - 20);
        ctx.stroke();
    }
    
    getEnergy() {
        return {
            kinetic: this.values.find(v => v.id === 'kineticEnergy').value,
            potential: this.values.find(v => v.id === 'potentialEnergy').value,
            total: this.values.find(v => v.id === 'totalEnergy').value
        };
    }
}
