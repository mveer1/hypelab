class GravitationalLensing {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        
        // Physical constants
        this.c = 299792458; // Speed of light (m/s)
        this.G = 6.67430e-11; // Gravitational constant (m^3 kg^-1 s^-2)
        
        // Simulation parameters
        this.lensMass = 1e12 * 1.989e30; // Mass of lens in kg (default: 1e12 solar masses - galaxy scale)
        this.lensDistance = 1e9 * 3.086e16; // Distance to lens in m (default: 1 billion parsecs)
        this.sourceDistance = 2e9 * 3.086e16; // Distance to source in m (default: 2 billion parsecs)
        this.lensPosition = { x: 0, y: 0 }; // Position of lens in canvas coordinates
        this.sourcePosition = { x: 0, y: 0 }; // Position of source in canvas coordinates
        this.lensProfile = 'pointMass'; // 'pointMass', 'spherical', 'NFW', 'SIS'
        this.lensRadius = 50; // Radius of extended lens (pixels)
        this.lensEllipticity = 0; // Ellipticity of lens (0 = circular)
        this.lensOrientation = 0; // Orientation angle of elliptical lens (radians)
        
        // Visualization parameters
        this.zoom = 1.0; // Zoom level
        this.viewOffsetX = 0; // View offset in x direction
        this.viewOffsetY = 0; // View offset in y direction
        this.pixelScale = 1e16; // Meters per pixel at zoom=1
        this.showRays = true; // Show light ray trajectories
        this.showEinsteinRadius = true; // Show Einstein radius
        this.showCaustics = false; // Show caustic lines
        this.showCriticalCurves = false; // Show critical curves
        this.showMagnificationMap = false; // Show magnification map
        this.sourceType = 'galaxy'; // 'point', 'galaxy', 'quasar', 'custom'
        this.sourceSize = 20; // Size of source in pixels
        this.sourceImage = null; // Background source image
        this.backgroundImage = null; // Background starfield image
        
        // Ray tracing parameters
        this.rayDensity = 1.0; // Density of rays for tracing (0.1 to 2.0)
        this.maxRaySteps = 1000; // Maximum number of steps for ray tracing
        this.rayStepSize = 0.1; // Step size for ray tracing
        
        // Calculated values
        this.einsteinRadius = 0; // Einstein radius in pixels
        this.einsteinRadiusPhysical = 0; // Einstein radius in meters
        this.deflectionMap = null; // Pre-computed deflection map
        this.magnificationMap = null; // Pre-computed magnification map
        
        // Interaction state
        this.isDraggingLens = false;
        this.isDraggingSource = false;
        this.isDraggingView = false;
        this.dragStartX = 0;
        this.dragStartY = 0;
        
        // Animation state
        this.isAnimating = false;
        this.animationTime = 0;
        this.animationSpeed = 1.0;
        
        // Performance optimization
        this.needsRecalculation = true;
        this.cachedImage = null;
        
        // Define parameters for UI controls
        this.parameters = [
            {
                id: 'lensMass',
                name: 'Lens Mass (Solar Masses)',
                min: 1e8,
                max: 1e14,
                step: 1e8,
                value: this.lensMass / 1.989e30,
                onChange: (value) => {
                    this.lensMass = value * 1.989e30;
                    this.calculateEinsteinRadius();
                    this.needsRecalculation = true;
                }
            },
            {
                id: 'lensDistance',
                name: 'Lens Distance (Mpc)',
                min: 100,
                max: 5000,
                step: 100,
                value: this.lensDistance / (3.086e16 * 1e6),
                onChange: (value) => {
                    this.lensDistance = value * 3.086e16 * 1e6;
                    this.calculateEinsteinRadius();
                    this.needsRecalculation = true;
                }
            },
            {
                id: 'sourceDistance',
                name: 'Source Distance (Mpc)',
                min: 500,
                max: 10000,
                step: 100,
                value: this.sourceDistance / (3.086e16 * 1e6),
                onChange: (value) => {
                    this.sourceDistance = value * 3.086e16 * 1e6;
                    this.calculateEinsteinRadius();
                    this.needsRecalculation = true;
                }
            },
            {
                id: 'lensProfile',
                name: 'Lens Profile',
                type: 'select',
                options: [
                    { value: 'pointMass', label: 'Point Mass' },
                    { value: 'spherical', label: 'Spherical' },
                    { value: 'NFW', label: 'NFW Profile' },
                    { value: 'SIS', label: 'Singular Isothermal Sphere' }
                ],
                value: this.lensProfile,
                onChange: (value) => {
                    this.lensProfile = value;
                    this.needsRecalculation = true;
                }
            },
            {
                id: 'lensRadius',
                name: 'Lens Radius (kpc)',
                min: 1,
                max: 500,
                step: 1,
                value: this.lensRadius,
                onChange: (value) => {
                    this.lensRadius = value;
                    this.needsRecalculation = true;
                }
            },
            {
                id: 'lensEllipticity',
                name: 'Lens Ellipticity',
                min: 0,
                max: 0.9,
                step: 0.01,
                value: this.lensEllipticity,
                onChange: (value) => {
                    this.lensEllipticity = value;
                    this.needsRecalculation = true;
                }
            },
            {
                id: 'lensOrientation',
                name: 'Lens Orientation (°)',
                min: 0,
                max: 180,
                step: 1,
                value: this.lensOrientation * 180 / Math.PI,
                onChange: (value) => {
                    this.lensOrientation = value * Math.PI / 180;
                    this.needsRecalculation = true;
                }
            },
            {
                id: 'sourceType',
                name: 'Source Type',
                type: 'select',
                options: [
                    { value: 'point', label: 'Point Source' },
                    { value: 'galaxy', label: 'Galaxy' },
                    { value: 'quasar', label: 'Quasar' },
                    { value: 'custom', label: 'Custom Image' }
                ],
                value: this.sourceType,
                onChange: (value) => {
                    this.sourceType = value;
                    this.loadSourceImage();
                    this.needsRecalculation = true;
                }
            },
            {
                id: 'sourceSize',
                name: 'Source Size (kpc)',
                min: 1,
                max: 100,
                step: 1,
                value: this.sourceSize,
                onChange: (value) => {
                    this.sourceSize = value;
                    this.needsRecalculation = true;
                }
            },
            {
                id: 'rayDensity',
                name: 'Ray Density',
                min: 0.1,
                max: 2.0,
                step: 0.1,
                value: this.rayDensity,
                onChange: (value) => {
                    this.rayDensity = value;
                    this.needsRecalculation = true;
                }
            },
            {
                id: 'showRays',
                name: 'Show Light Rays',
                type: 'checkbox',
                value: this.showRays,
                onChange: (value) => {
                    this.showRays = value;
                    this.needsRecalculation = true;
                }
            },
            {
                id: 'showEinsteinRadius',
                name: 'Show Einstein Radius',
                type: 'checkbox',
                value: this.showEinsteinRadius,
                onChange: (value) => {
                    this.showEinsteinRadius = value;
                }
            },
            {
                id: 'showCaustics',
                name: 'Show Caustics',
                type: 'checkbox',
                value: this.showCaustics,
                onChange: (value) => {
                    this.showCaustics = value;
                    if (value) this.calculateCaustics();
                }
            },
            {
                id: 'showCriticalCurves',
                name: 'Show Critical Curves',
                type: 'checkbox',
                value: this.showCriticalCurves,
                onChange: (value) => {
                    this.showCriticalCurves = value;
                    if (value) this.calculateCriticalCurves();
                }
            },
            {
                id: 'showMagnificationMap',
                name: 'Show Magnification Map',
                type: 'checkbox',
                value: this.showMagnificationMap,
                onChange: (value) => {
                    this.showMagnificationMap = value;
                    if (value) this.calculateMagnificationMap();
                }
            },
            {
                id: 'animate',
                name: 'Animate Source',
                type: 'checkbox',
                value: this.isAnimating,
                onChange: (value) => {
                    this.isAnimating = value;
                    this.animationTime = 0;
                }
            },
            {
                id: 'animationSpeed',
                name: 'Animation Speed',
                min: 0.1,
                max: 5.0,
                step: 0.1,
                value: this.animationSpeed,
                onChange: (value) => {
                    this.animationSpeed = value;
                }
            },
            {
                id: 'reset',
                name: 'Reset View',
                type: 'button',
                onClick: () => {
                    this.resetView();
                    return 'Reset View';
                }
            }
        ];
        
        // Values for display
        this.values = [
            { id: 'einsteinRadius', name: 'Einstein Radius', value: 0, precision: 2, unit: 'kpc' },
            { id: 'magnification', name: 'Magnification', value: 0, precision: 2 },
            { id: 'deflectionAngle', name: 'Deflection Angle', value: 0, precision: 4, unit: 'arcsec' },
            { id: 'timeDelay', name: 'Time Delay', value: 0, precision: 2, unit: 'days' },
            { id: 'lensRedshift', name: 'Lens Redshift', value: 0.5, precision: 2 },
            { id: 'sourceRedshift', name: 'Source Redshift', value: 2.0, precision: 2 }
        ];
        
        // Formulas
        this.formulas = [
            {
                title: 'Deflection Angle',
                description: 'The angle by which light is bent by a gravitational field',
                equation: 'α = 4GM/(c²r)'
            },
            {
                title: 'Einstein Radius',
                description: 'The radius of the Einstein ring formed when source, lens, and observer are perfectly aligned',
                equation: 'θE = √(4GM/c² · DLS/(DS·DL))'
            },
            {
                title: 'Lens Equation',
                description: 'Relates the true position of the source to its apparent position',
                equation: 'β = θ - α(θ)'
            },
            {
                title: 'Magnification',
                description: 'The ratio of the flux of the image to the flux of the unlensed source',
                equation: 'μ = 1/((1-κ)² - γ²)'
            }
        ];
        
        // Initialize
        this.setupCanvasInteraction();
        this.loadImages();
        this.calculateEinsteinRadius();
        this.initEnergyChart();
    }
    
    resetView() {
        this.zoom = 1.0;
        this.viewOffsetX = 0;
        this.viewOffsetY = 0;
        this.lensPosition = { x: 0, y: 0 };
        this.sourcePosition = { x: 0, y: 0 };
        this.needsRecalculation = true;
    }
    
    loadImages() {
        // Load background starfield
        this.backgroundImage = new Image();
        this.backgroundImage.src = 'assets/starfield.jpg';
        this.backgroundImage.onload = () => {
            this.needsRecalculation = true;
        };
        
        // Load source image based on type
        this.loadSourceImage();
    }
    
    loadSourceImage() {
        this.sourceImage = new Image();
        
        switch (this.sourceType) {
            case 'galaxy':
                this.sourceImage.src = 'assets/galaxy.png';
                break;
            case 'quasar':
                this.sourceImage.src = 'assets/quasar.png';
                break;
            case 'custom':
                this.sourceImage.src = 'assets/custom_source.png';
                break;
            case 'point':
            default:
                // Create a simple point source
                const canvas = document.createElement('canvas');
                canvas.width = 32;
                canvas.height = 32;
                const ctx = canvas.getContext('2d');
                const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
                gradient.addColorStop(0, 'white');
                gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, 32, 32);
                this.sourceImage.src = canvas.toDataURL();
                break;
        }
        
        this.sourceImage.onload = () => {
            this.needsRecalculation = true;
        };
    }
    
    setupCanvasInteraction() {
        // Mouse down event
        this.canvas.addEventListener('mousedown', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const mouseX = (e.clientX - rect.left) / this.zoom - this.viewOffsetX;
            const mouseY = (e.clientY - rect.top) / this.zoom - this.viewOffsetY;
            
            // Check if clicking on lens
            const lensX = this.canvas.width / 2 + this.lensPosition.x;
            const lensY = this.canvas.height / 2 + this.lensPosition.y;
            const distToLens = Math.sqrt((mouseX - lensX) ** 2 + (mouseY - lensY) ** 2);
            
            if (distToLens < 30) {
                this.isDraggingLens = true;
                this.dragStartX = mouseX - lensX;
                this.dragStartY = mouseY - lensY;
                return;
            }
            
            // Check if clicking on source
            const sourceX = this.canvas.width / 2 + this.sourcePosition.x;
            const sourceY = this.canvas.height / 2 + this.sourcePosition.y;
            const distToSource = Math.sqrt((mouseX - sourceX) ** 2 + (mouseY - sourceY) ** 2);
            
            if (distToSource < 30) {
                this.isDraggingSource = true;
                this.dragStartX = mouseX - sourceX;
                this.dragStartY = mouseY - sourceY;
                return;
            }
            
            // Otherwise, drag the view
            this.isDraggingView = true;
            this.dragStartX = e.clientX;
            this.dragStartY = e.clientY;
        });
        
        // Mouse move event
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const mouseX = (e.clientX - rect.left) / this.zoom - this.viewOffsetX;
            const mouseY = (e.clientY - rect.top) / this.zoom - this.viewOffsetY;
            
            if (this.isDraggingLens) {
                // Move the lens
                const lensX = mouseX - this.dragStartX;
                const lensY = mouseY - this.dragStartY;
                this.lensPosition = {
                    x: lensX - this.canvas.width / 2,
                    y: lensY - this.canvas.height / 2
                };
                this.needsRecalculation = true;
                return;
            }
            
            if (this.isDraggingSource) {
                // Move the source
                const sourceX = mouseX - this.dragStartX;
                const sourceY = mouseY - this.dragStartY;
                this.sourcePosition = {
                    x: sourceX - this.canvas.width / 2,
                    y: sourceY - this.canvas.height / 2
                };
                this.needsRecalculation = true;
                return;
            }
            
            if (this.isDraggingView) {
                // Pan the view
                this.viewOffsetX += (e.clientX - this.dragStartX) / this.zoom;
                this.viewOffsetY += (e.clientY - this.dragStartY) / this.zoom;
                this.dragStartX = e.clientX;
                this.dragStartY = e.clientY;
                this.needsRecalculation = true;
            }
        });
        
        // Mouse up event
        this.canvas.addEventListener('mouseup', () => {
            this.isDraggingLens = false;
            this.isDraggingSource = false;
            this.isDraggingView = false;
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
            const worldX = mouseX / this.zoom - this.viewOffsetX;
            const worldY = mouseY / this.zoom - this.viewOffsetY;
            
            // Apply zoom
            this.zoom *= zoomFactor;
            
            // Limit zoom level
            this.zoom = Math.max(0.1, Math.min(10, this.zoom));
            
            // Calculate new world position after zoom
            const newWorldX = mouseX / this.zoom - this.viewOffsetX;
            const newWorldY = mouseY / this.zoom - this.viewOffsetY;
            
            // Adjust offset to keep mouse position fixed
            this.viewOffsetX += (newWorldX - worldX);
            this.viewOffsetY += (newWorldY - worldY);
            
            this.needsRecalculation = true;
        });
    }
    
    calculateEinsteinRadius() {
        // Calculate Einstein radius using the formula: θE = √(4GM/c² · DLS/(DS·DL))
        const DLS = this.sourceDistance - this.lensDistance; // Distance from lens to source
        const DS = this.sourceDistance; // Distance to source
        const DL = this.lensDistance; // Distance to lens
        
        // Einstein radius in radians
        const thetaE = Math.sqrt((4 * this.G * this.lensMass) / (this.c * this.c) * (DLS / (DS * DL)));
        
        // Convert to physical size at lens distance
        this.einsteinRadiusPhysical = thetaE * DL;
        
        // Convert to pixels
        this.einsteinRadius = this.einsteinRadiusPhysical / this.pixelScale;
        
        // Update value display
        const einsteinRadiusKpc = this.einsteinRadiusPhysical / (3.086e19); // Convert to kpc
        this.values.find(v => v.id === 'einsteinRadius').value = einsteinRadiusKpc;
        
        return this.einsteinRadius;
    }
    
    calculateDeflectionAngle(r) {
        // For a point mass, the deflection angle is α = 4GM/(c²r)
        if (this.lensProfile === 'pointMass') {
            return (4 * this.G * this.lensMass) / (this.c * this.c * r);
        }
        
        // For a singular isothermal sphere (SIS), the deflection angle is α = 4πσ²/c²
        // where σ is the velocity dispersion
        if (this.lensProfile === 'SIS') {
            // Approximate velocity dispersion from mass and radius
            const sigma = Math.sqrt(this.G * this.lensMass / (2 * this.lensRadius * this.pixelScale));
            return (4 * Math.PI * sigma * sigma) / (this.c * this.c);
        }
        
        // For a spherical mass distribution, the deflection angle depends on the mass enclosed within radius r
        if (this.lensProfile === 'spherical') {
            // Assume a simple r^-2 density profile
            const rScaled = r * this.pixelScale; // Convert to meters
            const rLens = this.lensRadius * this.pixelScale;
            
            if (r > this.lensRadius) {
                // Outside the lens, same as point mass
                return (4 * this.G * this.lensMass) / (this.c * this.c * rScaled);
            } else {
                // Inside the lens, deflection depends on enclosed mass
                const enclosedMassFraction = (rScaled / rLens) ** 3;
                return (4 * this.G * this.lensMass * enclosedMassFraction) / (this.c * this.c * rScaled);
            }
        }
        
        // For an NFW profile
        if (this.lensProfile === 'NFW') {
            const rScaled = r * this.pixelScale; // Convert to meters
            const rs = this.lensRadius * this.pixelScale * 0.5; // Scale radius (half the lens radius)
            
            // Simplified NFW deflection angle approximation
            const x = rScaled / rs;
            let f;
            if (x < 1) {
                f = Math.log(x/2) + (2/Math.sqrt(1-x*x)) * Math.atanh(Math.sqrt((1-x)/(1+x)));
            } else if (x > 1) {
                f = Math.log(x/2) + (2/Math.sqrt(x*x-1)) * Math.atan(Math.sqrt((x-1)/(1+x)));
            } else {
                f = Math.log(0.5) + 2;
            }
            
            return (8 * Math.PI * this.G * this.lensMass * f) / (this.c * this.c * rScaled * (Math.log(1 + this.lensRadius) - this.lensRadius/(1+this.lensRadius)));
        }
        
        // Default to point mass if profile not recognized
        return (4 * this.G * this.lensMass) / (this.c * this.c * r);
    }
    
    calculateDeflection(x, y) {
        // Convert to physical coordinates
        const xPhys = x * this.pixelScale;
        const yPhys = y * this.pixelScale;
        
        // Calculate distance from lens center
        const lensX = this.lensPosition.x * this.pixelScale;
        const lensY = this.lensPosition.y * this.pixelScale;
        const dx = xPhys - lensX;
        const dy = yPhys - lensY;
        const r = Math.sqrt(dx*dx + dy*dy);
        
        // Avoid division by zero
        if (r < 1e-10) {
            return { x: 0, y: 0 };
        }
        
        // Calculate deflection angle
        let alpha = this.calculateDeflectionAngle(r);
        
        // Apply ellipticity if needed
        if (this.lensEllipticity > 0) {
            // Rotate coordinates to align with ellipse axes
            const cosTheta = Math.cos(this.lensOrientation);
            const sinTheta = Math.sin(this.lensOrientation);
            const xRot = dx * cosTheta + dy * sinTheta;
            const yRot = -dx * sinTheta + dy * cosTheta;
            
            // Apply ellipticity (stretch along x-axis)
            const e = this.lensEllipticity;
            const q = 1 - e; // Axis ratio
            const rEllipse = Math.sqrt((xRot*xRot) + (yRot*yRot)/(q*q));
            
            // Calculate deflection for elliptical mass
            alpha = this.calculateDeflectionAngle(rEllipse);
            
            // Adjust deflection components for ellipticity
            const alphaX = alpha * xRot / rEllipse;
            const alphaY = alpha * yRot / (rEllipse * q * q);
            
            // Rotate back to original coordinates
            return {
                x: (alphaX * cosTheta - alphaY * sinTheta) / this.pixelScale,
                y: (alphaX * sinTheta + alphaY * cosTheta) / this.pixelScale
            };
        }
        
        // For circular lens, deflection is radial
        return {
            x: alpha * dx / (r * this.pixelScale),
            y: alpha * dy / (r * this.pixelScale)
        };
    }
    
    rayTrace(startX, startY, targetX, targetY) {
        // Trace a ray from observer (startX, startY) to find where it originated in the source plane
        // This is actually backward ray-tracing
        
        // Convert to physical coordinates
        const startXPhys = startX * this.pixelScale;
        const startYPhys = startY * this.pixelScale;
        
        // Calculate direction vector
        const dirX = targetX - startX;
        const dirY = targetY - startY;
        const dist = Math.sqrt(dirX*dirX + dirY*dirY);
        
        // Normalize direction
        const normDirX = dirX / dist;
        const normDirY = dirY / dist;
        
        // Ray path for visualization
        const path = [{ x: startX, y: startY }];
        
        // Trace the ray
        let curX = startX;
        let curY = startY;
        let curZ = 0; // Distance along the ray
        
        // Step through space
        const stepSize = this.rayStepSize;
        const maxSteps = this.maxRaySteps;
        
        for (let i = 0; i < maxSteps; i++) {
            // Move along the ray
            curX += normDirX * stepSize;
            curY += normDirY * stepSize;
            curZ += stepSize;
            
            // Record path for visualization
            if (this.showRays && i % 10 === 0) {
                path.push({ x: curX, y: curY });
            }
            
            // If we've reached the lens plane
            if (curZ * this.pixelScale >= this.lensDistance) {
                // Calculate deflection at this point
                const deflection = this.calculateDeflection(curX, curY);
                
                // Apply deflection to the ray direction
                const deflectionFactor = (this.sourceDistance - this.lensDistance) / this.sourceDistance;
                const newDirX = normDirX + deflection.x * deflectionFactor;
                const newDirY = normDirY + deflection.y * deflectionFactor;
                
                // Normalize new direction
                const newDirMag = Math.sqrt(newDirX*newDirX + newDirY*newDirY);
                const newNormDirX = newDirX / newDirMag;
                const newNormDirY = newDirY / newDirMag;
                
                // Continue to source plane with new direction
                const remainingDist = (this.sourceDistance - this.lensDistance) / this.pixelScale;
                const sourceX = curX + newNormDirX * remainingDist;
                const sourceY = curY + newNormDirY * remainingDist;
                
                // Add final point to path
                if (this.showRays) {
                    path.push({ x: sourceX, y: sourceY });
                }
                
                return {
                    sourceX: sourceX,
                    sourceY: sourceY,
                    path: path
                };
            }
        }
        
        // If we didn't reach the lens plane, just continue in a straight line
        const sourceX = startX + normDirX * (this.sourceDistance / this.pixelScale);
        const sourceY = startY + normDirY * (this.sourceDistance / this.pixelScale);
        
        // Add final point to path
        if (this.showRays) {
            path.push({ x: sourceX, y: sourceY });
        }
        
        return {
            sourceX: sourceX,
            sourceY: sourceY,
            path: path
        };
    }
    
    calculateMagnificationMap() {
        // Create a magnification map by calculating the determinant of the Jacobian matrix
        // of the lens mapping at each point
        
        const width = this.canvas.width;
        const height = this.canvas.height;
        
        // Create magnification map
        this.magnificationMap = new Array(width * height).fill(1.0);
        
        // Sample points
        const sampleStep = Math.max(1, Math.floor(10 / this.rayDensity));
        
        for (let y = 0; y < height; y += sampleStep) {
            for (let x = 0; x < width; x += sampleStep) {
                // Calculate image position relative to lens
                const imgX = (x - width/2) / this.zoom + this.viewOffsetX;
                const imgY = (y - height/2) / this.zoom + this.viewOffsetY;
                
                // Calculate source position for this image point
                const result = this.rayTrace(imgX, imgY, 0, 0);
                
                // Calculate magnification using finite differences
                const dx = 1.0;
                const dy = 1.0;
                
                const result1 = this.rayTrace(imgX + dx, imgY, 0, 0);
                const result2 = this.rayTrace(imgX, imgY + dy, 0, 0);
                
                // Calculate Jacobian determinant
                const dsx_dx = (result1.sourceX - result.sourceX) / dx;
                const dsy_dx = (result1.sourceY - result.sourceY) / dx;
                const dsx_dy = (result2.sourceX - result.sourceX) / dy;
                const dsy_dy = (result2.sourceY - result.sourceY) / dy;
                
                const detJ = dsx_dx * dsy_dy - dsx_dy * dsy_dx;
                
                // Magnification is inverse of Jacobian determinant
                const magnification = Math.abs(1.0 / detJ);
                
                // Store in map (clamp to reasonable values)
                const mag = Math.min(100, magnification);
                
                // Fill the sampled region
                for (let fy = 0; fy < sampleStep && y + fy < height; fy++) {
                    for (let fx = 0; fx < sampleStep && x + fx < width; fx++) {
                        const idx = (y + fy) * width + (x + fx);
                        this.magnificationMap[idx] = mag;
                    }
                }
            }
        }
    }
    
    calculateCaustics() {
        // Calculate caustic lines (where magnification is infinite)
        // This is a simplified approach - in reality, we would need to solve for det(J) = 0
        
        // For now, we'll just sample points with very high magnification
        if (!this.magnificationMap) {
            this.calculateMagnificationMap();
        }
        
        // Threshold for caustic detection
        const threshold = 50.0;
        
        // Find points with magnification above threshold
        const width = this.canvas.width;
        const height = this.canvas.height;
        
        this.causticPoints = [];
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const idx = y * width + x;
                if (this.magnificationMap[idx] > threshold) {
                    // Calculate image position
                    const imgX = (x - width/2) / this.zoom + this.viewOffsetX;
                    const imgY = (y - height/2) / this.zoom + this.viewOffsetY;
                    
                    // Calculate corresponding source position
                    const result = this.rayTrace(imgX, imgY, 0, 0);
                    
                    // Add to caustic points
                    this.causticPoints.push({
                        sourceX: result.sourceX,
                        sourceY: result.sourceY
                    });
                }
            }
        }
    }
    
    calculateCriticalCurves() {
        // Calculate critical curves (where det(J) = 0 in the image plane)
        // This is a simplified approach
        
        // For now, we'll just sample points with very high magnification
        if (!this.magnificationMap) {
            this.calculateMagnificationMap();
        }
        
        // Threshold for critical curve detection
        const threshold = 50.0;
        
        // Find points with magnification above threshold
        const width = this.canvas.width;
        const height = this.canvas.height;
        
        this.criticalPoints = [];
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const idx = y * width + x;
                if (this.magnificationMap[idx] > threshold) {
                    // Calculate image position
                    const imgX = (x - width/2) / this.zoom + this.viewOffsetX;
                    const imgY = (y - height/2) / this.zoom + this.viewOffsetY;
                    
                    // Add to critical points
                    this.criticalPoints.push({
                        x: imgX,
                        y: imgY
                    });
                }
            }
        }
    }
    
    renderLensedImage() {
        const width = this.canvas.width;
        const height = this.canvas.height;
        
        // Create an off-screen canvas for rendering
        const offscreenCanvas = document.createElement('canvas');
        offscreenCanvas.width = width;
        offscreenCanvas.height = height;
        const offscreenCtx = offscreenCanvas.getContext('2d');
        
        // Draw background
        if (this.backgroundImage && this.backgroundImage.complete) {
            const pattern = offscreenCtx.createPattern(this.backgroundImage, 'repeat');
            offscreenCtx.fillStyle = pattern;
            offscreenCtx.fillRect(0, 0, width, height);
        } else {
            // Fallback background
            offscreenCtx.fillStyle = '#000020';
            offscreenCtx.fillRect(0, 0, width, height);
        }
        
        // Draw source at its true position (for reference)
        const sourceX = width/2 + this.sourcePosition.x;
        const sourceY = height/2 + this.sourcePosition.y;
        
        if (this.sourceImage && this.sourceImage.complete) {
            const sourceSize = this.sourceSize * this.zoom;
            offscreenCtx.globalAlpha = 0.3; // Make it semi-transparent
            offscreenCtx.drawImage(
                this.sourceImage,
                sourceX - sourceSize/2,
                sourceY - sourceSize/2,
                sourceSize,
                sourceSize
            );
            offscreenCtx.globalAlpha = 1.0;
        }
        
        // Sample grid for ray tracing
        const gridStep = Math.max(1, Math.floor(5 / (this.rayDensity * this.zoom)));
        
        // Store ray paths for later drawing
        const rayPaths = [];
        
        // Render the lensed image by backward ray tracing
        for (let y = 0; y < height; y += gridStep) {
            for (let x = 0; x < width; x += gridStep) {
                // Calculate image position relative to lens
                const imgX = (x - width/2) / this.zoom + this.viewOffsetX;
                const imgY = (y - height/2) / this.zoom + this.viewOffsetY;
                
                // Ray trace to find source position
                const result = this.rayTrace(imgX, imgY, 0, 0);
                
                // Calculate position relative to source
                const relSourceX = result.sourceX - (this.sourcePosition.x + width/2);
                const relSourceY = result.sourceY - (this.sourcePosition.y + height/2);
                
                // Check if this point is within the source
                const distToSource = Math.sqrt(relSourceX*relSourceX + relSourceY*relSourceY);
                
                if (distToSource < this.sourceSize) {
                    // Sample color from source image
                    if (this.sourceImage && this.sourceImage.complete) {
                        // Calculate normalized coordinates in source image
                        const srcImgX = (relSourceX / this.sourceSize + 0.5) * this.sourceImage.width;
                        const srcImgY = (relSourceY / this.sourceSize + 0.5) * this.sourceImage.height;
                        
                        // Check if coordinates are within source image
                        if (srcImgX >= 0 && srcImgX < this.sourceImage.width &&
                            srcImgY >= 0 && srcImgY < this.sourceImage.height) {
                            
                            // Create a small temporary canvas to sample the pixel
                            const tempCanvas = document.createElement('canvas');
                            tempCanvas.width = 1;
                            tempCanvas.height = 1;
                            const tempCtx = tempCanvas.getContext('2d');
                            
                            // Draw the relevant part of the source image
                            tempCtx.drawImage(
                                this.sourceImage,
                                srcImgX, srcImgY, 1, 1,
                                0, 0, 1, 1
                            );
                            
                            // Get pixel color
                            const pixelData = tempCtx.getImageData(0, 0, 1, 1).data;
                            const color = `rgba(${pixelData[0]}, ${pixelData[1]}, ${pixelData[2]}, ${pixelData[3]/255})`;
                            
                            // Fill the grid cell with this color
                            offscreenCtx.fillStyle = color;
                            offscreenCtx.fillRect(x, y, gridStep, gridStep);
                        }
                    } else {
                        // Fallback: draw a white pixel
                        offscreenCtx.fillStyle = 'white';
                        offscreenCtx.fillRect(x, y, gridStep, gridStep);
                    }
                    
                    // Store ray path for visualization
                    if (this.showRays && Math.random() < 0.05) {
                        rayPaths.push(result.path);
                    }
                }
            }
        }
        
        // Draw magnification map if enabled
        if (this.showMagnificationMap && this.magnificationMap) {
            const imgData = offscreenCtx.getImageData(0, 0, width, height);
            const data = imgData.data;
            
            for (let i = 0; i < this.magnificationMap.length; i++) {
                const mag = this.magnificationMap[i];
                const alpha = Math.min(1.0, mag / 10.0); // Scale for visibility
                
                // Apply a color overlay based on magnification
                const r = 255;
                const g = 100;
                const b = 100;
                
                const idx = i * 4;
                data[idx] = Math.min(255, data[idx] + r * alpha);
                data[idx+1] = Math.min(255, data[idx+1] + g * alpha);
                data[idx+2] = Math.min(255, data[idx+2] + b * alpha);
            }
            
            offscreenCtx.putImageData(imgData, 0, 0);
        }
        
        // Draw lens position
        const lensX = width/2 + this.lensPosition.x * this.zoom;
        const lensY = height/2 + this.lensPosition.y * this.zoom;
        
        offscreenCtx.beginPath();
        offscreenCtx.arc(lensX, lensY, 10, 0, Math.PI * 2);
        offscreenCtx.fillStyle = 'rgba(255, 255, 0, 0.7)';
        offscreenCtx.fill();
        offscreenCtx.strokeStyle = 'white';
        offscreenCtx.lineWidth = 2;
        offscreenCtx.stroke();
        
        // Draw Einstein radius if enabled
        if (this.showEinsteinRadius) {
            offscreenCtx.beginPath();
            offscreenCtx.arc(lensX, lensY, this.einsteinRadius * this.zoom, 0, Math.PI * 2);
            offscreenCtx.strokeStyle = 'rgba(0, 255, 255, 0.5)';
            offscreenCtx.lineWidth = 2;
            offscreenCtx.stroke();
            
            // Label
            offscreenCtx.font = '14px Arial';
            offscreenCtx.fillStyle = 'rgba(0, 255, 255, 0.8)';
            offscreenCtx.fillText('Einstein Radius', lensX + this.einsteinRadius * this.zoom + 10, lensY);
        }
        
        // Draw ray paths
        if (this.showRays) {
            for (const path of rayPaths) {
                offscreenCtx.beginPath();
                
                // Transform path coordinates to screen space
                const screenPath = path.map(p => ({
                    x: (p.x - this.viewOffsetX) * this.zoom + width/2,
                    y: (p.y - this.viewOffsetY) * this.zoom + height/2
                }));
                
                offscreenCtx.moveTo(screenPath[0].x, screenPath[0].y);
                
                for (let i = 1; i < screenPath.length; i++) {
                    offscreenCtx.lineTo(screenPath[i].x, screenPath[i].y);
                }
                
                offscreenCtx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
                offscreenCtx.lineWidth = 1;
                offscreenCtx.stroke();
            }
        }
        
        // Draw caustics if enabled
        if (this.showCaustics && this.causticPoints) {
            offscreenCtx.fillStyle = 'rgba(0, 255, 0, 0.5)';
            
            for (const point of this.causticPoints) {
                const screenX = (point.sourceX - this.viewOffsetX) * this.zoom + width/2;
                const screenY = (point.sourceY - this.viewOffsetY) * this.zoom + height/2;
                
                offscreenCtx.fillRect(screenX - 1, screenY - 1, 2, 2);
            }
        }
        
        // Draw critical curves if enabled
        if (this.showCriticalCurves && this.criticalPoints) {
            offscreenCtx.fillStyle = 'rgba(255, 0, 255, 0.5)';
            
            for (const point of this.criticalPoints) {
                const screenX = (point.x - this.viewOffsetX) * this.zoom + width/2;
                const screenY = (point.y - this.viewOffsetY) * this.zoom + height/2;
                
                offscreenCtx.fillRect(screenX - 1, screenY - 1, 2, 2);
            }
        }
        
        // Draw info text
        offscreenCtx.font = '14px Arial';
        offscreenCtx.fillStyle = 'white';
        offscreenCtx.fillText(`Lens Mass: ${(this.lensMass / 1.989e30).toExponential(2)} Solar Masses`, 10, 20);
        offscreenCtx.fillText(`Einstein Radius: ${this.values.find(v => v.id === 'einsteinRadius').value.toFixed(2)} kpc`, 10, 40);
        offscreenCtx.fillText(`Lens Profile: ${this.lensProfile}`, 10, 60);
        
        // Return the rendered image
        return offscreenCanvas;
    }
    
    update(dt) {
        // Update animation if enabled
        if (this.isAnimating) {
            this.animationTime += dt * this.animationSpeed;
            
            // Move source in a circular path
            const radius = 50;
            this.sourcePosition = {
                x: Math.cos(this.animationTime) * radius,
                y: Math.sin(this.animationTime) * radius
            };
            
            this.needsRecalculation = true;
        }
        
        // Calculate magnification at current source position
        const sourceX = this.canvas.width/2 + this.sourcePosition.x;
        const sourceY = this.canvas.height/2 + this.sourcePosition.y;
        const lensX = this.canvas.width/2 + this.lensPosition.x;
        const lensY = this.canvas.height/2 + this.lensPosition.y;
        
        // Calculate distance from source to lens
        const dx = sourceX - lensX;
        const dy = sourceY - lensY;
        const dist = Math.sqrt(dx*dx + dy*dy);
        
        // Calculate magnification (approximate)
        let magnification = 1.0;
        if (dist > 0) {
            const u = dist / this.einsteinRadius;
            magnification = (u*u + 2) / (u * Math.sqrt(u*u + 4));
        }
        
        // Update values
        this.values.find(v => v.id === 'magnification').value = magnification;
        
        // Calculate deflection angle
        const physicalDist = dist * this.pixelScale;
        const deflectionAngle = this.calculateDeflectionAngle(physicalDist);
        const deflectionArcsec = deflectionAngle * 206265; // Convert radians to arcseconds
        this.values.find(v => v.id === 'deflectionAngle').value = deflectionArcsec;
        
        // Calculate time delay
        const timeDelay = (1 + this.values.find(v => v.id === 'lensRedshift').value) *
                          (this.G * this.lensMass / (this.c * this.c * this.c)) *
                          (1 + Math.log(physicalDist / (2 * this.G * this.lensMass / (this.c * this.c))));
        this.values.find(v => v.id === 'timeDelay').value = timeDelay / 86400; // Convert to days
        
        // Render the scene if needed
        if (this.needsRecalculation) {
            this.cachedImage = this.renderLensedImage();
            this.needsRecalculation = false;
        }
        
        // Draw the cached image
        if (this.cachedImage) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.drawImage(this.cachedImage, 0, 0);
        }
        
        // Update energy chart
        this.updateEnergyChart();
    }
    
    onResize(width, height) {
        this.needsRecalculation = true;
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
                        label: 'Magnification',
                        data: Array(100).fill(1),
                        borderColor: getComputedStyle(document.body).getPropertyValue('--primary-color'),
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
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Magnification'
                        }
                    }
                }
            }
        });
    }
    
    updateEnergyChart() {
        if (!this.energyChart) return;
        
        // Shift data to the left
        this.energyChart.data.datasets[0].data.shift();
        
        // Add new magnification value
        const magnification = this.values.find(v => v.id === 'magnification').value;
        this.energyChart.data.datasets[0].data.push(magnification);
        
        // Update chart
        this.energyChart.update();
    }
    
    getEnergy() {
        // For compatibility with the energy chart system
        return {
            kinetic: 0,
            potential: 0,
            total: this.values.find(v => v.id === 'magnification').value
        };
    }
}
