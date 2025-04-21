class OrbitalMotion {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        
        // Physics constants
        this.G = 6.67430e-11; // Gravitational constant (m^3 kg^-1 s^-2)
        this.scaleFactor = 1e9; // Scale factor for visualization (1 pixel = scaleFactor meters)
        this.timeStep = 3600; // Time step in seconds (default: 1 hour)
        this.timeScale = 1.0; // Time scale multiplier
        this.relativistic = false; // Enable relativistic corrections
        this.collisionsEnabled = true; // Enable collisions between bodies
        
        // Simulation state
        this.bodies = [];
        this.time = 0; // Simulation time in seconds
        this.isPaused = false;
        this.showTrajectories = true;
        this.showVelocityVectors = true;
        this.trajectoryLength = 1000; // Number of points in trajectory
        this.selectedBody = null;
        this.draggingBody = null;
        this.isCreatingBody = false;
        this.newBodyStart = null;
        this.newBodyEnd = null;
        
        // Data for analysis
        this.energyData = {
            time: [],
            kinetic: [],
            potential: [],
            total: []
        };
        this.orbitData = {
            time: [],
            eccentricity: [],
            semiMajorAxis: []
        };
        
        // Presets
        this.presets = {
            solarSystem: () => this.createSolarSystem(),
            earthMoon: () => this.createEarthMoonSystem(),
            binaryStars: () => this.createBinaryStarSystem(),
            threeBodySystem: () => this.createThreeBodySystem(),
            lagrangePoints: () => this.createLagrangePointsSystem()
        };
        
        // UI interaction state
        this.isDragging = false;
        this.dragStartX = 0;
        this.dragStartY = 0;
        this.viewOffsetX = 0;
        this.viewOffsetY = 0;
        this.zoomLevel = 1.0;
        
        // Colors for bodies
        this.bodyColors = [
            '#F4D03F', // Yellow (Sun)
            '#3498DB', // Blue (Earth)
            '#E74C3C', // Red (Mars)
            '#F39C12', // Orange (Jupiter)
            '#9B59B6', // Purple (Saturn)
            '#1ABC9C', // Teal (Uranus)
            '#34495E', // Navy (Neptune)
            '#7F8C8D', // Gray (Moon)
            '#2ECC71', // Green
            '#D35400'  // Dark Orange
        ];
        
        // Define parameters for UI controls
        this.parameters = [
            {
                id: 'gravitationalConstant',
                name: 'Gravitational Constant (G)',
                min: 1e-12,
                max: 1e-9,
                step: 1e-12,
                value: this.G,
                onChange: (value) => {
                    this.G = value;
                }
            },
            {
                id: 'timeStep',
                name: 'Time Step (seconds)',
                min: 60,
                max: 86400,
                step: 60,
                value: this.timeStep,
                onChange: (value) => {
                    this.timeStep = value;
                }
            },
            {
                id: 'timeScale',
                name: 'Time Scale',
                min: 0.1,
                max: 10,
                step: 0.1,
                value: this.timeScale,
                onChange: (value) => {
                    this.timeScale = value;
                }
            },
            {
                id: 'relativistic',
                name: 'Relativistic Corrections',
                type: 'checkbox',
                value: this.relativistic,
                onChange: (value) => {
                    this.relativistic = value;
                }
            },
            {
                id: 'collisions',
                name: 'Enable Collisions',
                type: 'checkbox',
                value: this.collisionsEnabled,
                onChange: (value) => {
                    this.collisionsEnabled = value;
                }
            },
            {
                id: 'trajectories',
                name: 'Show Trajectories',
                type: 'checkbox',
                value: this.showTrajectories,
                onChange: (value) => {
                    this.showTrajectories = value;
                }
            },
            {
                id: 'velocityVectors',
                name: 'Show Velocity Vectors',
                type: 'checkbox',
                value: this.showVelocityVectors,
                onChange: (value) => {
                    this.showVelocityVectors = value;
                }
            },
            {
                id: 'clearBodies',
                name: 'Clear All Bodies',
                type: 'button',
                onClick: () => {
                    this.bodies = [];
                    this.resetDataArrays();
                    return 'Clear Bodies';
                }
            },
            {
                id: 'addBody',
                name: 'Add New Body',
                type: 'button',
                onClick: () => {
                    this.isCreatingBody = true;
                    return 'Click & Drag';
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
                name: 'Reset Simulation',
                type: 'button',
                onClick: () => {
                    this.reset();
                    return 'Reset';
                }
            },
            {
                id: 'preset',
                name: 'Load Preset',
                type: 'select',
                options: [
                    { value: 'solarSystem', label: 'Solar System' },
                    { value: 'earthMoon', label: 'Earth-Moon System' },
                    { value: 'binaryStars', label: 'Binary Stars' },
                    { value: 'threeBodySystem', label: 'Three-Body System' },
                    { value: 'lagrangePoints', label: 'Lagrange Points' }
                ],
                value: 'solarSystem',
                onChange: (value) => {
                    if (this.presets[value]) {
                        this.presets[value]();
                    }
                }
            }
        ];
        
        // Values for display
        this.values = [
            { id: 'time', name: 'Simulation Time', value: 0, precision: 0, unit: 'days' },
            { id: 'bodies', name: 'Number of Bodies', value: 0, precision: 0 },
            { id: 'kineticEnergy', name: 'Kinetic Energy', value: 0, precision: 2, unit: 'J' },
            { id: 'potentialEnergy', name: 'Potential Energy', value: 0, precision: 2, unit: 'J' },
            { id: 'totalEnergy', name: 'Total Energy', value: 0, precision: 2, unit: 'J' },
            { id: 'angularMomentum', name: 'Angular Momentum', value: 0, precision: 2, unit: 'kg·m²/s' }
        ];
        
        // Formulas
        this.formulas = [
            {
                title: 'Newton\'s Law of Gravitation',
                description: 'The force between two masses',
                equation: 'F = G(m₁m₂)/r²'
            },
            {
                title: 'Kepler\'s First Law',
                description: 'Orbits are ellipses with the central body at one focus',
                equation: 'r = a(1-e²)/(1+e·cos(θ))'
            },
            {
                title: 'Kepler\'s Third Law',
                description: 'The square of the orbital period is proportional to the cube of the semi-major axis',
                equation: 'T² = (4π²/GM)a³'
            },
            {
                title: 'Orbital Energy',
                description: 'Total energy of an orbiting body',
                equation: 'E = -GMm/2a'
            }
        ];
        
        // Initialize canvas interaction
        this.setupCanvasInteraction();
        
        // Initialize with solar system
        this.createSolarSystem();
        
        // Initialize energy chart
        this.initEnergyChart();
    }
    
    setupCanvasInteraction() {
        // Mouse down event
        this.canvas.addEventListener('mousedown', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const mouseX = (e.clientX - rect.left) / this.zoomLevel - this.viewOffsetX;
            const mouseY = (e.clientY - rect.top) / this.zoomLevel - this.viewOffsetY;
            
            if (this.isCreatingBody) {
                // Start creating a new body
                this.newBodyStart = { x: mouseX, y: mouseY };
                return;
            }
            
            // Check if clicking on a body
            for (let i = 0; i < this.bodies.length; i++) {
                const body = this.bodies[i];
                const dx = mouseX - body.x;
                const dy = mouseY - body.y;
                const distance = Math.sqrt(dx*dx + dy*dy);
                
                if (distance < body.radius * 1.5) {
                    this.draggingBody = body;
                    this.selectedBody = body;
                    return;
                }
            }
            
            // Start panning the view
            this.isDragging = true;
            this.dragStartX = e.clientX;
            this.dragStartY = e.clientY;
        });
        
        // Mouse move event
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const mouseX = (e.clientX - rect.left) / this.zoomLevel - this.viewOffsetX;
            const mouseY = (e.clientY - rect.top) / this.zoomLevel - this.viewOffsetY;
            
            if (this.isCreatingBody && this.newBodyStart) {
                // Update end point for new body
                this.newBodyEnd = { x: mouseX, y: mouseY };
                return;
            }
            
            if (this.draggingBody) {
                // Move the selected body
                this.draggingBody.x = mouseX;
                this.draggingBody.y = mouseY;
                
                // Clear trajectory when dragging
                this.draggingBody.trajectory = [];
                return;
            }
            
            if (this.isDragging) {
                // Pan the view
                this.viewOffsetX += (e.clientX - this.dragStartX) / this.zoomLevel;
                this.viewOffsetY += (e.clientY - this.dragStartY) / this.zoomLevel;
                this.dragStartX = e.clientX;
                this.dragStartY = e.clientY;
            }
        });
        
        // Mouse up event
        this.canvas.addEventListener('mouseup', (e) => {
            if (this.isCreatingBody && this.newBodyStart && this.newBodyEnd) {
                // Create a new body with velocity based on drag distance and direction
                const dx = this.newBodyEnd.x - this.newBodyStart.x;
                const dy = this.newBodyEnd.y - this.newBodyStart.y;
                const mass = 5.97e24; // Default mass (Earth)
                const vx = dx * 1000; // Scale for reasonable velocity
                const vy = dy * 1000;
                
                this.addBody({
                    x: this.newBodyStart.x,
                    y: this.newBodyStart.y,
                    vx: vx,
                    vy: vy,
                    mass: mass,
                    radius: 10,
                    color: this.bodyColors[this.bodies.length % this.bodyColors.length]
                });
                
                this.isCreatingBody = false;
                this.newBodyStart = null;
                this.newBodyEnd = null;
                
                // Update button text
                const addBodyButton = document.querySelector('#param-addBody');
                if (addBodyButton) {
                    addBodyButton.textContent = 'Add New Body';
                }
            }
            
            this.isDragging = false;
            this.draggingBody = null;
        });
        
        // Mouse wheel for zooming
        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            
            // Calculate zoom factor
            const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
            
            // Get mouse position relative to canvas
            const rect = this.canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            
            // Calculate mouse position in world space before zoom
            const worldX = mouseX / this.zoomLevel - this.viewOffsetX;
            const worldY = mouseY / this.zoomLevel - this.viewOffsetY;
            
            // Apply zoom
            this.zoomLevel *= zoomFactor;
            
            // Limit zoom level
            this.zoomLevel = Math.max(0.1, Math.min(10, this.zoomLevel));
            
            // Calculate new world position after zoom
            const newWorldX = mouseX / this.zoomLevel - this.viewOffsetX;
            const newWorldY = mouseY / this.zoomLevel - this.viewOffsetY;
            
            // Adjust offset to keep mouse position fixed
            this.viewOffsetX += (newWorldX - worldX);
            this.viewOffsetY += (newWorldY - worldY);
        });
    }
    
    reset() {
        // Reset simulation time and data
        this.time = 0;
        this.resetDataArrays();
        
        // Reset bodies to initial positions
        for (const body of this.bodies) {
            body.trajectory = [];
            if (body.initial) {
                body.x = body.initial.x;
                body.y = body.initial.y;
                body.vx = body.initial.vx;
                body.vy = body.initial.vy;
            }
        }
        
        // Reset view
        this.viewOffsetX = 0;
        this.viewOffsetY = 0;
        this.zoomLevel = 1.0;
    }
    
    resetDataArrays() {
        // Reset data arrays
        this.energyData = {
            time: [],
            kinetic: [],
            potential: [],
            total: []
        };
        
        this.orbitData = {
            time: [],
            eccentricity: [],
            semiMajorAxis: []
        };
    }
    
    addBody(bodyData) {
        const body = {
            x: bodyData.x || 0,
            y: bodyData.y || 0,
            vx: bodyData.vx || 0,
            vy: bodyData.vy || 0,
            mass: bodyData.mass || 1e24,
            radius: bodyData.radius || 10,
            color: bodyData.color || '#FFFFFF',
            trajectory: [],
            initial: {
                x: bodyData.x || 0,
                y: bodyData.y || 0,
                vx: bodyData.vx || 0,
                vy: bodyData.vy || 0
            }
        };
        
        this.bodies.push(body);
    }
    
    createSolarSystem() {
        // Clear existing bodies
        this.bodies = [];
        
        // Sun
        this.addBody({
            x: 0,
            y: 0,
            vx: 0,
            vy: 0,
            mass: 1.989e30, // kg
            radius: 30,
            color: '#F4D03F' // Yellow
        });
        
        // Mercury
        this.addBody({
            x: 57.9e9 / this.scaleFactor,
            y: 0,
            vx: 0,
            vy: 47.36e3, // m/s
            mass: 3.3011e23, // kg
            radius: 5,
            color: '#7F8C8D' // Gray
        });
        
        // Venus
        this.addBody({
            x: 108.2e9 / this.scaleFactor,
            y: 0,
            vx: 0,
            vy: 35.02e3, // m/s
            mass: 4.8675e24, // kg
            radius: 9,
            color: '#E67E22' // Orange
        });
        
        // Earth
        this.addBody({
            x: 149.6e9 / this.scaleFactor,
            y: 0,
            vx: 0,
            vy: 29.78e3, // m/s
            mass: 5.97e24, // kg
            radius: 10,
            color: '#3498DB' // Blue
        });
        
        // Mars
        this.addBody({
            x: 227.9e9 / this.scaleFactor,
            y: 0,
            vx: 0,
            vy: 24.07e3, // m/s
            mass: 6.4171e23, // kg
            radius: 8,
            color: '#E74C3C' // Red
        });
        
        // Jupiter
        this.addBody({
            x: 778.5e9 / this.scaleFactor,
            y: 0,
            vx: 0,
            vy: 13.07e3, // m/s
            mass: 1.8982e27, // kg
            radius: 20,
            color: '#F39C12' // Orange
        });
        
        // Reset data arrays
        this.resetDataArrays();
        
        // Reset time
        this.time = 0;
    }
    
    createEarthMoonSystem() {
        // Clear existing bodies
        this.bodies = [];
        
        // Earth
        this.addBody({
            x: 0,
            y: 0,
            vx: 0,
            vy: 0,
            mass: 5.97e24, // kg
            radius: 15,
            color: '#3498DB' // Blue
        });
        
        // Moon
        this.addBody({
            x: 384400e3 / this.scaleFactor,
            y: 0,
            vx: 0,
            vy: 1022, // m/s
            mass: 7.342e22, // kg
            radius: 5,
            color: '#7F8C8D' // Gray
        });
        
        // Reset data arrays
        this.resetDataArrays();
        
        // Reset time
        this.time = 0;
    }
    
    createBinaryStarSystem() {
        // Clear existing bodies
        this.bodies = [];
        
        // Star 1
        this.addBody({
            x: -1e9 / this.scaleFactor,
            y: 0,
            vx: 0,
            vy: -1e4,
            mass: 1.5e30, // kg
            radius: 25,
            color: '#F4D03F' // Yellow
        });
        
        // Star 2
        this.addBody({
            x: 1e9 / this.scaleFactor,
            y: 0,
            vx: 0,
            vy: 1e4,
            mass: 1.2e30, // kg
            radius: 20,
            color: '#E67E22' // Orange
        });
        
        // Planet
        this.addBody({
            x: 0,
            y: 5e9 / this.scaleFactor,
            vx: 2e4,
            vy: 0,
            mass: 5.97e24, // kg
            radius: 8,
            color: '#3498DB' // Blue
        });
        
        // Reset data arrays
        this.resetDataArrays();
        
        // Reset time
        this.time = 0;
    }
    
    createThreeBodySystem() {
        // Clear existing bodies
        this.bodies = [];
        
        // Body 1
        this.addBody({
            x: 0,
            y: 0,
            vx: 0,
            vy: 0,
            mass: 1e30, // kg
            radius: 20,
            color: '#F4D03F' // Yellow
        });
        
        // Body 2
        this.addBody({
            x: 3e9 / this.scaleFactor,
            y: 0,
            vx: 0,
            vy: 2e4,
            mass: 1e30, // kg
            radius: 20,
            color: '#E74C3C' // Red
        });
        
        // Body 3
        this.addBody({
            x: -3e9 / this.scaleFactor,
            y: 0,
            vx: 0,
            vy: -2e4,
            mass: 1e30, // kg
            radius: 20,
            color: '#3498DB' // Blue
        });
        
        // Reset data arrays
        this.resetDataArrays();
        
        // Reset time
        this.time = 0;
    }
    
    createLagrangePointsSystem() {
        // Clear existing bodies
        this.bodies = [];
        
        // Primary (Sun-like)
        this.addBody({
            x: -1e9 / this.scaleFactor,
            y: 0,
            vx: 0,
            vy: -3e3,
            mass: 1.989e30, // kg
            radius: 25,
            color: '#F4D03F' // Yellow
        });
        
        // Secondary (Jupiter-like)
        this.addBody({
            x: 5e9 / this.scaleFactor,
            y: 0,
            vx: 0,
            vy: 1.3e4,
            mass: 1.8982e27, // kg
            radius: 15,
            color: '#F39C12' // Orange
        });
        
        // L4 Trojan
        this.addBody({
            x: 2.5e9 / this.scaleFactor,
            y: 4.33e9 / this.scaleFactor, // 60 degrees ahead
            vx: -1.3e4 * 0.5,
            vy: 1.3e4 * 0.866,
            mass: 1e20, // kg
            radius: 5,
            color: '#3498DB' // Blue
        });
        
        // L5 Trojan
        this.addBody({
            x: 2.5e9 / this.scaleFactor,
            y: -4.33e9 / this.scaleFactor, // 60 degrees behind
            vx: 1.3e4 * 0.5,
            vy: 1.3e4 * 0.866,
            mass: 1e20, // kg
            radius: 5,
            color: '#2ECC71' // Green
        });
        
        // Reset data arrays
        this.resetDataArrays();
        
        // Reset time
        this.time = 0;
    }
    
    update(dt) {
        if (this.isPaused) return;
        
        // Apply time scaling
        const scaledTimeStep = this.timeStep * this.timeScale;
        
        // Update simulation using RK4 integration
        this.updatePhysics(scaledTimeStep);
        
        // Update time
        this.time += scaledTimeStep;
        
        // Update values
        this.updateValues();
        
        // Store energy data periodically (every 10 steps)
        if (this.time % (this.timeStep * 10) < this.timeStep) {
            this.storeEnergyData();
        }
        
        // Update energy chart
        this.updateEnergyChart();
        
        // Draw simulation
        this.draw();
    }
    
    updatePhysics(dt) {
        // Implement 4th order Runge-Kutta method for N-body problem
        const n = this.bodies.length;
        
        // Arrays to store intermediate values
        const k1 = Array(n).fill().map(() => ({ dx: 0, dy: 0, dvx: 0, dvy: 0 }));
        const k2 = Array(n).fill().map(() => ({ dx: 0, dy: 0, dvx: 0, dvy: 0 }));
        const k3 = Array(n).fill().map(() => ({ dx: 0, dy: 0, dvx: 0, dvy: 0 }));
        const k4 = Array(n).fill().map(() => ({ dx: 0, dy: 0, dvx: 0, dvy: 0 }));
        
        // Temporary arrays for intermediate positions and velocities
        const tempX = Array(n).fill(0);
        const tempY = Array(n).fill(0);
        const tempVx = Array(n).fill(0);
        const tempVy = Array(n).fill(0);
        
        // Don't update dragged bodies
        const skipUpdate = Array(n).fill(false);
        if (this.draggingBody) {
            const index = this.bodies.indexOf(this.draggingBody);
            if (index !== -1) {
                skipUpdate[index] = true;
            }
        }
        
        // Step 1: Calculate k1 = f(t, y)
        for (let i = 0; i < n; i++) {
            if (skipUpdate[i]) continue;
            
            const body = this.bodies[i];
            k1[i].dx = body.vx;
            k1[i].dy = body.vy;
            
            let ax = 0, ay = 0;
            for (let j = 0; j < n; j++) {
                if (i === j) continue;
                
                const otherBody = this.bodies[j];
                const dx = otherBody.x - body.x;
                const dy = otherBody.y - body.y;
                const distSq = dx*dx + dy*dy;
                const dist = Math.sqrt(distSq);
                
                // Force magnitude (F = G*m1*m2/r^2)
                let forceMag = this.G * body.mass * otherBody.mass / distSq;
                
                // Apply relativistic correction if enabled
                if (this.relativistic) {
                    // Approximate correction based on perihelion precession
                    const c = 299792458; // Speed of light (m/s)
                    const relCorr = 1 + 3 * this.G * otherBody.mass / (c*c * dist);
                    forceMag *= relCorr;
                }
                
                // Components of acceleration (a = F/m)
                ax += forceMag * dx / (dist * body.mass);
                ay += forceMag * dy / (dist * body.mass);
            }
            
            k1[i].dvx = ax;
            k1[i].dvy = ay;
        }
        
        // Step 2: Calculate k2 = f(t + dt/2, y + dt/2 * k1)
        for (let i = 0; i < n; i++) {
            if (skipUpdate[i]) continue;
            
            const body = this.bodies[i];
            tempX[i] = body.x + k1[i].dx * dt/2;
            tempY[i] = body.y + k1[i].dy * dt/2;
            tempVx[i] = body.vx + k1[i].dvx * dt/2;
            tempVy[i] = body.vy + k1[i].dvy * dt/2;
            
            k2[i].dx = tempVx[i];
            k2[i].dy = tempVy[i];
        }
        
        for (let i = 0; i < n; i++) {
            if (skipUpdate[i]) continue;
            
            const body = this.bodies[i];
            let ax = 0, ay = 0;
            
            for (let j = 0; j < n; j++) {
                if (i === j) continue;
                
                const otherBody = this.bodies[j];
                const otherX = skipUpdate[j] ? otherBody.x : tempX[j];
                const otherY = skipUpdate[j] ? otherBody.y : tempY[j];
                
                const dx = otherX - tempX[i];
                const dy = otherY - tempY[i];
                const distSq = dx*dx + dy*dy;
                const dist = Math.sqrt(distSq);
                
                let forceMag = this.G * body.mass * otherBody.mass / distSq;
                
                if (this.relativistic) {
                    const c = 299792458;
                    const relCorr = 1 + 3 * this.G * otherBody.mass / (c*c * dist);
                    forceMag *= relCorr;
                }
                
                ax += forceMag * dx / (dist * body.mass);
                ay += forceMag * dy / (dist * body.mass);
            }
            
            k2[i].dvx = ax;
            k2[i].dvy = ay;
        }
        
        // Step 3: Calculate k3 = f(t + dt/2, y + dt/2 * k2)
        for (let i = 0; i < n; i++) {
            if (skipUpdate[i]) continue;
            
            const body = this.bodies[i];
            tempX[i] = body.x + k2[i].dx * dt/2;
            tempY[i] = body.y + k2[i].dy * dt/2;
            tempVx[i] = body.vx + k2[i].dvx * dt/2;
            tempVy[i] = body.vy + k2[i].dvy * dt/2;
            
            k3[i].dx = tempVx[i];
            k3[i].dy = tempVy[i];
        }
        
        for (let i = 0; i < n; i++) {
            if (skipUpdate[i]) continue;
            
            const body = this.bodies[i];
            let ax = 0, ay = 0;
            
            for (let j = 0; j < n; j++) {
                if (i === j) continue;
                
                const otherBody = this.bodies[j];
                const otherX = skipUpdate[j] ? otherBody.x : tempX[j];
                const otherY = skipUpdate[j] ? otherBody.y : tempY[j];
                
                const dx = otherX - tempX[i];
                const dy = otherY - tempY[i];
                const distSq = dx*dx + dy*dy;
                const dist = Math.sqrt(distSq);
                
                let forceMag = this.G * body.mass * otherBody.mass / distSq;
                
                if (this.relativistic) {
                    const c = 299792458;
                    const relCorr = 1 + 3 * this.G * otherBody.mass / (c*c * dist);
                    forceMag *= relCorr;
                }
                
                ax += forceMag * dx / (dist * body.mass);
                ay += forceMag * dy / (dist * body.mass);
            }
            
            k3[i].dvx = ax;
            k3[i].dvy = ay;
        }
        
        // Step 4: Calculate k4 = f(t + dt, y + dt * k3)
        for (let i = 0; i < n; i++) {
            if (skipUpdate[i]) continue;
            
            const body = this.bodies[i];
            tempX[i] = body.x + k3[i].dx * dt;
            tempY[i] = body.y + k3[i].dy * dt;
            tempVx[i] = body.vx + k3[i].dvx * dt;
            tempVy[i] = body.vy + k3[i].dvy * dt;
            
            k4[i].dx = tempVx[i];
            k4[i].dy = tempVy[i];
        }
        
        for (let i = 0; i < n; i++) {
            if (skipUpdate[i]) continue;
            
            const body = this.bodies[i];
            let ax = 0, ay = 0;
            
            for (let j = 0; j < n; j++) {
                if (i === j) continue;
                
                const otherBody = this.bodies[j];
                const otherX = skipUpdate[j] ? otherBody.x : tempX[j];
                const otherY = skipUpdate[j] ? otherBody.y : tempY[j];
                
                const dx = otherX - tempX[i];
                const dy = otherY - tempY[i];
                const distSq = dx*dx + dy*dy;
                const dist = Math.sqrt(distSq);
                
                let forceMag = this.G * body.mass * otherBody.mass / distSq;
                
                if (this.relativistic) {
                    const c = 299792458;
                    const relCorr = 1 + 3 * this.G * otherBody.mass / (c*c * dist);
                    forceMag *= relCorr;
                }
                
                ax += forceMag * dx / (dist * body.mass);
                ay += forceMag * dy / (dist * body.mass);
            }
            
            k4[i].dvx = ax;
            k4[i].dvy = ay;
        }
        
        // Step 5: Combine results to update positions and velocities
        for (let i = 0; i < n; i++) {
            if (skipUpdate[i]) continue;
            
            const body = this.bodies[i];
            
            // Update position: y(t+dt) = y(t) + dt/6 * (k1 + 2*k2 + 2*k3 + k4)
            body.x += dt/6 * (k1[i].dx + 2*k2[i].dx + 2*k3[i].dx + k4[i].dx);
            body.y += dt/6 * (k1[i].dy + 2*k2[i].dy + 2*k3[i].dy + k4[i].dy);
            
            // Update velocity
            body.vx += dt/6 * (k1[i].dvx + 2*k2[i].dvx + 2*k3[i].dvx + k4[i].dvx);
            body.vy += dt/6 * (k1[i].dvy + 2*k2[i].dvy + 2*k3[i].dvy + k4[i].dvy);
            
            // Store trajectory point
            if (this.showTrajectories) {
                body.trajectory.push({ x: body.x, y: body.y });
                
                // Limit trajectory length
                if (body.trajectory.length > this.trajectoryLength) {
                    body.trajectory.shift();
                }
            }
        }
        
        // Check for collisions
        if (this.collisionsEnabled) {
            this.handleCollisions();
        }
    }
    
    handleCollisions() {
        const collidedBodies = new Set();
        
        for (let i = 0; i < this.bodies.length; i++) {
            if (collidedBodies.has(i)) continue;
            
            const body1 = this.bodies[i];
            
            for (let j = i + 1; j < this.bodies.length; j++) {
                if (collidedBodies.has(j)) continue;
                
                const body2 = this.bodies[j];
                
                const dx = body2.x - body1.x;
                const dy = body2.y - body1.y;
                const distance = Math.sqrt(dx*dx + dy*dy);
                
                // Check for collision
                if (distance < body1.radius + body2.radius) {
                    // Mark bodies as collided
                    collidedBodies.add(i);
                    collidedBodies.add(j);
                    
                    // Create new body from collision
                    const totalMass = body1.mass + body2.mass;
                    const newX = (body1.x * body1.mass + body2.x * body2.mass) / totalMass;
                    const newY = (body1.y * body1.mass + body2.y * body2.mass) / totalMass;
                    
                    // Conserve momentum
                    const newVx = (body1.vx * body1.mass + body2.vx * body2.mass) / totalMass;
                    const newVy = (body1.vy * body1.mass + body2.vy * body2.mass) / totalMass;
                    
                    // New radius based on conservation of volume
                    const newRadius = Math.pow(
                        Math.pow(body1.radius, 3) + Math.pow(body2.radius, 3),
                        1/3
                    );
                    
                    // Create new body
                    const newBody = {
                        x: newX,
                        y: newY,
                        vx: newVx,
                        vy: newVy,
                        mass: totalMass,
                        radius: newRadius,
                        color: body1.mass > body2.mass ? body1.color : body2.color,
                        trajectory: [],
                        initial: {
                            x: newX,
                            y: newY,
                            vx: newVx,
                            vy: newVy
                        }
                    };
                    
                    // Add new body to list
                    this.bodies.push(newBody);
                    
                    // If selected body was involved, select the new body
                    if (this.selectedBody === body1 || this.selectedBody === body2) {
                        this.selectedBody = newBody;
                    }
                    
                    break; // Process one collision at a time
                }
            }
        }
        
        // Remove collided bodies
        if (collidedBodies.size > 0) {
            this.bodies = this.bodies.filter((_, index) => !collidedBodies.has(index));
        }
    }
    
    calculateOrbitalElements() {
        // Calculate orbital elements for the selected body
        if (!this.selectedBody || this.bodies.length < 2) return null;
        
        // Find the most massive body as the central body
        let centralBody = this.bodies[0];
        for (const body of this.bodies) {
            if (body.mass > centralBody.mass) {
                centralBody = body;
            }
        }
        
        if (this.selectedBody === centralBody) return null;
        
        // Calculate relative position and velocity
        const rx = this.selectedBody.x - centralBody.x;
        const ry = this.selectedBody.y - centralBody.y;
        const vx = this.selectedBody.vx - centralBody.vx;
        const vy = this.selectedBody.vy - centralBody.vy;
        
        const r = Math.sqrt(rx*rx + ry*ry);
        const v = Math.sqrt(vx*vx + vy*vy);
        
        // Calculate specific angular momentum
        const h = rx * vy - ry * vx;
        
        // Calculate standard gravitational parameter
        const mu = this.G * (centralBody.mass + this.selectedBody.mass);
        
        // Calculate specific orbital energy
        const energy = 0.5 * v*v - mu / r;
        
        // Calculate semi-major axis
        const a = -mu / (2 * energy);
        
        // Calculate eccentricity vector
        const ex = ((v*v - mu/r) * rx - (rx*vx + ry*vy) * vx) / mu;
        const ey = ((v*v - mu/r) * ry - (rx*vx + ry*vy) * vy) / mu;
        const e = Math.sqrt(ex*ex + ey*ey);
        
        // Calculate orbital period
        const period = 2 * Math.PI * Math.sqrt(a*a*a / mu);
        
        return {
            semiMajorAxis: a,
            eccentricity: e,
            period: period,
            specificAngularMomentum: h,
            specificOrbitalEnergy: energy
        };
    }
    
    updateValues() {
        // Update simulation time (in days)
        this.values.find(v => v.id === 'time').value = this.time / 86400;
        
        // Update number of bodies
        this.values.find(v => v.id === 'bodies').value = this.bodies.length;
        
        // Calculate energies
        let kineticEnergy = 0;
        let potentialEnergy = 0;
        
        for (let i = 0; i < this.bodies.length; i++) {
            const body1 = this.bodies[i];
            
            // Kinetic energy: 0.5 * m * v^2
            const v2 = body1.vx*body1.vx + body1.vy*body1.vy;
            kineticEnergy += 0.5 * body1.mass * v2;
            
            // Potential energy: -G * m1 * m2 / r
            for (let j = i + 1; j < this.bodies.length; j++) {
                const body2 = this.bodies[j];
                const dx = body2.x - body1.x;
                const dy = body2.y - body1.y;
                const r = Math.sqrt(dx*dx + dy*dy) * this.scaleFactor;
                
                potentialEnergy -= this.G * body1.mass * body2.mass / r;
            }
        }
        
        // Update energy values
        this.values.find(v => v.id === 'kineticEnergy').value = kineticEnergy;
        this.values.find(v => v.id === 'potentialEnergy').value = potentialEnergy;
        this.values.find(v => v.id === 'totalEnergy').value = kineticEnergy + potentialEnergy;
        
        // Calculate angular momentum
        let angularMomentum = 0;
        for (const body of this.bodies) {
            // L = m * (r × v)
            angularMomentum += body.mass * (body.x * body.vy - body.y * body.vx);
        }
        
        this.values.find(v => v.id === 'angularMomentum').value = angularMomentum;
    }
    
    storeEnergyData() {
        // Store energy data for plotting
        const kineticEnergy = this.values.find(v => v.id === 'kineticEnergy').value;
        const potentialEnergy = this.values.find(v => v.id === 'potentialEnergy').value;
        const totalEnergy = kineticEnergy + potentialEnergy;
        
        this.energyData.time.push(this.time / 86400); // Convert to days
        this.energyData.kinetic.push(kineticEnergy);
        this.energyData.potential.push(potentialEnergy);
        this.energyData.total.push(totalEnergy);
        
        // Limit data points
        if (this.energyData.time.length > 100) {
            this.energyData.time.shift();
            this.energyData.kinetic.shift();
            this.energyData.potential.shift();
            this.energyData.total.shift();
        }
        
        // Store orbital data if a body is selected
        const orbitalElements = this.calculateOrbitalElements();
        if (orbitalElements) {
            this.orbitData.time.push(this.time / 86400);
            this.orbitData.eccentricity.push(orbitalElements.eccentricity);
            this.orbitData.semiMajorAxis.push(orbitalElements.semiMajorAxis);
            
            // Limit data points
            if (this.orbitData.time.length > 100) {
                this.orbitData.time.shift();
                this.orbitData.eccentricity.shift();
                this.orbitData.semiMajorAxis.shift();
            }
        }
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
        
        // Set transform for zoom and pan
        ctx.save();
        ctx.translate(width/2, height/2);
        ctx.scale(this.zoomLevel, this.zoomLevel);
        ctx.translate(-width/2 + this.viewOffsetX, -height/2 + this.viewOffsetY);
        
        // Draw trajectories
        if (this.showTrajectories) {
            for (const body of this.bodies) {
                if (body.trajectory.length < 2) continue;
                
                ctx.beginPath();
                ctx.moveTo(body.trajectory[0].x, body.trajectory[0].y);
                
                for (let i = 1; i < body.trajectory.length; i++) {
                    ctx.lineTo(body.trajectory[i].x, body.trajectory[i].y);
                }
                
                ctx.strokeStyle = body.color;
                ctx.globalAlpha = 0.5;
                ctx.lineWidth = 1;
                ctx.stroke();
                ctx.globalAlpha = 1.0;
            }
        }
        
        // Draw bodies
        for (const body of this.bodies) {
            // Draw body
            ctx.beginPath();
            ctx.arc(body.x, body.y, body.radius, 0, Math.PI * 2);
            ctx.fillStyle = body.color;
            ctx.fill();
            
            // Draw highlight for selected body
            if (body === this.selectedBody) {
                ctx.beginPath();
                ctx.arc(body.x, body.y, body.radius * 1.2, 0, Math.PI * 2);
                ctx.strokeStyle = '#FFFFFF';
                ctx.lineWidth = 2;
                ctx.stroke();
            }
            
            // Draw velocity vector
            if (this.showVelocityVectors) {
                const velocityScale = 0.1; // Scale factor for velocity vectors
                const vx = body.vx * velocityScale;
                const vy = body.vy * velocityScale;
                
                ctx.beginPath();
                ctx.moveTo(body.x, body.y);
                ctx.lineTo(body.x + vx, body.y + vy);
                ctx.strokeStyle = '#FFFFFF';
                ctx.lineWidth = 1;
                ctx.stroke();
                
                // Draw arrowhead
                const angle = Math.atan2(vy, vx);
                const arrowSize = 5;
                
                ctx.beginPath();
                ctx.moveTo(body.x + vx, body.y + vy);
                ctx.lineTo(
                    body.x + vx - arrowSize * Math.cos(angle - Math.PI/6),
                    body.y + vy - arrowSize * Math.sin(angle - Math.PI/6)
                );
                ctx.lineTo(
                    body.x + vx - arrowSize * Math.cos(angle + Math.PI/6),
                    body.y + vy - arrowSize * Math.sin(angle + Math.PI/6)
                );
                ctx.closePath();
                ctx.fillStyle = '#FFFFFF';
                ctx.fill();
            }
        }
        
        // Draw new body creation line
        if (this.isCreatingBody && this.newBodyStart && this.newBodyEnd) {
            ctx.beginPath();
            ctx.moveTo(this.newBodyStart.x, this.newBodyStart.y);
            ctx.lineTo(this.newBodyEnd.x, this.newBodyEnd.y);
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // Draw arrowhead
            const dx = this.newBodyEnd.x - this.newBodyStart.x;
            const dy = this.newBodyEnd.y - this.newBodyStart.y;
            const angle = Math.atan2(dy, dx);
            const arrowSize = 10;
            
            ctx.beginPath();
            ctx.moveTo(this.newBodyEnd.x, this.newBodyEnd.y);
            ctx.lineTo(
                this.newBodyEnd.x - arrowSize * Math.cos(angle - Math.PI/6),
                this.newBodyEnd.y - arrowSize * Math.sin(angle - Math.PI/6)
            );
            ctx.lineTo(
                this.newBodyEnd.x - arrowSize * Math.cos(angle + Math.PI/6),
                this.newBodyEnd.y - arrowSize * Math.sin(angle + Math.PI/6)
            );
            ctx.closePath();
            ctx.fillStyle = '#FFFFFF';
            ctx.fill();
        }
        
        // Restore transform
        ctx.restore();
        
        // Draw info for selected body
        if (this.selectedBody) {
            const body = this.selectedBody;
            const info = [
                `Mass: ${(body.mass / 1e24).toFixed(2)} × 10²⁴ kg`,
                `Position: (${body.x.toFixed(0)}, ${body.y.toFixed(0)})`,
                `Velocity: ${Math.sqrt(body.vx*body.vx + body.vy*body.vy).toFixed(2)} m/s`
            ];
            
            // Calculate orbital elements if applicable
            const orbitalElements = this.calculateOrbitalElements();
            if (orbitalElements) {
                info.push(`Semi-major axis: ${(orbitalElements.semiMajorAxis * this.scaleFactor / 1e9).toFixed(2)} million km`);
                info.push(`Eccentricity: ${orbitalElements.eccentricity.toFixed(4)}`);
                info.push(`Period: ${(orbitalElements.period / 86400).toFixed(2)} days`);
            }
            
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(10, 10, 250, 20 + info.length * 20);
            
            ctx.fillStyle = '#FFFFFF';
            ctx.font = '14px Arial';
            ctx.fillText(`Selected Body`, 20, 25);
            
            for (let i = 0; i < info.length; i++) {
                ctx.fillText(info[i], 20, 45 + i * 20);
            }
        }
        
        // Draw simulation info
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(width - 200, 10, 190, 60);
        
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '14px Arial';
        ctx.fillText(`Time: ${(this.time / 86400).toFixed(1)} days`, width - 190, 30);
        ctx.fillText(`Bodies: ${this.bodies.length}`, width - 190, 50);
        
        // Draw help text
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(width - 200, height - 100, 190, 90);
        
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '12px Arial';
        ctx.fillText('Controls:', width - 190, height - 80);
        ctx.fillText('Click & drag to pan view', width - 190, height - 60);
        ctx.fillText('Mouse wheel to zoom', width - 190, height - 40);
        ctx.fillText('Click on body to select', width - 190, height - 20);
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
                            text: 'Time (days)'
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
    
    getEnergy() {
        // For compatibility with the energy chart system
        return {
            kinetic: this.values.find(v => v.id === 'kineticEnergy').value,
            potential: this.values.find(v => v.id === 'potentialEnergy').value,
            total: this.values.find(v => v.id === 'totalEnergy').value
        };
    }
}
