class ParticleInBox {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        
        // Physics constants
        this.hbar = 1.0; // Reduced Planck's constant (normalized units)
        this.mass = 1.0; // Particle mass
        
        // Box dimensions
        this.boxLength = 10.0; // Length in x direction
        this.boxWidth = 10.0;  // Width in y direction (for 2D and 3D)
        this.boxHeight = 10.0; // Height in z direction (for 3D)
        
        // Simulation parameters
        this.dimensions = 1; // 1D, 2D, or 3D
        this.potentialHeight = 100.0; // Height of potential walls (for finite well)
        this.isFiniteWell = false; // Infinite well by default
        
        // Quantum numbers
        this.nx = 1; // Quantum number for x direction
        this.ny = 1; // Quantum number for y direction (for 2D and 3D)
        this.nz = 1; // Quantum number for z direction (for 3D)
        
        // Superposition parameters
        this.isSuperposition = false;
        this.superpositionStates = [
            { nx: 1, ny: 1, nz: 1, coefficient: 1.0, phase: 0 }
        ];
        
        // Visualization parameters
        this.gridSize = 100; // Number of points for visualization
        this.viewMode = 'wavefunction'; // 'wavefunction', 'probability', or 'realtime'
        this.showNodes = true; // Show nodal lines/planes
        this.animate = true; // Animate time evolution
        this.time = 0; // Current simulation time
        this.timeStep = 0.05; // Time step for animation
        
        // Calculated values
        this.energyLevels = [];
        this.currentEnergy = 0;
        this.waveFunctionData = [];
        this.probabilityData = [];
        
        // 3D visualization
        this.slicePosition = 0.5; // Position of slice for 3D visualization (0-1)
        this.sliceAxis = 'z'; // Axis for slicing ('x', 'y', or 'z')
        
        // Color scales
        this.waveFunctionColorScale = [
            { r: 0, g: 0, b: 255 },    // Blue (negative)
            { r: 255, g: 255, b: 255 }, // White (zero)
            { r: 255, g: 0, b: 0 }      // Red (positive)
        ];
        
        this.probabilityColorScale = [
            { r: 0, g: 0, b: 0 },      // Black (zero)
            { r: 0, g: 0, b: 255 },    // Blue
            { r: 0, g: 255, b: 255 },  // Cyan
            { r: 0, g: 255, b: 0 },    // Green
            { r: 255, g: 255, b: 0 },  // Yellow
            { r: 255, g: 0, b: 0 }     // Red (maximum)
        ];
        
        // Define parameters for UI controls
        this.parameters = [
            {
                id: 'dimensions',
                name: 'Dimensions',
                type: 'select',
                options: [
                    { value: 1, label: '1D' },
                    { value: 2, label: '2D' },
                    { value: 3, label: '3D' }
                ],
                value: this.dimensions,
                onChange: (value) => {
                    this.dimensions = parseInt(value);
                    this.updateQuantumStates();
                    this.calculateEnergies();
                    this.calculateWaveFunction();
                }
            },
            {
                id: 'mass',
                name: 'Particle Mass',
                min: 0.1,
                max: 10.0,
                step: 0.1,
                value: this.mass,
                onChange: (value) => {
                    this.mass = value;
                    this.calculateEnergies();
                    this.calculateWaveFunction();
                }
            },
            {
                id: 'boxLength',
                name: 'Box Length (x)',
                min: 1.0,
                max: 20.0,
                step: 0.5,
                value: this.boxLength,
                onChange: (value) => {
                    this.boxLength = value;
                    this.calculateEnergies();
                    this.calculateWaveFunction();
                }
            },
            {
                id: 'boxWidth',
                name: 'Box Width (y)',
                min: 1.0,
                max: 20.0,
                step: 0.5,
                value: this.boxWidth,
                onChange: (value) => {
                    this.boxWidth = value;
                    this.calculateEnergies();
                    this.calculateWaveFunction();
                }
            },
            {
                id: 'boxHeight',
                name: 'Box Height (z)',
                min: 1.0,
                max: 20.0,
                step: 0.5,
                value: this.boxHeight,
                onChange: (value) => {
                    this.boxHeight = value;
                    this.calculateEnergies();
                    this.calculateWaveFunction();
                }
            },
            {
                id: 'nx',
                name: 'Quantum Number nx',
                min: 1,
                max: 10,
                step: 1,
                value: this.nx,
                onChange: (value) => {
                    this.nx = parseInt(value);
                    if (!this.isSuperposition) {
                        this.calculateEnergies();
                        this.calculateWaveFunction();
                    }
                }
            },
            {
                id: 'ny',
                name: 'Quantum Number ny',
                min: 1,
                max: 10,
                step: 1,
                value: this.ny,
                onChange: (value) => {
                    this.ny = parseInt(value);
                    if (!this.isSuperposition) {
                        this.calculateEnergies();
                        this.calculateWaveFunction();
                    }
                }
            },
            {
                id: 'nz',
                name: 'Quantum Number nz',
                min: 1,
                max: 10,
                step: 1,
                value: this.nz,
                onChange: (value) => {
                    this.nz = parseInt(value);
                    if (!this.isSuperposition) {
                        this.calculateEnergies();
                        this.calculateWaveFunction();
                    }
                }
            },
            {
                id: 'isFiniteWell',
                name: 'Finite Potential Well',
                type: 'checkbox',
                value: this.isFiniteWell,
                onChange: (value) => {
                    this.isFiniteWell = value;
                    this.calculateEnergies();
                    this.calculateWaveFunction();
                }
            },
            {
                id: 'potentialHeight',
                name: 'Potential Height',
                min: 10.0,
                max: 500.0,
                step: 10.0,
                value: this.potentialHeight,
                onChange: (value) => {
                    this.potentialHeight = value;
                    if (this.isFiniteWell) {
                        this.calculateEnergies();
                        this.calculateWaveFunction();
                    }
                }
            },
            {
                id: 'isSuperposition',
                name: 'Enable Superposition',
                type: 'checkbox',
                value: this.isSuperposition,
                onChange: (value) => {
                    this.isSuperposition = value;
                    if (value) {
                        this.initializeSuperposition();
                    } else {
                        this.calculateEnergies();
                        this.calculateWaveFunction();
                    }
                }
            },
            {
                id: 'viewMode',
                name: 'View Mode',
                type: 'select',
                options: [
                    { value: 'wavefunction', label: 'Wave Function' },
                    { value: 'probability', label: 'Probability Density' },
                    { value: 'realtime', label: 'Real-time Evolution' }
                ],
                value: this.viewMode,
                onChange: (value) => {
                    this.viewMode = value;
                    this.draw();
                }
            },
            {
                id: 'showNodes',
                name: 'Show Nodes',
                type: 'checkbox',
                value: this.showNodes,
                onChange: (value) => {
                    this.showNodes = value;
                    this.draw();
                }
            },
            {
                id: 'animate',
                name: 'Animate',
                type: 'checkbox',
                value: this.animate,
                onChange: (value) => {
                    this.animate = value;
                    this.time = 0;
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
        
        // Add 3D visualization controls
        if (this.dimensions === 3) {
            this.parameters.push(
                {
                    id: 'sliceAxis',
                    name: 'Slice Axis',
                    type: 'select',
                    options: [
                        { value: 'x', label: 'X Axis' },
                        { value: 'y', label: 'Y Axis' },
                        { value: 'z', label: 'Z Axis' }
                    ],
                    value: this.sliceAxis,
                    onChange: (value) => {
                        this.sliceAxis = value;
                        this.draw();
                    }
                },
                {
                    id: 'slicePosition',
                    name: 'Slice Position',
                    min: 0,
                    max: 1,
                    step: 0.05,
                    value: this.slicePosition,
                    onChange: (value) => {
                        this.slicePosition = value;
                        this.draw();
                    }
                }
            );
        }
        
        // Values for display
        this.values = [
            { id: 'energy', name: 'Energy', value: 0, precision: 3 },
            { id: 'groundEnergy', name: 'Ground State Energy', value: 0, precision: 3 },
            { id: 'positionUncertainty', name: 'Position Uncertainty', value: 0, precision: 3 },
            { id: 'momentumUncertainty', name: 'Momentum Uncertainty', value: 0, precision: 3 },
            { id: 'uncertaintyProduct', name: 'Δx·Δp', value: 0, precision: 3 }
        ];
        
        // Formulas
        this.formulas = [
            {
                title: 'Energy Quantization',
                description: 'Energy levels for a particle in a box',
                equation: 'E_n = (n²π²ℏ²)/(2mL²)'
            },
            {
                title: '1D Wave Function',
                description: 'Wave function for a particle in a 1D box',
                equation: 'ψ_n(x) = √(2/L)·sin(nπx/L)'
            },
            {
                title: '2D Wave Function',
                description: 'Wave function for a particle in a 2D box',
                equation: 'ψ_{n,m}(x,y) = (2/√(LW))·sin(nπx/L)·sin(mπy/W)'
            },
            {
                title: '3D Wave Function',
                description: 'Wave function for a particle in a 3D box',
                equation: 'ψ_{n,m,l}(x,y,z) = (2/√(LWH))·sin(nπx/L)·sin(mπy/W)·sin(lπz/H)'
            }
        ];
        
        // Initialize simulation
        this.updateQuantumStates();
        this.calculateEnergies();
        this.calculateWaveFunction();
        this.initEnergyChart();
    }
    
    reset() {
        // Reset time and quantum numbers
        this.time = 0;
        this.nx = 1;
        this.ny = 1;
        this.nz = 1;
        
        // Reset superposition
        this.isSuperposition = false;
        this.superpositionStates = [
            { nx: 1, ny: 1, nz: 1, coefficient: 1.0, phase: 0 }
        ];
        
        // Recalculate
        this.calculateEnergies();
        this.calculateWaveFunction();
    }
    
    updateQuantumStates() {
        // Update available parameters based on dimensions
        this.parameters.forEach(param => {
            if (param.id === 'ny' || param.id === 'boxWidth') {
                param.hidden = this.dimensions < 2;
            }
            if (param.id === 'nz' || param.id === 'boxHeight' || 
                param.id === 'sliceAxis' || param.id === 'slicePosition') {
                param.hidden = this.dimensions < 3;
            }
        });
    }
    
    initializeSuperposition() {
        // Initialize with a few states for superposition
        this.superpositionStates = [
            { nx: 1, ny: 1, nz: 1, coefficient: 0.7, phase: 0 },
            { nx: 2, ny: 1, nz: 1, coefficient: 0.5, phase: Math.PI/4 },
            { nx: 3, ny: 1, nz: 1, coefficient: 0.3, phase: Math.PI/2 }
        ];
        
        // Normalize coefficients
        this.normalizeSuperposition();
        
        // Calculate wave function for superposition
        this.calculateWaveFunction();
    }
    
    normalizeSuperposition() {
        // Calculate sum of squared coefficients
        const sumSquared = this.superpositionStates.reduce(
            (sum, state) => sum + state.coefficient * state.coefficient, 0
        );
        
        // Normalize
        const normFactor = 1 / Math.sqrt(sumSquared);
        this.superpositionStates.forEach(state => {
            state.coefficient *= normFactor;
        });
    }
    
    calculateEnergies() {
        // Calculate energy levels based on dimensions
        const baseEnergy = (Math.PI * Math.PI * this.hbar * this.hbar) / (2 * this.mass);
        
        this.energyLevels = [];
        
        if (this.dimensions === 1) {
            // 1D: E_n = (n²π²ℏ²)/(2mL²)
            for (let n = 1; n <= 10; n++) {
                const energy = baseEnergy * (n * n) / (this.boxLength * this.boxLength);
                this.energyLevels.push({
                    n: n,
                    energy: energy,
                    degeneracy: 1,
                    label: `n=${n}`
                });
            }
            
            // Current state energy
            this.currentEnergy = baseEnergy * (this.nx * this.nx) / (this.boxLength * this.boxLength);
            
        } else if (this.dimensions === 2) {
            // 2D: E_{n,m} = (π²ℏ²)/(2m) * [(n/L)² + (m/W)²]
            let index = 0;
            for (let n = 1; n <= 5; n++) {
                for (let m = 1; m <= 5; m++) {
                    const energy = baseEnergy * (
                        (n * n) / (this.boxLength * this.boxLength) + 
                        (m * m) / (this.boxWidth * this.boxWidth)
                    );
                    
                    // Check for degeneracy
                    const existingLevel = this.energyLevels.find(level => 
                        Math.abs(level.energy - energy) < 1e-10
                    );
                    
                    if (existingLevel) {
                        existingLevel.degeneracy++;
                        existingLevel.label += `, n=${n},m=${m}`;
                    } else {
                        this.energyLevels.push({
                            n: n,
                            m: m,
                            energy: energy,
                            degeneracy: 1,
                            label: `n=${n},m=${m}`
                        });
                    }
                    
                    index++;
                    if (index >= 25) break; // Limit to 25 states
                }
            }
            
            // Sort by energy
            this.energyLevels.sort((a, b) => a.energy - b.energy);
            
            // Current state energy
            this.currentEnergy = baseEnergy * (
                (this.nx * this.nx) / (this.boxLength * this.boxLength) + 
                (this.ny * this.ny) / (this.boxWidth * this.boxWidth)
            );
            
        } else if (this.dimensions === 3) {
            // 3D: E_{n,m,l} = (π²ℏ²)/(2m) * [(n/L)² + (m/W)² + (l/H)²]
            let index = 0;
            for (let n = 1; n <= 3; n++) {
                for (let m = 1; m <= 3; m++) {
                    for (let l = 1; l <= 3; l++) {
                        const energy = baseEnergy * (
                            (n * n) / (this.boxLength * this.boxLength) + 
                            (m * m) / (this.boxWidth * this.boxWidth) + 
                            (l * l) / (this.boxHeight * this.boxHeight)
                        );
                        
                        // Check for degeneracy
                        const existingLevel = this.energyLevels.find(level => 
                            Math.abs(level.energy - energy) < 1e-10
                        );
                        
                        if (existingLevel) {
                            existingLevel.degeneracy++;
                            existingLevel.label += `, n=${n},m=${m},l=${l}`;
                        } else {
                            this.energyLevels.push({
                                n: n,
                                m: m,
                                l: l,
                                energy: energy,
                                degeneracy: 1,
                                label: `n=${n},m=${m},l=${l}`
                            });
                        }
                        
                        index++;
                        if (index >= 27) break; // Limit to 27 states
                    }
                }
            }
            
            // Sort by energy
            this.energyLevels.sort((a, b) => a.energy - b.energy);
            
            // Current state energy
            this.currentEnergy = baseEnergy * (
                (this.nx * this.nx) / (this.boxLength * this.boxLength) + 
                (this.ny * this.ny) / (this.boxWidth * this.boxWidth) + 
                (this.nz * this.nz) / (this.boxHeight * this.boxHeight)
            );
        }
        
        // Update values
        this.values.find(v => v.id === 'energy').value = this.currentEnergy;
        this.values.find(v => v.id === 'groundEnergy').value = this.energyLevels[0].energy;
        
        // Calculate uncertainties
        this.calculateUncertainties();
    }
    
    calculateUncertainties() {
        // Calculate position and momentum uncertainties
        let positionUncertainty, momentumUncertainty;
        
        if (this.dimensions === 1) {
            // 1D position uncertainty: Δx = L/√12 * √(1 - 6/(n²π²))
            positionUncertainty = this.boxLength / Math.sqrt(12) * 
                                 Math.sqrt(1 - 6 / (this.nx * this.nx * Math.PI * Math.PI));
            
            // 1D momentum uncertainty: Δp = ℏnπ/L * √(1/3 - 1/(2n²π²))
            momentumUncertainty = this.hbar * this.nx * Math.PI / this.boxLength * 
                                 Math.sqrt(1/3 - 1/(2 * this.nx * this.nx * Math.PI * Math.PI));
        } else if (this.dimensions === 2) {
            // Simplified approximation for 2D
            const posUncertaintyX = this.boxLength / Math.sqrt(12) * 
                                   Math.sqrt(1 - 6 / (this.nx * this.nx * Math.PI * Math.PI));
            const posUncertaintyY = this.boxWidth / Math.sqrt(12) * 
                                   Math.sqrt(1 - 6 / (this.ny * this.ny * Math.PI * Math.PI));
            
            // Combined position uncertainty
            positionUncertainty = Math.sqrt(posUncertaintyX * posUncertaintyX + posUncertaintyY * posUncertaintyY);
            
            // Momentum uncertainties
            const momUncertaintyX = this.hbar * this.nx * Math.PI / this.boxLength * 
                                   Math.sqrt(1/3 - 1/(2 * this.nx * this.nx * Math.PI * Math.PI));
            const momUncertaintyY = this.hbar * this.ny * Math.PI / this.boxWidth * 
                                   Math.sqrt(1/3 - 1/(2 * this.ny * this.ny * Math.PI * Math.PI));
            
            // Combined momentum uncertainty
            momentumUncertainty = Math.sqrt(momUncertaintyX * momUncertaintyX + momUncertaintyY * momUncertaintyY);
        } else {
            // Simplified approximation for 3D
            const posUncertaintyX = this.boxLength / Math.sqrt(12) * 
                                   Math.sqrt(1 - 6 / (this.nx * this.nx * Math.PI * Math.PI));
            const posUncertaintyY = this.boxWidth / Math.sqrt(12) * 
                                   Math.sqrt(1 - 6 / (this.ny * this.ny * Math.PI * Math.PI));
            const posUncertaintyZ = this.boxHeight / Math.sqrt(12) * 
                                   Math.sqrt(1 - 6 / (this.nz * this.nz * Math.PI * Math.PI));
            
            // Combined position uncertainty
            positionUncertainty = Math.sqrt(
                posUncertaintyX * posUncertaintyX + 
                posUncertaintyY * posUncertaintyY + 
                posUncertaintyZ * posUncertaintyZ
            );
            
            // Momentum uncertainties
            const momUncertaintyX = this.hbar * this.nx * Math.PI / this.boxLength * 
                                   Math.sqrt(1/3 - 1/(2 * this.nx * this.nx * Math.PI * Math.PI));
            const momUncertaintyY = this.hbar * this.ny * Math.PI / this.boxWidth * 
                                   Math.sqrt(1/3 - 1/(2 * this.ny * this.ny * Math.PI * Math.PI));
            const momUncertaintyZ = this.hbar * this.nz * Math.PI / this.boxHeight * 
                                   Math.sqrt(1/3 - 1/(2 * this.nz * this.nz * Math.PI * Math.PI));
            
            // Combined momentum uncertainty
            momentumUncertainty = Math.sqrt(
                momUncertaintyX * momUncertaintyX + 
                momUncertaintyY * momUncertaintyY + 
                momUncertaintyZ * momUncertaintyZ
            );
        }
        
        // Update values
        this.values.find(v => v.id === 'positionUncertainty').value = positionUncertainty;
        this.values.find(v => v.id === 'momentumUncertainty').value = momentumUncertainty;
        this.values.find(v => v.id === 'uncertaintyProduct').value = positionUncertainty * momentumUncertainty;
    }
    
    calculateWaveFunction() {
        // Initialize data arrays based on dimensions
        this.waveFunctionData = [];
        this.probabilityData = [];
        
        if (this.dimensions === 1) {
            // 1D wave function
            this.calculate1DWaveFunction();
        } else if (this.dimensions === 2) {
            // 2D wave function
            this.calculate2DWaveFunction();
        } else {
            // 3D wave function
            this.calculate3DWaveFunction();
        }
    }
    
    calculate1DWaveFunction() {
        // Calculate 1D wave function: ψ_n(x) = √(2/L)·sin(nπx/L)
        const normFactor = Math.sqrt(2 / this.boxLength);
        
        // Create grid points
        const dx = this.boxLength / this.gridSize;
        
        for (let i = 0; i < this.gridSize; i++) {
            const x = i * dx;
            
            let waveValue = 0;
            let realPart = 0;
            let imagPart = 0;
            
            if (this.isSuperposition) {
                // Superposition of states
                for (const state of this.superpositionStates) {
                    const statePsi = normFactor * Math.sin(state.nx * Math.PI * x / this.boxLength);
                    const energy = (Math.PI * Math.PI * this.hbar * this.hbar) / (2 * this.mass) * 
                                  (state.nx * state.nx) / (this.boxLength * this.boxLength);
                    const phase = state.phase - energy * this.time / this.hbar;
                    
                    realPart += state.coefficient * statePsi * Math.cos(phase);
                    imagPart += state.coefficient * statePsi * Math.sin(phase);
                }
                
                waveValue = Math.sqrt(realPart * realPart + imagPart * imagPart);
            } else {
                // Single state
                waveValue = normFactor * Math.sin(this.nx * Math.PI * x / this.boxLength);
            }
            
            this.waveFunctionData.push(waveValue);
            this.probabilityData.push(waveValue * waveValue);
        }
    }
    
    calculate2DWaveFunction() {
        // Calculate 2D wave function: ψ_{n,m}(x,y) = (2/√(LW))·sin(nπx/L)·sin(mπy/W)
        const normFactor = 2 / Math.sqrt(this.boxLength * this.boxWidth);
        
        // Create grid points
        const dx = this.boxLength / this.gridSize;
        const dy = this.boxWidth / this.gridSize;
        
        for (let j = 0; j < this.gridSize; j++) {
            const y = j * dy;
            
            for (let i = 0; i < this.gridSize; i++) {
                const x = i * dx;
                
                let waveValue = 0;
                let realPart = 0;
                let imagPart = 0;
                
                if (this.isSuperposition) {
                    // Superposition of states
                    for (const state of this.superpositionStates) {
                        const statePsi = normFactor * 
                                        Math.sin(state.nx * Math.PI * x / this.boxLength) * 
                                        Math.sin(state.ny * Math.PI * y / this.boxWidth);
                        
                        const energy = (Math.PI * Math.PI * this.hbar * this.hbar) / (2 * this.mass) * (
                            (state.nx * state.nx) / (this.boxLength * this.boxLength) + 
                            (state.ny * state.ny) / (this.boxWidth * this.boxWidth)
                        );
                        
                        const phase = state.phase - energy * this.time / this.hbar;
                        
                        realPart += state.coefficient * statePsi * Math.cos(phase);
                        imagPart += state.coefficient * statePsi * Math.sin(phase);
                    }
                    
                    waveValue = Math.sqrt(realPart * realPart + imagPart * imagPart);
                } else {
                    // Single state
                    waveValue = normFactor * 
                               Math.sin(this.nx * Math.PI * x / this.boxLength) * 
                               Math.sin(this.ny * Math.PI * y / this.boxWidth);
                }
                
                const index = j * this.gridSize + i;
                this.waveFunctionData[index] = waveValue;
                this.probabilityData[index] = waveValue * waveValue;
            }
        }
    }
    
    calculate3DWaveFunction() {
        // Calculate 3D wave function: ψ_{n,m,l}(x,y,z) = (2/√(LWH))·sin(nπx/L)·sin(mπy/W)·sin(lπz/H)
        const normFactor = 2 / Math.sqrt(this.boxLength * this.boxWidth * this.boxHeight);
        
        // Create grid points
        const dx = this.boxLength / this.gridSize;
        const dy = this.boxWidth / this.gridSize;
        const dz = this.boxHeight / this.gridSize;
        
        // For 3D, we'll calculate a slice based on the selected axis
        const sliceIndex = Math.floor(this.slicePosition * this.gridSize);
        
        for (let j = 0; j < this.gridSize; j++) {
            for (let i = 0; i < this.gridSize; i++) {
                let x, y, z;
                
                // Set coordinates based on slice axis
                if (this.sliceAxis === 'x') {
                    x = sliceIndex * dx;
                    y = i * dy;
                    z = j * dz;
                } else if (this.sliceAxis === 'y') {
                    x = i * dx;
                    y = sliceIndex * dy;
                    z = j * dz;
                } else { // z axis
                    x = i * dx;
                    y = j * dy;
                    z = sliceIndex * dz;
                }
                
                let waveValue = 0;
                let realPart = 0;
                let imagPart = 0;
                
                if (this.isSuperposition) {
                    // Superposition of states
                    for (const state of this.superpositionStates) {
                        const statePsi = normFactor * 
                                        Math.sin(state.nx * Math.PI * x / this.boxLength) * 
                                        Math.sin(state.ny * Math.PI * y / this.boxWidth) * 
                                        Math.sin(state.nz * Math.PI * z / this.boxHeight);
                        
                        const energy = (Math.PI * Math.PI * this.hbar * this.hbar) / (2 * this.mass) * (
                            (state.nx * state.nx) / (this.boxLength * this.boxLength) + 
                            (state.ny * state.ny) / (this.boxWidth * this.boxWidth) + 
                            (state.nz * state.nz) / (this.boxHeight * this.boxHeight)
                        );
                        
                        const phase = state.phase - energy * this.time / this.hbar;
                        
                        realPart += state.coefficient * statePsi * Math.cos(phase);
                        imagPart += state.coefficient * statePsi * Math.sin(phase);
                    }
                    
                    waveValue = Math.sqrt(realPart * realPart + imagPart * imagPart);
                } else {
                    // Single state
                    waveValue = normFactor * 
                               Math.sin(this.nx * Math.PI * x / this.boxLength) * 
                               Math.sin(this.ny * Math.PI * y / this.boxWidth) * 
                               Math.sin(this.nz * Math.PI * z / this.boxHeight);
                }
                
                const index = j * this.gridSize + i;
                this.waveFunctionData[index] = waveValue;
                this.probabilityData[index] = waveValue * waveValue;
            }
        }
    }
    
    getColorForWaveFunction(value) {
        // Map wave function value to color
        // Normalize to [-1, 1] range
        const maxAbs = Math.max(...this.waveFunctionData.map(Math.abs)) || 1;
        const normalizedValue = value / maxAbs;
        
        // Map [-1, 1] to [0, 1] for color interpolation
        const t = (normalizedValue + 1) / 2;
        
        // Interpolate between colors
        if (t <= 0.5) {
            // Negative to zero: blue to white
            const scaledT = t * 2; // Scale [0, 0.5] to [0, 1]
            const c1 = this.waveFunctionColorScale[0];
            const c2 = this.waveFunctionColorScale[1];
            
            return {
                r: Math.round(c1.r + scaledT * (c2.r - c1.r)),
                g: Math.round(c1.g + scaledT * (c2.g - c1.g)),
                b: Math.round(c1.b + scaledT * (c2.b - c1.b))
            };
        } else {
            // Zero to positive: white to red
            const scaledT = (t - 0.5) * 2; // Scale [0.5, 1] to [0, 1]
            const c1 = this.waveFunctionColorScale[1];
            const c2 = this.waveFunctionColorScale[2];
            
            return {
                r: Math.round(c1.r + scaledT * (c2.r - c1.r)),
                g: Math.round(c1.g + scaledT * (c2.g - c1.g)),
                b: Math.round(c1.b + scaledT * (c2.b - c1.b))
            };
        }
    }
    
    getColorForProbability(value) {
        // Map probability value to color
        const maxProb = Math.max(...this.probabilityData) || 1;
        const normalizedValue = value / maxProb;
        
        // Find position in color scale
        const scalePos = normalizedValue * (this.probabilityColorScale.length - 1);
        const idx = Math.floor(scalePos);
        const t = scalePos - idx; // Fractional part for interpolation
        
        if (idx >= this.probabilityColorScale.length - 1) {
            return this.probabilityColorScale[this.probabilityColorScale.length - 1];
        }
        
        // Interpolate between colors
        const c1 = this.probabilityColorScale[idx];
        const c2 = this.probabilityColorScale[idx + 1];
        
        return {
            r: Math.round(c1.r + t * (c2.r - c1.r)),
            g: Math.round(c1.g + t * (c2.g - c1.g)),
            b: Math.round(c1.b + t * (c2.b - c1.b))
        };
    }
    
    update(dt) {
        // Update time if animation is enabled
        if (this.animate && (this.viewMode === 'realtime' || this.isSuperposition)) {
            this.time += this.timeStep;
            
            // Recalculate wave function for time evolution
            this.calculateWaveFunction();
        }
        
        // Draw visualization
        this.draw();
        
        // Update energy chart
        this.updateEnergyChart();
    }
    
    onResize(width, height) {
        // Handle canvas resize
        this.draw();
    }
    
    draw() {
        const ctx = this.ctx;
        const width = this.canvas.width;
        const height = this.canvas.height;
        
        // Clear canvas
        ctx.clearRect(0, 0, width, height);
        
        if (this.dimensions === 1) {
            this.draw1D(ctx, width, height);
        } else if (this.dimensions === 2) {
            this.draw2D(ctx, width, height);
        } else {
            this.draw3D(ctx, width, height);
        }
        
        // Draw energy level diagram
        this.drawEnergyLevels(ctx, width, height);
    }
    
    draw1D(ctx, width, height) {
        // Draw 1D wave function or probability density
        const graphHeight = height * 0.6;
        const graphWidth = width * 0.8;
        const graphX = width * 0.1;
        const graphY = height * 0.2;
        
        // Draw box
        ctx.strokeStyle = '#888';
        ctx.lineWidth = 2;
        ctx.strokeRect(graphX, graphY, graphWidth, graphHeight);
        
        // Draw x-axis
        ctx.beginPath();
        ctx.moveTo(graphX, graphY + graphHeight/2);
        ctx.lineTo(graphX + graphWidth, graphY + graphHeight/2);
        ctx.strokeStyle = '#888';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // Draw wave function or probability
        ctx.beginPath();
        
        const dataToUse = this.viewMode === 'wavefunction' ? 
                         this.waveFunctionData : this.probabilityData;
        
        const maxValue = Math.max(...dataToUse.map(Math.abs)) || 1;
        const scale = graphHeight / 2 / maxValue;
        
        for (let i = 0; i < this.gridSize; i++) {
            const x = graphX + (i / this.gridSize) * graphWidth;
            const y = graphY + graphHeight/2 - dataToUse[i] * scale;
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        
        if (this.viewMode === 'wavefunction') {
            ctx.strokeStyle = '#3498db';
        } else {
            ctx.strokeStyle = '#e74c3c';
        }
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Fill probability density
        if (this.viewMode === 'probability' || this.viewMode === 'realtime') {
            ctx.beginPath();
            ctx.moveTo(graphX, graphY + graphHeight/2);
            
            for (let i = 0; i < this.gridSize; i++) {
                const x = graphX + (i / this.gridSize) * graphWidth;
                const y = graphY + graphHeight/2 - this.probabilityData[i] * scale;
                ctx.lineTo(x, y);
            }
            
            ctx.lineTo(graphX + graphWidth, graphY + graphHeight/2);
            ctx.closePath();
            ctx.fillStyle = 'rgba(231, 76, 60, 0.3)';
            ctx.fill();
        }
        
        // Draw nodes if enabled
        if (this.showNodes && this.viewMode === 'wavefunction' && !this.isSuperposition) {
            for (let n = 1; n < this.nx; n++) {
                const nodeX = graphX + (n / this.nx) * graphWidth;
                
                ctx.beginPath();
                ctx.moveTo(nodeX, graphY);
                ctx.lineTo(nodeX, graphY + graphHeight);
                ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
                ctx.lineWidth = 1;
                ctx.stroke();
                
                ctx.fillStyle = '#000';
                ctx.font = '12px Arial';
                ctx.fillText(`Node ${n}`, nodeX - 20, graphY - 5);
            }
        }
        
        // Draw labels
        ctx.fillStyle = '#000';
        ctx.font = '14px Arial';
        if (this.viewMode === 'wavefunction') {
            ctx.fillText('Wave Function ψ(x)', width/2 - 50, 20);
        } else if (this.viewMode === 'probability') {
            ctx.fillText('Probability Density |ψ(x)|²', width/2 - 70, 20);
        } else {
            ctx.fillText('Real-time Evolution', width/2 - 60, 20);
        }
        
        ctx.fillText('x', graphX + graphWidth + 10, graphY + graphHeight/2 + 5);
        
        // Draw quantum numbers
        ctx.fillText(`n = ${this.nx}`, 20, 40);
        ctx.fillText(`E = ${this.currentEnergy.toFixed(2)}`, 20, 60);
    }
    
    draw2D(ctx, width, height) {
        // Draw 2D wave function or probability density as a heatmap
        const graphSize = Math.min(width, height) * 0.7;
        const graphX = (width - graphSize) / 2;
        const graphY = (height - graphSize) / 2;
        
        // Draw box
        ctx.strokeStyle = '#888';
        ctx.lineWidth = 2;
        ctx.strokeRect(graphX, graphY, graphSize, graphSize);
        
        // Draw heatmap
        const cellSize = graphSize / this.gridSize;
        
        for (let j = 0; j < this.gridSize; j++) {
            for (let i = 0; i < this.gridSize; i++) {
                const index = j * this.gridSize + i;
                const x = graphX + i * cellSize;
                const y = graphY + j * cellSize;
                
                let color;
                if (this.viewMode === 'wavefunction') {
                    color = this.getColorForWaveFunction(this.waveFunctionData[index]);
                } else {
                    color = this.getColorForProbability(this.probabilityData[index]);
                }
                
                ctx.fillStyle = `rgb(${color.r}, ${color.g}, ${color.b})`;
                ctx.fillRect(x, y, cellSize, cellSize);
            }
        }
        
        // Draw nodes if enabled
        if (this.showNodes && this.viewMode === 'wavefunction' && !this.isSuperposition) {
            // Draw x nodes
            for (let n = 1; n < this.nx; n++) {
                const nodeX = graphX + (n / this.nx) * graphSize;
                
                ctx.beginPath();
                ctx.moveTo(nodeX, graphY);
                ctx.lineTo(nodeX, graphY + graphSize);
                ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
                ctx.lineWidth = 1;
                ctx.stroke();
            }
            
            // Draw y nodes
            for (let m = 1; m < this.ny; m++) {
                const nodeY = graphY + (m / this.ny) * graphSize;
                
                ctx.beginPath();
                ctx.moveTo(graphX, nodeY);
                ctx.lineTo(graphX + graphSize, nodeY);
                ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
                ctx.lineWidth = 1;
                ctx.stroke();
            }
        }
        
        // Draw labels
        ctx.fillStyle = '#000';
        ctx.font = '14px Arial';
        if (this.viewMode === 'wavefunction') {
            ctx.fillText('Wave Function ψ(x,y)', width/2 - 70, 20);
        } else if (this.viewMode === 'probability') {
            ctx.fillText('Probability Density |ψ(x,y)|²', width/2 - 90, 20);
        } else {
            ctx.fillText('Real-time Evolution', width/2 - 60, 20);
        }
        
        ctx.fillText('x', graphX + graphSize + 10, graphY + graphSize/2);
        ctx.fillText('y', graphX + graphSize/2, graphY - 10);
        
        // Draw quantum numbers
        ctx.fillText(`nx = ${this.nx}, ny = ${this.ny}`, 20, 40);
        ctx.fillText(`E = ${this.currentEnergy.toFixed(2)}`, 20, 60);
        
        // Draw color scale
        this.drawColorScale(ctx, width, height);
    }
    
    draw3D(ctx, width, height) {
        // Draw 3D wave function or probability density as a 2D slice
        const graphSize = Math.min(width, height) * 0.7;
        const graphX = (width - graphSize) / 2;
        const graphY = (height - graphSize) / 2;
        
        // Draw box
        ctx.strokeStyle = '#888';
        ctx.lineWidth = 2;
        ctx.strokeRect(graphX, graphY, graphSize, graphSize);
        
        // Draw heatmap for the selected slice
        const cellSize = graphSize / this.gridSize;
        
        for (let j = 0; j < this.gridSize; j++) {
            for (let i = 0; i < this.gridSize; i++) {
                const index = j * this.gridSize + i;
                const x = graphX + i * cellSize;
                const y = graphY + j * cellSize;
                
                let color;
                if (this.viewMode === 'wavefunction') {
                    color = this.getColorForWaveFunction(this.waveFunctionData[index]);
                } else {
                    color = this.getColorForProbability(this.probabilityData[index]);
                }
                
                ctx.fillStyle = `rgb(${color.r}, ${color.g}, ${color.b})`;
                ctx.fillRect(x, y, cellSize, cellSize);
            }
        }
        
        // Draw labels
        ctx.fillStyle = '#000';
        ctx.font = '14px Arial';
        if (this.viewMode === 'wavefunction') {
            ctx.fillText(`Wave Function ψ(x,y,z) - ${this.sliceAxis.toUpperCase()} Slice`, width/2 - 120, 20);
        } else if (this.viewMode === 'probability') {
            ctx.fillText(`Probability Density |ψ(x,y,z)|² - ${this.sliceAxis.toUpperCase()} Slice`, width/2 - 140, 20);
        } else {
            ctx.fillText(`Real-time Evolution - ${this.sliceAxis.toUpperCase()} Slice`, width/2 - 110, 20);
        }
        
        // Label axes based on slice
        if (this.sliceAxis === 'x') {
            ctx.fillText('y', graphX + graphSize + 10, graphY + graphSize/2);
            ctx.fillText('z', graphX + graphSize/2, graphY - 10);
        } else if (this.sliceAxis === 'y') {
            ctx.fillText('x', graphX + graphSize + 10, graphY + graphSize/2);
            ctx.fillText('z', graphX + graphSize/2, graphY - 10);
        } else {
            ctx.fillText('x', graphX + graphSize + 10, graphY + graphSize/2);
            ctx.fillText('y', graphX + graphSize/2, graphY - 10);
        }
        
        // Draw quantum numbers
        ctx.fillText(`nx = ${this.nx}, ny = ${this.ny}, nz = ${this.nz}`, 20, 40);
        ctx.fillText(`E = ${this.currentEnergy.toFixed(2)}`, 20, 60);
        ctx.fillText(`${this.sliceAxis} = ${this.slicePosition.toFixed(2)}`, 20, 80);
        
        // Draw color scale
        this.drawColorScale(ctx, width, height);
    }
    
    drawColorScale(ctx, width, height) {
        // Draw color scale for 2D and 3D visualizations
        const scaleWidth = 20;
        const scaleHeight = height * 0.5;
        const scaleX = width - scaleWidth - 20;
        const scaleY = (height - scaleHeight) / 2;
        
        // Draw scale gradient
        const colorScale = this.viewMode === 'wavefunction' ? 
                          this.waveFunctionColorScale : this.probabilityColorScale;
        
        const gradient = ctx.createLinearGradient(0, scaleY, 0, scaleY + scaleHeight);
        
        if (this.viewMode === 'wavefunction') {
            // For wave function: blue (negative) to white (zero) to red (positive)
            gradient.addColorStop(0, `rgb(${colorScale[0].r}, ${colorScale[0].g}, ${colorScale[0].b})`);
            gradient.addColorStop(0.5, `rgb(${colorScale[1].r}, ${colorScale[1].g}, ${colorScale[1].b})`);
            gradient.addColorStop(1, `rgb(${colorScale[2].r}, ${colorScale[2].g}, ${colorScale[2].b})`);
        } else {
            // For probability: black (zero) to blue to cyan to green to yellow to red (max)
            for (let i = 0; i < colorScale.length; i++) {
                gradient.addColorStop(i / (colorScale.length - 1), 
                                     `rgb(${colorScale[i].r}, ${colorScale[i].g}, ${colorScale[i].b})`);
            }
        }
        
        ctx.fillStyle = gradient;
        ctx.fillRect(scaleX, scaleY, scaleWidth, scaleHeight);
        
        // Draw scale border
        ctx.strokeStyle = '#888';
        ctx.lineWidth = 1;
        ctx.strokeRect(scaleX, scaleY, scaleWidth, scaleHeight);
        
        // Draw scale labels
        ctx.fillStyle = '#000';
        ctx.font = '12px Arial';
        
        if (this.viewMode === 'wavefunction') {
            ctx.fillText('-', scaleX - 10, scaleY + 10);
            ctx.fillText('0', scaleX - 10, scaleY + scaleHeight/2);
            ctx.fillText('+', scaleX - 10, scaleY + scaleHeight - 10);
        } else {
            ctx.fillText('0', scaleX - 10, scaleY + 10);
            ctx.fillText('Max', scaleX - 25, scaleY + scaleHeight - 10);
        }
    }
    
    drawEnergyLevels(ctx, width, height) {
        // Draw energy level diagram
        const diagramWidth = 100;
        const diagramHeight = height * 0.7;
        const diagramX = 20;
        const diagramY = (height - diagramHeight) / 2;
        
        // Draw vertical axis
        ctx.beginPath();
        ctx.moveTo(diagramX, diagramY);
        ctx.lineTo(diagramX, diagramY + diagramHeight);
        ctx.strokeStyle = '#888';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Find min and max energy for scaling
        const minEnergy = 0;
        const maxEnergy = Math.max(
            this.energyLevels[this.energyLevels.length - 1].energy,
            this.currentEnergy
        ) * 1.1;
        
        // Draw energy levels
        const energyToY = (energy) => {
            return diagramY + diagramHeight - (energy / maxEnergy) * diagramHeight;
        };
        
        // Draw ground state
        const groundY = energyToY(this.energyLevels[0].energy);
        ctx.beginPath();
        ctx.moveTo(diagramX, groundY);
        ctx.lineTo(diagramX + diagramWidth, groundY);
        ctx.strokeStyle = '#3498db';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Draw energy levels
        for (let i = 1; i < this.energyLevels.length; i++) {
            const level = this.energyLevels[i];
            const y = energyToY(level.energy);
            
            ctx.beginPath();
            ctx.moveTo(diagramX, y);
            ctx.lineTo(diagramX + diagramWidth * 0.8, y);
            ctx.strokeStyle = '#888';
            ctx.lineWidth = 1;
            ctx.stroke();
            
            // Draw degeneracy indicator
            if (level.degeneracy > 1) {
                ctx.fillStyle = '#888';
                ctx.font = '10px Arial';
                ctx.fillText(`(${level.degeneracy}x)`, diagramX + diagramWidth * 0.85, y + 3);
            }
        }
        
        // Highlight current energy level
        const currentY = energyToY(this.currentEnergy);
        ctx.beginPath();
        ctx.moveTo(diagramX, currentY);
        ctx.lineTo(diagramX + diagramWidth, currentY);
        ctx.strokeStyle = '#e74c3c';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Draw arrow pointing to current level
        ctx.beginPath();
        ctx.moveTo(diagramX + diagramWidth + 5, currentY);
        ctx.lineTo(diagramX + diagramWidth + 15, currentY - 5);
        ctx.lineTo(diagramX + diagramWidth + 15, currentY + 5);
        ctx.closePath();
        ctx.fillStyle = '#e74c3c';
        ctx.fill();
        
        // Draw labels
        ctx.fillStyle = '#000';
        ctx.font = '12px Arial';
        ctx.fillText('Energy', diagramX - 10, diagramY - 10);
        ctx.fillText('E = 0', diagramX - 30, diagramY + diagramHeight + 5);
        ctx.fillText(`E = ${maxEnergy.toFixed(1)}`, diagramX - 50, diagramY + 5);
    }
    
    initEnergyChart() {
        const graphCanvas = document.getElementById('energy-graph');
        if (!graphCanvas || !(graphCanvas instanceof HTMLCanvasElement)) {
            console.error('Energy graph canvas not found or not a canvas element');
            return;
        }
        
        const ctx = graphCanvas.getContext('2d');
        this.energyChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: this.energyLevels.map((level, index) => `E${index}`),
                datasets: [{
                    label: 'Energy Levels',
                    data: this.energyLevels.map(level => level.energy),
                    backgroundColor: this.energyLevels.map((level, index) => {
                        // Highlight current state
                        if (this.dimensions === 1 && level.n === this.nx) {
                            return getComputedStyle(document.body).getPropertyValue('--accent-color');
                        } else if (this.dimensions === 2 && level.n === this.nx && level.m === this.ny) {
                            return getComputedStyle(document.body).getPropertyValue('--accent-color');
                        } else if (this.dimensions === 3 && level.n === this.nx && 
                                  level.m === this.ny && level.l === this.nz) {
                            return getComputedStyle(document.body).getPropertyValue('--accent-color');
                        } else {
                            return getComputedStyle(document.body).getPropertyValue('--primary-color');
                        }
                    }),
                    borderColor: 'rgba(0, 0, 0, 0.2)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Energy'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Energy Levels'
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const index = context.dataIndex;
                                const level = this.energyLevels[index];
                                return `${level.label}: E = ${level.energy.toFixed(2)}`;
                            }
                        }
                    }
                }
            }
        });
    }
    
    updateEnergyChart() {
        if (!this.energyChart) return;
        
        // Update chart data
        this.energyChart.data.labels = this.energyLevels.map((level, index) => `E${index}`);
        this.energyChart.data.datasets[0].data = this.energyLevels.map(level => level.energy);
        
        // Update background colors to highlight current state
        this.energyChart.data.datasets[0].backgroundColor = this.energyLevels.map((level, index) => {
            // Highlight current state
            if (this.dimensions === 1 && level.n === this.nx) {
                return getComputedStyle(document.body).getPropertyValue('--accent-color');
            } else if (this.dimensions === 2 && level.n === this.nx && level.m === this.ny) {
                return getComputedStyle(document.body).getPropertyValue('--accent-color');
            } else if (this.dimensions === 3 && level.n === this.nx && 
                      level.m === this.ny && level.l === this.nz) {
                return getComputedStyle(document.body).getPropertyValue('--accent-color');
            } else {
                return getComputedStyle(document.body).getPropertyValue('--primary-color');
            }
        });
        
        // Update chart
        this.energyChart.update();
    }
    
    getEnergy() {
        // For compatibility with the energy chart system
        return {
            kinetic: 0,
            potential: 0,
            total: this.currentEnergy
        };
    }
}
