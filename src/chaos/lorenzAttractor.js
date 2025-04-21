/**
 * Lorenz Attractor Simulation
 * A physics simulation demonstrating chaotic behavior in deterministic systems
 * Implements the Lorenz system of coupled differential equations with RK4 integration
 */
class LorenzAttractor {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        
        // System parameters
        this.sigma = 10.0; // σ: Rate of convection
        this.rho = 28.0; // ρ: Temperature difference
        this.beta = 8.0 / 3.0; // β: Physical properties like fluid viscosity
        
        // Initial conditions
        this.x = 0.1;
        this.y = 0.0;
        this.z = 0.0;
        
        // For comparison trajectory (to demonstrate chaos)
        this.showComparison = true;
        this.comparisonX = this.x + 0.0001; // Slightly different initial condition
        this.comparisonY = this.y;
        this.comparisonZ = this.z;
        
        // Simulation settings
        this.timeStep = 0.005; // Integration time step
        this.simulationSpeed = 1.0; // Speed multiplier
        this.isPaused = false;
        this.time = 0;
        
        // Visualization settings
        this.viewAngleX = 0;
        this.viewAngleY = 0;
        this.zoom = 1.0;
        this.maxTrajectoryPoints = 2000; // Maximum number of points to display
        this.showProjections = true; // Show projections onto planes
        this.showAxes = true; // Show coordinate axes
        this.colorGradient = true; // Color trajectory by time
        
        // 3D visualization settings
        this.scale3D = 5; // Scale factor for 3D coordinates
        this.centerX = this.canvas.width / 2;
        this.centerY = this.canvas.height / 2;
        
        // Trajectories
        this.trajectory = [];
        this.comparisonTrajectory = [];
        
        // Time series data
        this.timeSeriesData = {
            time: [],
            x: [],
            y: [],
            z: []
        };
        this.maxTimeSeriesPoints = 500;
        
        // Lyapunov exponent calculation
        this.lyapunovExponent = 0;
        this.lyapunovHistory = [];
        this.maxLyapunovPoints = 200;
        this.lyapunovTime = 0;
        this.lyapunovDelta0 = 0.0001; // Initial separation
        this.lyapunovDelta = this.lyapunovDelta0;
        
        // Power spectrum data
        this.powerSpectrumData = {
            frequencies: [],
            amplitudes: []
        };
        this.powerSpectrumUpdateInterval = 5; // Update every 5 seconds
        this.lastPowerSpectrumUpdate = 0;
        
        // Bifurcation diagram data
        this.bifurcationData = {
            paramValues: [],
            attractorPoints: []
        };
        
        // Mouse interaction
        this.isDragging = false;
        this.lastMouseX = 0;
        this.lastMouseY = 0;
        
        // Define parameters for UI controls
        this.parameters = [
            {
                id: 'sigma',
                name: 'Sigma (σ)',
                min: 0.1,
                max: 30.0,
                step: 0.1,
                value: this.sigma,
                onChange: (value) => {
                    this.sigma = value;
                }
            },
            {
                id: 'rho',
                name: 'Rho (ρ)',
                min: 0.1,
                max: 100.0,
                step: 0.1,
                value: this.rho,
                onChange: (value) => {
                    this.rho = value;
                }
            },
            {
                id: 'beta',
                name: 'Beta (β)',
                min: 0.1,
                max: 10.0,
                step: 0.1,
                value: this.beta,
                onChange: (value) => {
                    this.beta = value;
                }
            },
            {
                id: 'initialX',
                name: 'Initial X',
                min: -20.0,
                max: 20.0,
                step: 0.1,
                value: this.x,
                onChange: (value) => {
                    this.x = value;
                    this.reset();
                }
            },
            {
                id: 'initialY',
                name: 'Initial Y',
                min: -20.0,
                max: 20.0,
                step: 0.1,
                value: this.y,
                onChange: (value) => {
                    this.y = value;
                    this.reset();
                }
            },
            {
                id: 'initialZ',
                name: 'Initial Z',
                min: -20.0,
                max: 20.0,
                step: 0.1,
                value: this.z,
                onChange: (value) => {
                    this.z = value;
                    this.reset();
                }
            },
            {
                id: 'timeStep',
                name: 'Time Step',
                min: 0.001,
                max: 0.01,
                step: 0.001,
                value: this.timeStep,
                onChange: (value) => {
                    this.timeStep = value;
                }
            },
            {
                id: 'simulationSpeed',
                name: 'Simulation Speed',
                min: 0.1,
                max: 5.0,
                step: 0.1,
                value: this.simulationSpeed,
                onChange: (value) => {
                    this.simulationSpeed = value;
                }
            },
            {
                id: 'showComparison',
                name: 'Show Comparison',
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
                id: 'showProjections',
                name: 'Show Projections',
                type: 'checkbox',
                value: this.showProjections,
                onChange: (value) => {
                    this.showProjections = value;
                }
            },
            {
                id: 'showAxes',
                name: 'Show Axes',
                type: 'checkbox',
                value: this.showAxes,
                onChange: (value) => {
                    this.showAxes = value;
                }
            },
            {
                id: 'colorGradient',
                name: 'Color Gradient',
                type: 'checkbox',
                value: this.colorGradient,
                onChange: (value) => {
                    this.colorGradient = value;
                }
            },
            {
                id: 'clearTrajectory',
                name: 'Clear Trajectory',
                type: 'button',
                onClick: () => {
                    this.clearTrajectory();
                    return 'Clear Trajectory';
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
            { id: 'x', name: 'X', value: this.x, precision: 3 },
            { id: 'y', name: 'Y', value: this.y, precision: 3 },
            { id: 'z', name: 'Z', value: this.z, precision: 3 },
            { id: 'time', name: 'Time', value: this.time, precision: 2 },
            { id: 'lyapunovExponent', name: 'Lyapunov Exponent', value: this.lyapunovExponent, precision: 5 },
            { id: 'divergenceTime', name: 'Divergence Time', value: 0, precision: 2 },
            { id: 'systemState', name: 'System State', value: 'Chaotic', precision: 0 }
        ];
        
        // Formulas
        this.formulas = [
            {
                title: 'Lorenz System',
                description: 'The system of coupled differential equations',
                equation: 'dx/dt = σ(y - x)\ndy/dt = x(ρ - z) - y\ndz/dt = xy - βz'
            },
            {
                title: 'Lyapunov Exponent',
                description: 'Measures the rate of separation of infinitesimally close trajectories',
                equation: 'λ = lim(t→∞) (1/t) ln(|δz(t)|/|δz₀|)'
            },
            {
                title: 'Critical Points',
                description: 'Fixed points of the system when derivatives are zero',
                equation: 'C₀ = (0, 0, 0) for ρ < 1\nC₁,₂ = (±√(β(ρ-1)), ±√(β(ρ-1)), ρ-1) for ρ > 1'
            },
            {
                title: 'Bifurcation',
                description: 'System undergoes qualitative changes at critical parameter values',
                equation: 'ρ = 1: Pitchfork bifurcation\nρ ≈ 24.74: Hopf bifurcation'
            }
        ];
        
        // Set up canvas interaction
        this.setupCanvasInteraction();
        
        // Initialize energy chart
        this.initEnergyChart();
        
        // Initialize the simulation
        this.reset();
    }
    
    setupCanvasInteraction() {
        // Mouse down event
        this.canvas.addEventListener('mousedown', (e) => {
            this.isDragging = true;
            this.lastMouseX = e.clientX;
            this.lastMouseY = e.clientY;
        });
        
        // Mouse move event
        this.canvas.addEventListener('mousemove', (e) => {
            if (!this.isDragging) return;
            
            // Calculate mouse movement
            const deltaX = e.clientX - this.lastMouseX;
            const deltaY = e.clientY - this.lastMouseY;
            
            // Update view angles
            this.viewAngleY += deltaX * 0.01;
            this.viewAngleX += deltaY * 0.01;
            
            // Limit vertical rotation to avoid gimbal lock
            this.viewAngleX = Math.max(-Math.PI/2 + 0.1, Math.min(Math.PI/2 - 0.1, this.viewAngleX));
            
            // Update last mouse position
            this.lastMouseX = e.clientX;
            this.lastMouseY = e.clientY;
        });
        
        // Mouse up event
        this.canvas.addEventListener('mouseup', () => {
            this.isDragging = false;
        });
        
        // Mouse leave event
        this.canvas.addEventListener('mouseleave', () => {
            this.isDragging = false;
        });
        
        // Mouse wheel event for zooming
        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            
            // Adjust zoom level
            if (e.deltaY < 0) {
                this.zoom *= 1.1; // Zoom in
            } else {
                this.zoom /= 1.1; // Zoom out
            }
            
            // Limit zoom range
            this.zoom = Math.max(0.1, Math.min(5, this.zoom));
        });
    }
    
    reset() {
        // Reset to initial conditions
        this.x = this.parameters.find(p => p.id === 'initialX').value;
        this.y = this.parameters.find(p => p.id === 'initialY').value;
        this.z = this.parameters.find(p => p.id === 'initialZ').value;
        
        // Reset time and trajectories
        this.time = 0;
        this.trajectory = [];
        this.comparisonTrajectory = [];
        
        // Reset time series data
        this.timeSeriesData = {
            time: [],
            x: [],
            y: [],
            z: []
        };
        
        // Reset Lyapunov calculation
        this.lyapunovExponent = 0;
        this.lyapunovTime = 0;
        this.lyapunovDelta = this.lyapunovDelta0;
        this.lyapunovHistory = [];
        
        // Reset comparison trajectory if enabled
        if (this.showComparison) {
            this.resetComparison();
        }
        
        // Reset power spectrum data
        this.powerSpectrumData = {
            frequencies: [],
            amplitudes: []
        };
        this.lastPowerSpectrumUpdate = 0;
        
        // Add initial point to trajectory
        this.trajectory.push({ x: this.x, y: this.y, z: this.z, time: this.time });
        
        // Add initial point to comparison trajectory if enabled
        if (this.showComparison) {
            this.comparisonTrajectory.push({ 
                x: this.comparisonX, 
                y: this.comparisonY, 
                z: this.comparisonZ, 
                time: this.time 
            });
        }
        
        // Add initial point to time series
        this.timeSeriesData.time.push(this.time);
        this.timeSeriesData.x.push(this.x);
        this.timeSeriesData.y.push(this.y);
        this.timeSeriesData.z.push(this.z);
    }
    
    resetComparison() {
        // Reset comparison trajectory with slightly different initial conditions
        this.comparisonX = this.x + this.lyapunovDelta0;
        this.comparisonY = this.y;
        this.comparisonZ = this.z;
        this.comparisonTrajectory = [];
        
        // Add initial point to comparison trajectory
        if (this.trajectory.length > 0) {
            this.comparisonTrajectory.push({ 
                x: this.comparisonX, 
                y: this.comparisonY, 
                z: this.comparisonZ, 
                time: this.time 
            });
        }
    }
    
    clearTrajectory() {
        // Keep only the current point
        if (this.trajectory.length > 0) {
            const currentPoint = this.trajectory[this.trajectory.length - 1];
            this.trajectory = [currentPoint];
        }
        
        // Same for comparison trajectory
        if (this.comparisonTrajectory.length > 0) {
            const currentPoint = this.comparisonTrajectory[this.comparisonTrajectory.length - 1];
            this.comparisonTrajectory = [currentPoint];
        }
        
        // Reset time series to recent data only
        const keepPoints = 50;
        if (this.timeSeriesData.time.length > keepPoints) {
            this.timeSeriesData.time = this.timeSeriesData.time.slice(-keepPoints);
            this.timeSeriesData.x = this.timeSeriesData.x.slice(-keepPoints);
            this.timeSeriesData.y = this.timeSeriesData.y.slice(-keepPoints);
            this.timeSeriesData.z = this.timeSeriesData.z.slice(-keepPoints);
        }
        
        // Reset Lyapunov history
        this.lyapunovHistory = [];
    }
    
    onResize(width, height) {
        // Update center point when canvas is resized
        this.centerX = width / 2;
        this.centerY = height / 2;
    }
    
    update(dt) {
        if (this.isPaused) return;
        
        // Apply simulation speed
        const scaledDt = dt * this.simulationSpeed;
        
        // Use fixed time step for integration
        const steps = Math.ceil(scaledDt / this.timeStep);
        const fixedDt = this.timeStep;
        
        for (let i = 0; i < steps; i++) {
            // Update main trajectory using RK4 integration
            this.updateTrajectory(fixedDt);
            
            // Update comparison trajectory if enabled
            if (this.showComparison) {
                this.updateComparisonTrajectory(fixedDt);
                
                // Calculate Lyapunov exponent
                this.calculateLyapunovExponent(fixedDt);
            }
            
            // Update time
            this.time += fixedDt;
        }
        
        // Store time series data (less frequently to avoid too many points)
        if (this.time % (this.timeStep * 10) < this.timeStep) {
            this.timeSeriesData.time.push(this.time);
            this.timeSeriesData.x.push(this.x);
            this.timeSeriesData.y.push(this.y);
            this.timeSeriesData.z.push(this.z);
            
            // Limit time series data points
            if (this.timeSeriesData.time.length > this.maxTimeSeriesPoints) {
                this.timeSeriesData.time.shift();
                this.timeSeriesData.x.shift();
                this.timeSeriesData.y.shift();
                this.timeSeriesData.z.shift();
            }
        }
        
        // Update power spectrum periodically
        if (this.time - this.lastPowerSpectrumUpdate > this.powerSpectrumUpdateInterval) {
            this.calculatePowerSpectrum();
            this.lastPowerSpectrumUpdate = this.time;
        }
        
        // Determine system state
        this.determineSystemState();
        
        // Update displayed values
        this.values.find(v => v.id === 'x').value = this.x;
        this.values.find(v => v.id === 'y').value = this.y;
        this.values.find(v => v.id === 'z').value = this.z;
        this.values.find(v => v.id === 'time').value = this.time;
        this.values.find(v => v.id === 'lyapunovExponent').value = this.lyapunovExponent;
        
        // Calculate time to divergence (when Lyapunov delta exceeds 1.0)
        if (this.lyapunovExponent > 0) {
            const divergenceTime = Math.log(1.0 / this.lyapunovDelta0) / this.lyapunovExponent;
            this.values.find(v => v.id === 'divergenceTime').value = divergenceTime;
        }
        
        // Update energy chart
        this.updateEnergyChart();
        
        // Draw the simulation
        this.draw();
    }
    
    updateTrajectory(dt) {
        // Implement 4th order Runge-Kutta method for the Lorenz system
        const k1 = this.derivatives(this.x, this.y, this.z);
        const k2 = this.derivatives(
            this.x + k1.dx * dt/2,
            this.y + k1.dy * dt/2,
            this.z + k1.dz * dt/2
        );
        const k3 = this.derivatives(
            this.x + k2.dx * dt/2,
            this.y + k2.dy * dt/2,
            this.z + k2.dz * dt/2
        );
        const k4 = this.derivatives(
            this.x + k3.dx * dt,
            this.y + k3.dy * dt,
            this.z + k3.dz * dt
        );
        
        // Update state variables
        this.x += (k1.dx + 2*k2.dx + 2*k3.dx + k4.dx) * dt/6;
        this.y += (k1.dy + 2*k2.dy + 2*k3.dy + k4.dy) * dt/6;
        this.z += (k1.dz + 2*k2.dz + 2*k3.dz + k4.dz) * dt/6;
        
        // Add point to trajectory
        this.trajectory.push({ x: this.x, y: this.y, z: this.z, time: this.time });
        
        // Limit trajectory length
        if (this.trajectory.length > this.maxTrajectoryPoints) {
            this.trajectory.shift();
        }
    }
    
    updateComparisonTrajectory(dt) {
        // Same RK4 method for comparison trajectory
        const k1 = this.derivatives(this.comparisonX, this.comparisonY, this.comparisonZ);
        const k2 = this.derivatives(
            this.comparisonX + k1.dx * dt/2,
            this.comparisonY + k1.dy * dt/2,
            this.comparisonZ + k1.dz * dt/2
        );
        const k3 = this.derivatives(
            this.comparisonX + k2.dx * dt/2,
            this.comparisonY + k2.dy * dt/2,
            this.comparisonZ + k2.dz * dt/2
        );
        const k4 = this.derivatives(
            this.comparisonX + k3.dx * dt,
            this.comparisonY + k3.dy * dt,
            this.comparisonZ + k3.dz * dt
        );
        
        // Update comparison state variables
        this.comparisonX += (k1.dx + 2*k2.dx + 2*k3.dx + k4.dx) * dt/6;
        this.comparisonY += (k1.dy + 2*k2.dy + 2*k3.dy + k4.dy) * dt/6;
        this.comparisonZ += (k1.dz + 2*k2.dz + 2*k3.dz + k4.dz) * dt/6;
        
        // Add point to comparison trajectory
        this.comparisonTrajectory.push({ 
            x: this.comparisonX, 
            y: this.comparisonY, 
            z: this.comparisonZ, 
            time: this.time 
        });
        
        // Limit comparison trajectory length
        if (this.comparisonTrajectory.length > this.maxTrajectoryPoints) {
            this.comparisonTrajectory.shift();
        }
    }
    
    derivatives(x, y, z) {
        // Lorenz system of equations
        const dx = this.sigma * (y - x);
        const dy = x * (this.rho - z) - y;
        const dz = x * y - this.beta * z;
        
        return { dx, dy, dz };
    }
    
    calculateLyapunovExponent(dt) {
        // Update Lyapunov time
        this.lyapunovTime += dt;
        
        // Calculate phase space distance between main and comparison trajectories
        const dx = this.x - this.comparisonX;
        const dy = this.y - this.comparisonY;
        const dz = this.z - this.comparisonZ;
        
        // Calculate Euclidean distance in phase space
        this.lyapunovDelta = Math.sqrt(dx*dx + dy*dy + dz*dz);
        
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
            
            // Renormalize the comparison trajectory to maintain small separation
            const scale = this.lyapunovDelta0 / this.lyapunovDelta;
            this.comparisonX = this.x - dx * scale;
            this.comparisonY = this.y - dy * scale;
            this.comparisonZ = this.z - dz * scale;
            
            // Reset Lyapunov time for next calculation
            this.lyapunovTime = 0;
        }
    }
    
    calculatePowerSpectrum() {
        // Calculate power spectrum using FFT on time series data
        // This is a simplified implementation
        
        // Need at least 64 points for meaningful FFT
        if (this.timeSeriesData.x.length < 64) return;
        
        // Use the x component for simplicity
        const signal = this.timeSeriesData.x.slice(-64);
        
        // Simple FFT implementation (in real applications, use a library)
        const fft = this.simpleFFT(signal);
        
        // Calculate frequencies
        const sampleRate = 1 / this.timeStep;
        const frequencies = [];
        const amplitudes = [];
        
        for (let i = 0; i < fft.length / 2; i++) {
            frequencies.push(i * sampleRate / fft.length);
            amplitudes.push(Math.sqrt(fft[i].re * fft[i].re + fft[i].im * fft[i].im));
        }
        
        this.powerSpectrumData.frequencies = frequencies;
        this.powerSpectrumData.amplitudes = amplitudes;
    }
    
    simpleFFT(signal) {
        // Very simplified FFT implementation
        // In a real application, use a library like fft.js
        const n = signal.length;
        
        // Base case
        if (n === 1) {
            return [{ re: signal[0], im: 0 }];
        }
        
        // Check if n is a power of 2
        if (n % 2 !== 0) {
            throw new Error('FFT length must be a power of 2');
        }
        
        // Split signal into even and odd indices
        const even = [];
        const odd = [];
        for (let i = 0; i < n; i += 2) {
            even.push(signal[i]);
            odd.push(signal[i + 1]);
        }
        
        // Recursive FFT on even and odd parts
        const evenFFT = this.simpleFFT(even);
        const oddFFT = this.simpleFFT(odd);
        
        // Combine results
        const result = new Array(n);
        for (let k = 0; k < n / 2; k++) {
            const theta = -2 * Math.PI * k / n;
            const re = Math.cos(theta);
            const im = Math.sin(theta);
            
            // Complex multiplication: oddFFT[k] * e^(-2πik/n)
            const oddRe = oddFFT[k].re * re - oddFFT[k].im * im;
            const oddIm = oddFFT[k].re * im + oddFFT[k].im * re;
            
            // First half: evenFFT[k] + oddFFT[k] * e^(-2πik/n)
            result[k] = {
                re: evenFFT[k].re + oddRe,
                im: evenFFT[k].im + oddIm
            };
            
            // Second half: evenFFT[k] - oddFFT[k] * e^(-2πik/n)
            result[k + n/2] = {
                re: evenFFT[k].re - oddRe,
                im: evenFFT[k].im - oddIm
            };
        }
        
        return result;
    }
    
    determineSystemState() {
        // Determine the current state of the system based on parameters and behavior
        
        // Check for fixed points
        if (this.rho < 1) {
            // Below first bifurcation, system has a stable fixed point at origin
            this.values.find(v => v.id === 'systemState').value = 'Stable (Origin)';
            return;
        }
        
        if (this.rho < 24.74) {
            // Between first and Hopf bifurcation, system has two stable fixed points
            this.values.find(v => v.id === 'systemState').value = 'Stable (Two Points)';
            return;
        }
        
        // Check Lyapunov exponent for chaos
        if (this.lyapunovExponent > 0.01) {
            this.values.find(v => v.id === 'systemState').value = 'Chaotic';
            return;
        }
        
        // Default
        this.values.find(v => v.id === 'systemState').value = 'Transitional';
    }
    
    project3Dto2D(x, y, z) {
        // Apply rotation around Y axis
        const cosY = Math.cos(this.viewAngleY);
        const sinY = Math.sin(this.viewAngleY);
        const x1 = x * cosY - z * sinY;
        const z1 = x * sinY + z * cosY;
        
        // Apply rotation around X axis
        const cosX = Math.cos(this.viewAngleX);
        const sinX = Math.sin(this.viewAngleX);
        const y2 = y * cosX - z1 * sinX;
        const z2 = y * sinX + z1 * cosX;
        
        // Apply scale and zoom
        const scale = this.scale3D * this.zoom;
        
        // Project to 2D (simple orthographic projection)
        return {
            x: this.centerX + x1 * scale,
            y: this.centerY + y2 * scale,
            z: z2 // Keep z for depth sorting
        };
    }
    
    getColorForTime(time) {
        // Generate a color based on time (for trajectory gradient)
        if (!this.colorGradient) {
            return 'rgba(255, 255, 255, 0.8)';
        }
        
        // Normalize time to [0, 1] based on trajectory length
        const maxTime = this.trajectory.length > 0 ? 
            this.trajectory[this.trajectory.length - 1].time : this.time;
        const minTime = this.trajectory.length > 0 ? 
            this.trajectory[0].time : 0;
        
        const normalizedTime = (time - minTime) / (maxTime - minTime || 1);
        
        // Rainbow gradient
        const hue = normalizedTime * 270; // 0 to 270 degrees in HSL
        return `hsla(${hue}, 100%, 50%, 0.8)`;
    }
    
    draw() {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw coordinate axes if enabled
        if (this.showAxes) {
            this.drawAxes(ctx);
        }
        
        // Draw projections if enabled
        if (this.showProjections) {
            this.drawProjections(ctx);
        }
        
        // Draw main trajectory
        this.drawTrajectory(ctx, this.trajectory, false);
        
        // Draw comparison trajectory if enabled
        if (this.showComparison && this.comparisonTrajectory.length > 0) {
            this.drawTrajectory(ctx, this.comparisonTrajectory, true);
        }
        
        // Draw time series graph
        this.drawTimeSeries(ctx);
        
        // Draw Lyapunov exponent graph
        this.drawLyapunovGraph(ctx);
        
        // Draw power spectrum
        this.drawPowerSpectrum(ctx);
        
        // Draw info text
        ctx.font = '14px Arial';
        ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--text-color');
        ctx.fillText(`Time: ${this.time.toFixed(2)}`, 10, 20);
        ctx.fillText(`Parameters: σ=${this.sigma.toFixed(1)}, ρ=${this.rho.toFixed(1)}, β=${this.beta.toFixed(2)}`, 10, 40);
        ctx.fillText(`State: ${this.values.find(v => v.id === 'systemState').value}`, 10, 60);
        
        // Draw current point coordinates
        ctx.fillText(`Current: (${this.x.toFixed(2)}, ${this.y.toFixed(2)}, ${this.z.toFixed(2)})`, 10, 80);
        
        // Draw legend
        ctx.fillStyle = 'rgba(0, 255, 255, 0.8)';
        ctx.fillRect(10, 100, 15, 15);
        ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--text-color');
        ctx.fillText('Main Trajectory', 30, 112);
        
        if (this.showComparison) {
            ctx.fillStyle = 'rgba(255, 100, 100, 0.8)';
            ctx.fillRect(10, 125, 15, 15);
            ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--text-color');
            ctx.fillText('Comparison (Δx₀ = 0.0001)', 30, 137);
        }
        
        // Draw controls help
        ctx.fillText('Drag to rotate | Scroll to zoom', this.canvas.width - 200, this.canvas.height - 20);
    }
    
    drawAxes(ctx) {
        // Draw coordinate axes
        const axisLength = 20 * this.scale3D * this.zoom;
        
        // X axis (red)
        const xStart = this.project3Dto2D(0, 0, 0);
        const xEnd = this.project3Dto2D(axisLength / this.scale3D / this.zoom, 0, 0);
        ctx.beginPath();
        ctx.moveTo(xStart.x, xStart.y);
        ctx.lineTo(xEnd.x, xEnd.y);
        ctx.strokeStyle = 'rgba(255, 0, 0, 0.8)';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
        ctx.fillText('X', xEnd.x + 5, xEnd.y);
        
        // Y axis (green)
        const yStart = this.project3Dto2D(0, 0, 0);
        const yEnd = this.project3Dto2D(0, axisLength / this.scale3D / this.zoom, 0);
        ctx.beginPath();
        ctx.moveTo(yStart.x, yStart.y);
        ctx.lineTo(yEnd.x, yEnd.y);
        ctx.strokeStyle = 'rgba(0, 255, 0, 0.8)';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = 'rgba(0, 255, 0, 0.8)';
        ctx.fillText('Y', yEnd.x + 5, yEnd.y);
        
        // Z axis (blue)
        const zStart = this.project3Dto2D(0, 0, 0);
        const zEnd = this.project3Dto2D(0, 0, axisLength / this.scale3D / this.zoom);
        ctx.beginPath();
        ctx.moveTo(zStart.x, zStart.y);
        ctx.lineTo(zEnd.x, zEnd.y);
        ctx.strokeStyle = 'rgba(0, 0, 255, 0.8)';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = 'rgba(0, 0, 255, 0.8)';
        ctx.fillText('Z', zEnd.x + 5, zEnd.y);
        
        // Origin
        ctx.beginPath();
        ctx.arc(xStart.x, xStart.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = 'white';
        ctx.fill();
    }
    
    drawProjections(ctx) {
        // Draw projections onto the three principal planes
        
        // Only draw projections if we have enough points
        if (this.trajectory.length < 2) return;
        
        // XY projection (bottom plane)
        ctx.beginPath();
        for (let i = 0; i < this.trajectory.length; i++) {
            const point = this.trajectory[i];
            const projected = this.project3Dto2D(point.x, point.y, 0);
            
            if (i === 0) {
                ctx.moveTo(projected.x, projected.y);
            } else {
                ctx.lineTo(projected.x, projected.y);
            }
        }
        ctx.strokeStyle = 'rgba(0, 0, 255, 0.3)';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // XZ projection (back plane)
        ctx.beginPath();
        for (let i = 0; i < this.trajectory.length; i++) {
            const point = this.trajectory[i];
            const projected = this.project3Dto2D(point.x, 0, point.z);
            
            if (i === 0) {
                ctx.moveTo(projected.x, projected.y);
            } else {
                ctx.lineTo(projected.x, projected.y);
            }
        }
        ctx.strokeStyle = 'rgba(0, 255, 0, 0.3)';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // YZ projection (side plane)
        ctx.beginPath();
        for (let i = 0; i < this.trajectory.length; i++) {
            const point = this.trajectory[i];
            const projected = this.project3Dto2D(0, point.y, point.z);
            
            if (i === 0) {
                ctx.moveTo(projected.x, projected.y);
            } else {
                ctx.lineTo(projected.x, projected.y);
            }
        }
        ctx.strokeStyle = 'rgba(255, 0, 0, 0.3)';
        ctx.lineWidth = 1;
        ctx.stroke();
    }
    
    drawTrajectory(ctx, trajectory, isComparison) {
        // Draw 3D trajectory
        
        // Only draw if we have enough points
        if (trajectory.length < 2) return;
        
        // Project all points to 2D
        const projectedPoints = trajectory.map(point => ({
            ...this.project3Dto2D(point.x, point.y, point.z),
            time: point.time
        }));
        
        // Sort points by z for proper depth
        projectedPoints.sort((a, b) => a.z - b.z);
        
        // Draw trajectory segments with color based on time
        for (let i = 0; i < projectedPoints.length - 1; i++) {
            const p1 = projectedPoints[i];
            const p2 = projectedPoints[i + 1];
            
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            
            if (isComparison) {
                ctx.strokeStyle = 'rgba(255, 100, 100, 0.8)';
            } else {
                ctx.strokeStyle = this.getColorForTime(p1.time);
            }
            
            // Line width based on depth
            const depth = (p1.z + 20) / 40; // Normalize to [0, 1]
            ctx.lineWidth = 1 + depth;
            
            ctx.stroke();
        }
        
        // Draw current point (last point in trajectory)
        if (trajectory.length > 0) {
            const currentPoint = trajectory[trajectory.length - 1];
            const projected = this.project3Dto2D(currentPoint.x, currentPoint.y, currentPoint.z);
            
            ctx.beginPath();
            ctx.arc(projected.x, projected.y, 5, 0, Math.PI * 2);
            
            if (isComparison) {
                ctx.fillStyle = 'rgba(255, 100, 100, 0.8)';
            } else {
                ctx.fillStyle = 'rgba(0, 255, 255, 0.8)';
            }
            
            ctx.fill();
        }
    }
    
    drawTimeSeries(ctx) {
        // Draw time series graph in bottom-left corner
        const width = 200;
        const height = 150;
        const x = 10;
        const y = this.canvas.height - height - 10;
        
        // Draw background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(x, y, width, height);
        
        // Draw axes
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, y + height/2);
        ctx.lineTo(x + width, y + height/2);
        ctx.stroke();
        
        // Draw time series if we have enough data
        if (this.timeSeriesData.time.length > 1) {
            // X component (red)
            this.drawTimeSeries1D(ctx, this.timeSeriesData.x, 'rgba(255, 0, 0, 0.8)', x, y, width, height);
            
            // Y component (green)
            this.drawTimeSeries1D(ctx, this.timeSeriesData.y, 'rgba(0, 255, 0, 0.8)', x, y, width, height);
            
            // Z component (blue)
            this.drawTimeSeries1D(ctx, this.timeSeriesData.z, 'rgba(0, 0, 255, 0.8)', x, y, width, height);
        }
        
        // Draw labels
        ctx.font = '12px Arial';
        ctx.fillStyle = 'white';
        ctx.fillText('Time Series', x + 5, y + 15);
        ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
        ctx.fillText('X', x + 5, y + 30);
        ctx.fillStyle = 'rgba(0, 255, 0, 0.8)';
        ctx.fillText('Y', x + 20, y + 30);
        ctx.fillStyle = 'rgba(0, 0, 255, 0.8)';
        ctx.fillText('Z', x + 35, y + 30);
    }
    
    drawTimeSeries1D(ctx, data, color, x, y, width, height) {
        if (data.length < 2) return;
        
        // Find min and max for scaling
        const min = Math.min(...data);
        const max = Math.max(...data);
        const range = Math.max(1, max - min) * 1.1; // Add 10% padding
        
        // Draw time series
        ctx.beginPath();
        
        for (let i = 0; i < data.length; i++) {
            const px = x + (i / (data.length - 1)) * width;
            const py = y + height/2 - ((data[i] - (min + max)/2) / range) * (height * 0.8);
            
            if (i === 0) {
                ctx.moveTo(px, py);
            } else {
                ctx.lineTo(px, py);
            }
        }
        
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.stroke();
    }
    
    drawLyapunovGraph(ctx) {
        // Draw Lyapunov exponent graph in top-left corner
        const width = 200;
        const height = 100;
        const x = 10;
        const y = 150;
        
        // Draw background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(x, y, width, height);
        
        // Draw horizontal axis (zero line)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, y + height/2);
        ctx.lineTo(x + width, y + height/2);
        ctx.stroke();
        
        // Draw Lyapunov history
        if (this.lyapunovHistory.length > 1) {
            ctx.beginPath();
            
            for (let i = 0; i < this.lyapunovHistory.length; i++) {
                const point = this.lyapunovHistory[i];
                const px = x + (i / (this.lyapunovHistory.length - 1)) * width;
                const py = y + height/2 - point.value * 20; // Scale for visibility
                
                if (i === 0) {
                    ctx.moveTo(px, py);
                } else {
                    ctx.lineTo(px, py);
                }
            }
            
            ctx.strokeStyle = 'rgba(255, 255, 0, 0.8)';
            ctx.lineWidth = 2;
            ctx.stroke();
        }
        
        // Draw current Lyapunov exponent
        ctx.beginPath();
        const px = x + width - 5;
        const py = y + height/2 - this.lyapunovExponent * 20;
        ctx.arc(px, py, 3, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 0, 0.8)';
        ctx.fill();
        
        // Draw labels
        ctx.font = '12px Arial';
        ctx.fillStyle = 'white';
        ctx.fillText('Lyapunov Exponent', x + 5, y + 15);
        ctx.fillText(`λ = ${this.lyapunovExponent.toFixed(5)}`, x + 5, y + 30);
    }
    
    drawPowerSpectrum(ctx) {
        // Draw power spectrum in bottom-right corner
        const width = 200;
        const height = 100;
        const x = this.canvas.width - width - 10;
        const y = this.canvas.height - height - 10;
        
        // Draw background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(x, y, width, height);
        
        // Draw power spectrum if we have data
        if (this.powerSpectrumData.frequencies.length > 0) {
            ctx.beginPath();
            
            // Find max amplitude for scaling
            const maxAmp = Math.max(...this.powerSpectrumData.amplitudes, 0.1);
            
            for (let i = 0; i < this.powerSpectrumData.frequencies.length; i++) {
                const px = x + (i / (this.powerSpectrumData.frequencies.length - 1)) * width;
                const py = y + height - (this.powerSpectrumData.amplitudes[i] / maxAmp) * height;
                
                if (i === 0) {
                    ctx.moveTo(px, py);
                } else {
                    ctx.lineTo(px, py);
                }
            }
            
            ctx.strokeStyle = 'rgba(0, 255, 255, 0.8)';
            ctx.lineWidth = 1.5;
            ctx.stroke();
        }
        
        // Draw labels
        ctx.font = '12px Arial';
        ctx.fillStyle = 'white';
        ctx.fillText('Power Spectrum', x + 5, y + 15);
        ctx.fillText('Frequency', x + width - 60, y + height - 5);
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
                labels: this.timeSeriesData.time,
                datasets: [
                    {
                        label: 'X',
                        data: this.timeSeriesData.x,
                        borderColor: 'rgba(255, 0, 0, 0.8)',
                        tension: 0.4,
                        fill: false
                    },
                    {
                        label: 'Y',
                        data: this.timeSeriesData.y,
                        borderColor: 'rgba(0, 255, 0, 0.8)',
                        tension: 0.4,
                        fill: false
                    },
                    {
                        label: 'Z',
                        data: this.timeSeriesData.z,
                        borderColor: 'rgba(0, 0, 255, 0.8)',
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
                            text: 'Time'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Value'
                        }
                    }
                }
            }
        });
    }
    
    updateEnergyChart() {
        if (!this.energyChart) return;
        
        // Update chart data
        this.energyChart.data.labels = this.timeSeriesData.time;
        this.energyChart.data.datasets[0].data = this.timeSeriesData.x;
        this.energyChart.data.datasets[1].data = this.timeSeriesData.y;
        this.energyChart.data.datasets[2].data = this.timeSeriesData.z;
        
        // Update chart
        this.energyChart.update();
    }
    
    getEnergy() {
        // For compatibility with the energy chart system
        // In Lorenz system, we don't have a direct energy equivalent
        // Return the state variables instead
        return {
            kinetic: this.x,
            potential: this.y,
            total: this.z
        };
    }
}
