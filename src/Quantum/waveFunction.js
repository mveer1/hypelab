class WaveFunction {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        
        // Physics constants
        this.hbar = 1.0; // Reduced Planck's constant (normalized units)
        this.mass = 1.0; // Particle mass
        this.dx = 0.1; // Spatial grid spacing
        this.dt = 0.001; // Time step
        
        // Simulation parameters
        this.gridSize = 512; // Number of grid points
        this.potentialType = 'barrier'; // Default potential type
        this.potentialHeight = 5.0; // Height of potential barrier/well
        this.potentialWidth = 0.2; // Width of potential (fraction of grid)
        this.potentialCenter = 0.5; // Center position of potential (fraction of grid)
        this.boundaryType = 'infinite'; // Boundary conditions
        
        // Wave packet parameters
        this.packetCenter = 0.2; // Initial position (fraction of grid)
        this.packetWidth = 0.05; // Width of wave packet (fraction of grid)
        this.packetMomentum = 20.0; // Initial momentum
        this.packetEnergy = this.packetMomentum**2 / (2 * this.mass); // Initial energy
        
        // Simulation state
        this.time = 0;
        this.isPaused = false;
        this.isCustomPotential = false;
        this.customPotential = new Array(this.gridSize).fill(0);
        this.isDrawingPotential = false;
        this.lastDrawX = 0;
        
        // Initialize arrays for wave function and potential
        this.realPart = new Array(this.gridSize).fill(0);
        this.imagPart = new Array(this.gridSize).fill(0);
        this.potential = new Array(this.gridSize).fill(0);
        
        // Arrays for visualization and analysis
        this.probabilityDensity = new Array(this.gridSize).fill(0);
        this.positionExpectation = [];
        this.momentumExpectation = [];
        this.energySpectrum = [];
        this.timePoints = [];
        
        // Visualization settings
        this.colorScale = [
            { r: 0, g: 0, b: 255 },    // Blue (low probability)
            { r: 0, g: 255, b: 255 },   // Cyan
            { r: 0, g: 255, b: 0 },     // Green
            { r: 255, g: 255, b: 0 },   // Yellow
            { r: 255, g: 0, b: 0 }      // Red (high probability)
        ];
        
        // Define parameters for UI controls
        this.parameters = [
            {
                id: 'potentialType',
                name: 'Potential Type',
                type: 'select',
                options: [
                    { value: 'none', label: 'Free Particle' },
                    { value: 'barrier', label: 'Potential Barrier' },
                    { value: 'well', label: 'Potential Well' },
                    { value: 'harmonic', label: 'Harmonic Oscillator' },
                    { value: 'step', label: 'Step Potential' },
                    { value: 'custom', label: 'Custom Potential' }
                ],
                value: this.potentialType,
                onChange: (value) => {
                    this.potentialType = value;
                    this.isCustomPotential = (value === 'custom');
                    this.updatePotential();
                    this.reset();
                }
            },
            {
                id: 'potentialHeight',
                name: 'Potential Height',
                min: 0,
                max: 20,
                step: 0.1,
                value: this.potentialHeight,
                onChange: (value) => {
                    this.potentialHeight = value;
                    if (!this.isCustomPotential) {
                        this.updatePotential();
                    }
                }
            },
            {
                id: 'potentialWidth',
                name: 'Potential Width',
                min: 0.05,
                max: 0.5,
                step: 0.01,
                value: this.potentialWidth,
                onChange: (value) => {
                    this.potentialWidth = value;
                    if (!this.isCustomPotential) {
                        this.updatePotential();
                    }
                }
            },
            {
                id: 'potentialCenter',
                name: 'Potential Position',
                min: 0.1,
                max: 0.9,
                step: 0.01,
                value: this.potentialCenter,
                onChange: (value) => {
                    this.potentialCenter = value;
                    if (!this.isCustomPotential) {
                        this.updatePotential();
                    }
                }
            },
            {
                id: 'boundaryType',
                name: 'Boundary Conditions',
                type: 'select',
                options: [
                    { value: 'infinite', label: 'Infinite Well' },
                    { value: 'periodic', label: 'Periodic' }
                ],
                value: this.boundaryType,
                onChange: (value) => {
                    this.boundaryType = value;
                    this.reset();
                }
            },
            {
                id: 'mass',
                name: 'Particle Mass',
                min: 0.1,
                max: 5,
                step: 0.1,
                value: this.mass,
                onChange: (value) => {
                    this.mass = value;
                    this.packetEnergy = this.packetMomentum**2 / (2 * this.mass);
                    this.reset();
                }
            },
            {
                id: 'hbar',
                name: 'Planck\'s Constant',
                min: 0.1,
                max: 2,
                step: 0.1,
                value: this.hbar,
                onChange: (value) => {
                    this.hbar = value;
                    this.reset();
                }
            },
            {
                id: 'packetCenter',
                name: 'Initial Position',
                min: 0.1,
                max: 0.9,
                step: 0.01,
                value: this.packetCenter,
                onChange: (value) => {
                    this.packetCenter = value;
                    this.reset();
                }
            },
            {
                id: 'packetWidth',
                name: 'Wave Packet Width',
                min: 0.01,
                max: 0.2,
                step: 0.01,
                value: this.packetWidth,
                onChange: (value) => {
                    this.packetWidth = value;
                    this.reset();
                }
            },
            {
                id: 'packetMomentum',
                name: 'Initial Momentum',
                min: -50,
                max: 50,
                step: 1,
                value: this.packetMomentum,
                onChange: (value) => {
                    this.packetMomentum = value;
                    this.packetEnergy = this.packetMomentum**2 / (2 * this.mass);
                    this.reset();
                }
            },
            {
                id: 'clearCustom',
                name: 'Clear Custom Potential',
                type: 'button',
                onClick: () => {
                    if (this.isCustomPotential) {
                        this.customPotential = new Array(this.gridSize).fill(0);
                        this.potential = [...this.customPotential];
                    }
                    return 'Clear';
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
            { id: 'time', name: 'Time', value: 0, precision: 3 },
            { id: 'energy', name: 'Energy', value: 0, precision: 3 },
            { id: 'position', name: 'Position (Expected)', value: 0, precision: 3 },
            { id: 'momentum', name: 'Momentum (Expected)', value: 0, precision: 3 },
            { id: 'positionUncertainty', name: 'Position Uncertainty', value: 0, precision: 3 },
            { id: 'momentumUncertainty', name: 'Momentum Uncertainty', value: 0, precision: 3 },
            { id: 'uncertaintyProduct', name: 'Δx·Δp', value: 0, precision: 3 }
        ];
        
        // Formulas
        this.formulas = [
            {
                title: 'Schrödinger Equation',
                description: 'The fundamental equation of quantum mechanics',
                equation: 'iℏ∂ψ/∂t = -ℏ²/2m ∇²ψ + V(x)ψ'
            },
            {
                title: 'Probability Density',
                description: 'The probability of finding the particle at position x',
                equation: 'P(x) = |ψ(x)|² = ψ*(x)ψ(x)'
            },
            {
                title: 'Normalization',
                description: 'The total probability must equal 1',
                equation: '∫|ψ(x)|²dx = 1'
            },
            {
                title: 'Uncertainty Principle',
                description: 'Position and momentum cannot be simultaneously known with perfect precision',
                equation: 'ΔxΔp ≥ ℏ/2'
            }
        ];
        
        // Initialize simulation
        this.setupCanvasInteraction();
        this.updatePotential();
        this.reset();
        this.initEnergyChart();
    }
    
    setupCanvasInteraction() {
        // Add event listeners for drawing custom potentials
        this.canvas.addEventListener('mousedown', (e) => {
            if (!this.isCustomPotential) return;
            
            this.isDrawingPotential = true;
            const rect = this.canvas.getBoundingClientRect();
            const x = Math.floor((e.clientX - rect.left) / rect.width * this.gridSize);
            this.lastDrawX = x;
            
            // Set potential at this point
            this.customPotential[x] = this.potentialHeight;
            this.potential = [...this.customPotential];
        });
        
        this.canvas.addEventListener('mousemove', (e) => {
            if (!this.isDrawingPotential) return;
            
            const rect = this.canvas.getBoundingClientRect();
            const x = Math.floor((e.clientX - rect.left) / rect.width * this.gridSize);
            
            // Interpolate between last position and current position
            if (x !== this.lastDrawX) {
                const start = Math.min(this.lastDrawX, x);
                const end = Math.max(this.lastDrawX, x);
                for (let i = start; i <= end; i++) {
                    this.customPotential[i] = this.potentialHeight;
                }
                this.potential = [...this.customPotential];
                this.lastDrawX = x;
            }
        });
        
        this.canvas.addEventListener('mouseup', () => {
            this.isDrawingPotential = false;
        });
        
        this.canvas.addEventListener('mouseleave', () => {
            this.isDrawingPotential = false;
        });
    }
    
    updatePotential() {
        // Reset potential array
        this.potential = new Array(this.gridSize).fill(0);
        
        if (this.isCustomPotential) {
            this.potential = [...this.customPotential];
            return;
        }
        
        const centerIdx = Math.floor(this.potentialCenter * this.gridSize);
        const halfWidth = Math.floor(this.potentialWidth * this.gridSize / 2);
        
        switch (this.potentialType) {
            case 'barrier':
                // Create potential barrier
                for (let i = centerIdx - halfWidth; i <= centerIdx + halfWidth; i++) {
                    if (i >= 0 && i < this.gridSize) {
                        this.potential[i] = this.potentialHeight;
                    }
                }
                break;
                
            case 'well':
                // Create potential well (negative potential)
                for (let i = centerIdx - halfWidth; i <= centerIdx + halfWidth; i++) {
                    if (i >= 0 && i < this.gridSize) {
                        this.potential[i] = -this.potentialHeight;
                    }
                }
                break;
                
            case 'harmonic':
                // Create harmonic oscillator potential (quadratic)
                const k = this.potentialHeight / ((this.gridSize/2) ** 2); // Spring constant
                for (let i = 0; i < this.gridSize; i++) {
                    const x = i - this.gridSize/2;
                    this.potential[i] = k * x * x / 2;
                }
                break;
                
            case 'step':
                // Create step potential
                for (let i = centerIdx; i < this.gridSize; i++) {
                    this.potential[i] = this.potentialHeight;
                }
                break;
                
            case 'none':
                // Free particle, no potential
                break;
        }
    }
    
    initializeWavePacket() {
        // Initialize Gaussian wave packet
        const centerIdx = Math.floor(this.packetCenter * this.gridSize);
        const sigma = this.packetWidth * this.gridSize;
        const k = this.packetMomentum / this.hbar;
        
        // Normalization factor
        const norm = 1 / (Math.sqrt(sigma * Math.sqrt(Math.PI)));
        
        // Create Gaussian wave packet with momentum
        for (let i = 0; i < this.gridSize; i++) {
            const x = i - centerIdx;
            const gaussian = norm * Math.exp(-x*x / (2 * sigma*sigma));
            
            // Apply phase for momentum
            this.realPart[i] = gaussian * Math.cos(k * x);
            this.imagPart[i] = gaussian * Math.sin(k * x);
        }
        
        // Ensure normalization
        this.normalizeWaveFunction();
    }
    
    normalizeWaveFunction() {
        // Calculate total probability
        let totalProb = 0;
        for (let i = 0; i < this.gridSize; i++) {
            totalProb += this.realPart[i]**2 + this.imagPart[i]**2;
        }
        
        // Normalize
        const normFactor = 1 / Math.sqrt(totalProb);
        for (let i = 0; i < this.gridSize; i++) {
            this.realPart[i] *= normFactor;
            this.imagPart[i] *= normFactor;
        }
    }
    
    reset() {
        // Reset time and arrays
        this.time = 0;
        this.realPart = new Array(this.gridSize).fill(0);
        this.imagPart = new Array(this.gridSize).fill(0);
        this.probabilityDensity = new Array(this.gridSize).fill(0);
        
        // Reset data arrays
        this.positionExpectation = [];
        this.momentumExpectation = [];
        this.timePoints = [];
        
        // Initialize wave packet
        this.initializeWavePacket();
        
        // Calculate initial probability density
        this.updateProbabilityDensity();
        
        // Calculate expectation values
        this.calculateExpectationValues();
    }
    
    updateProbabilityDensity() {
        for (let i = 0; i < this.gridSize; i++) {
            this.probabilityDensity[i] = this.realPart[i]**2 + this.imagPart[i]**2;
        }
    }
    
    calculateExpectationValues() {
        // Calculate expectation values for position, momentum, and uncertainties
        let posExpect = 0;
        let pos2Expect = 0;
        let momExpect = 0;
        let mom2Expect = 0;
        
        // Position expectation value and uncertainty
        for (let i = 0; i < this.gridSize; i++) {
            posExpect += i * this.probabilityDensity[i];
            pos2Expect += i * i * this.probabilityDensity[i];
        }
        
        // Momentum expectation value and uncertainty (using finite difference)
        for (let i = 1; i < this.gridSize - 1; i++) {
            // Momentum operator: -iℏ d/dx
            const dPsi_dx_real = (this.realPart[i+1] - this.realPart[i-1]) / (2 * this.dx);
            const dPsi_dx_imag = (this.imagPart[i+1] - this.imagPart[i-1]) / (2 * this.dx);
            
            // p = -iℏ d/dx, so p|ψ⟩ has real and imaginary components
            const p_psi_real = -this.hbar * dPsi_dx_imag;
            const p_psi_imag = this.hbar * dPsi_dx_real;
            
            // ⟨p⟩ = ⟨ψ|p|ψ⟩
            momExpect += this.realPart[i] * p_psi_real + this.imagPart[i] * p_psi_imag;
            
            // For ⟨p²⟩, apply momentum operator twice
            const d2Psi_dx2_real = (this.realPart[i+1] - 2*this.realPart[i] + this.realPart[i-1]) / (this.dx * this.dx);
            const d2Psi_dx2_imag = (this.imagPart[i+1] - 2*this.imagPart[i] + this.imagPart[i-1]) / (this.dx * this.dx);
            
            // p² = -ℏ² d²/dx²
            const p2_psi_real = -this.hbar * this.hbar * d2Psi_dx2_real;
            const p2_psi_imag = -this.hbar * this.hbar * d2Psi_dx2_imag;
            
            // ⟨p²⟩ = ⟨ψ|p²|ψ⟩
            mom2Expect += this.realPart[i] * p2_psi_real + this.imagPart[i] * p2_psi_imag;
        }
        
        // Calculate uncertainties
        const posUncertainty = Math.sqrt(pos2Expect - posExpect*posExpect);
        const momUncertainty = Math.sqrt(mom2Expect - momExpect*momExpect);
        
        // Update values
        this.values.find(v => v.id === 'position').value = posExpect;
        this.values.find(v => v.id === 'momentum').value = momExpect;
        this.values.find(v => v.id === 'positionUncertainty').value = posUncertainty;
        this.values.find(v => v.id === 'momentumUncertainty').value = momUncertainty;
        this.values.find(v => v.id === 'uncertaintyProduct').value = posUncertainty * momUncertainty;
        
        // Calculate energy
        const kineticEnergy = mom2Expect / (2 * this.mass);
        let potentialEnergy = 0;
        for (let i = 0; i < this.gridSize; i++) {
            potentialEnergy += this.potential[i] * this.probabilityDensity[i];
        }
        this.values.find(v => v.id === 'energy').value = kineticEnergy + potentialEnergy;
        
        // Store for plotting
        this.positionExpectation.push(posExpect);
        this.momentumExpectation.push(momExpect);
        this.timePoints.push(this.time);
        
        // Limit data points
        if (this.timePoints.length > 100) {
            this.timePoints.shift();
            this.positionExpectation.shift();
            this.momentumExpectation.shift();
        }
    }
    
    evolveWaveFunction() {
        // Evolve wave function using finite difference method
        // This implements the Crank-Nicolson method for stability
        
        // Create temporary arrays for the next time step
        const nextReal = new Array(this.gridSize).fill(0);
        const nextImag = new Array(this.gridSize).fill(0);
        
        // Finite difference constants
        const r = this.hbar * this.dt / (2 * this.mass * this.dx * this.dx);
        
        // First pass: update imaginary part using real part
        for (let i = 1; i < this.gridSize - 1; i++) {
            // Laplacian of real part: ∇²ψ_real = (ψ_real[i+1] + ψ_real[i-1] - 2*ψ_real[i]) / dx²
            const laplacianReal = (this.realPart[i+1] + this.realPart[i-1] - 2 * this.realPart[i]) / (this.dx * this.dx);
            
            // Potential term: V(x)ψ_real
            const potentialTerm = this.potential[i] * this.realPart[i];
            
            // Update imaginary part: ψ_imag(t+dt) = ψ_imag(t) + dt/ℏ * (-ℏ²/2m * ∇²ψ_real + V(x)ψ_real)
            nextImag[i] = this.imagPart[i] + (this.dt / this.hbar) * (-this.hbar * this.hbar / (2 * this.mass) * laplacianReal + potentialTerm);
        }
        
        // Second pass: update real part using new imaginary part
        for (let i = 1; i < this.gridSize - 1; i++) {
            // Laplacian of imaginary part
            const laplacianImag = (nextImag[i+1] + nextImag[i-1] - 2 * nextImag[i]) / (this.dx * this.dx);
            
            // Potential term
            const potentialTerm = this.potential[i] * nextImag[i];
            
            // Update real part: ψ_real(t+dt) = ψ_real(t) - dt/ℏ * (-ℏ²/2m * ∇²ψ_imag + V(x)ψ_imag)
            nextReal[i] = this.realPart[i] - (this.dt / this.hbar) * (-this.hbar * this.hbar / (2 * this.mass) * laplacianImag + potentialTerm);
        }
        
        // Apply boundary conditions
        if (this.boundaryType === 'infinite') {
            // Infinite well: wave function vanishes at boundaries
            nextReal[0] = nextReal[this.gridSize - 1] = 0;
            nextImag[0] = nextImag[this.gridSize - 1] = 0;
        } else if (this.boundaryType === 'periodic') {
            // Periodic: wrap around
            nextReal[0] = nextReal[this.gridSize - 2];
            nextReal[this.gridSize - 1] = nextReal[1];
            nextImag[0] = nextImag[this.gridSize - 2];
            nextImag[this.gridSize - 1] = nextImag[1];
        }
        
        // Update wave function
        this.realPart = nextReal;
        this.imagPart = nextImag;
        
        // Ensure normalization periodically
        if (Math.random() < 0.01) { // Occasional renormalization to prevent drift
            this.normalizeWaveFunction();
        }
    }
    
    update(dt) {
        if (this.isPaused) return;
        
        // Use fixed time step for stability
        const numSteps = Math.max(1, Math.floor(dt / this.dt));
        
        for (let i = 0; i < numSteps; i++) {
            // Evolve wave function
            this.evolveWaveFunction();
            
            // Update time
            this.time += this.dt;
        }
        
        // Update probability density
        this.updateProbabilityDensity();
        
        // Calculate expectation values
        this.calculateExpectationValues();
        
        // Update time value
        this.values.find(v => v.id === 'time').value = this.time;
        
        // Update energy chart
        this.updateEnergyChart();
        
        // Draw visualization
        this.draw();
    }
    
    onResize(width, height) {
        // Handle canvas resize
        this.draw();
    }
    
    getColorForProbability(prob) {
        // Map probability to color using color scale
        const maxProb = Math.max(...this.probabilityDensity) || 1;
        const normalizedProb = Math.min(1, prob / maxProb);
        
        // Find position in color scale
        const scalePos = normalizedProb * (this.colorScale.length - 1);
        const idx = Math.floor(scalePos);
        const t = scalePos - idx; // Fractional part for interpolation
        
        if (idx >= this.colorScale.length - 1) {
            return this.colorScale[this.colorScale.length - 1];
        }
        
        // Interpolate between colors
        const c1 = this.colorScale[idx];
        const c2 = this.colorScale[idx + 1];
        
        return {
            r: Math.round(c1.r + t * (c2.r - c1.r)),
            g: Math.round(c1.g + t * (c2.g - c1.g)),
            b: Math.round(c1.b + t * (c2.b - c1.b))
        };
    }
    
    draw() {
        const ctx = this.ctx;
        const width = this.canvas.width;
        const height = this.canvas.height;
        
        // Clear canvas
        ctx.clearRect(0, 0, width, height);
        
        // Calculate scaling factors
        const xScale = width / this.gridSize;
        const yScale = height / 2;
        const potentialScale = height / 4 / Math.max(1, Math.max(...this.potential));
        
        // Draw potential
        ctx.beginPath();
        ctx.moveTo(0, height / 2);
        for (let i = 0; i < this.gridSize; i++) {
            const x = i * xScale;
            const y = height / 2 - this.potential[i] * potentialScale;
            ctx.lineTo(x, y);
        }
        ctx.strokeStyle = 'rgba(100, 100, 100, 0.7)';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Fill potential area
        ctx.beginPath();
        ctx.moveTo(0, height / 2);
        for (let i = 0; i < this.gridSize; i++) {
            const x = i * xScale;
            const y = height / 2 - this.potential[i] * potentialScale;
            ctx.lineTo(x, y);
        }
        ctx.lineTo(width, height / 2);
        ctx.fillStyle = 'rgba(100, 100, 100, 0.2)';
        ctx.fill();
        
        // Draw probability density
        for (let i = 0; i < this.gridSize; i++) {
            const x = i * xScale;
            const prob = this.probabilityDensity[i];
            const barHeight = prob * yScale * 5; // Scale for visibility
            
            // Get color based on probability
            const color = this.getColorForProbability(prob);
            ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, 0.7)`;
            
            // Draw rectangle for probability
            ctx.fillRect(x, height / 2 - barHeight / 2, xScale, barHeight);
        }
        
        // Draw real part of wave function
        ctx.beginPath();
        for (let i = 0; i < this.gridSize; i++) {
            const x = i * xScale;
            const y = height / 2 - this.realPart[i] * yScale;
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.strokeStyle = 'rgba(0, 0, 255, 0.8)';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Draw imaginary part of wave function
        ctx.beginPath();
        for (let i = 0; i < this.gridSize; i++) {
            const x = i * xScale;
            const y = height / 2 - this.imagPart[i] * yScale;
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.strokeStyle = 'rgba(255, 0, 0, 0.8)';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Draw legend
        ctx.font = '12px Arial';
        ctx.fillStyle = 'rgba(0, 0, 255, 0.8)';
        ctx.fillText('Real Part', 10, 20);
        ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
        ctx.fillText('Imaginary Part', 10, 40);
        ctx.fillStyle = 'rgba(100, 100, 100, 0.7)';
        ctx.fillText('Potential', 10, 60);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillText('Probability Density', 10, 80);
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
                labels: this.timePoints,
                datasets: [
                    {
                        label: 'Position Expectation',
                        data: this.positionExpectation,
                        borderColor: getComputedStyle(document.body).getPropertyValue('--primary-color'),
                        tension: 0.4,
                        fill: false
                    },
                    {
                        label: 'Momentum Expectation',
                        data: this.momentumExpectation,
                        borderColor: getComputedStyle(document.body).getPropertyValue('--secondary-color'),
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
        this.energyChart.data.labels = this.timePoints;
        this.energyChart.data.datasets[0].data = this.positionExpectation;
        this.energyChart.data.datasets[1].data = this.momentumExpectation;
        
        // Update chart
        this.energyChart.update();
    }
    
    getEnergy() {
        // For compatibility with the energy chart system
        return {
            kinetic: 0,
            potential: 0,
            total: this.values.find(v => v.id === 'energy').value
        };
    }
}
