// HYPERION - Advanced Physics Simulation Engine
// Main Application JavaScript

class HyperionApp {
    constructor() {
        this.currentRoute = '';
        this.simulationStates = new Map();
        this.animationFrameId = null;
        
        // Application data
        this.data = {
            "categories": [
                {
                    "id": "core-mechanics",
                    "name": "Core Mechanics", 
                    "complexity": 3,
                    "simulationCount": 3,
                    "color": "#00bfff",
                    "description": "Fundamental physics principles and classical mechanics",
                    "simulations": [
                        {
                            "id": "newtons-cradle",
                            "name": "Newton's Cradle",
                            "description": "Demonstrates conservation of momentum and energy through colliding spheres",
                            "equations": ["p = mv", "KE = ½mv²", "Conservation: Σp_i = Σp_f"],
                            "parameters": [
                                {"name": "Mass", "min": 0.1, "max": 2.0, "default": 1.0, "unit": "kg"},
                                {"name": "Velocity", "min": 0, "max": 10, "default": 5, "unit": "m/s"},
                                {"name": "Restitution", "min": 0.5, "max": 1.0, "default": 0.95, "unit": ""}
                            ]
                        },
                        {
                            "id": "harmonic-oscillator", 
                            "name": "Harmonic Oscillator",
                            "description": "Simple harmonic motion with spring-mass system",
                            "equations": ["F = -kx", "ω = √(k/m)", "x(t) = A cos(ωt + φ)"],
                            "parameters": [
                                {"name": "Mass", "min": 0.1, "max": 5.0, "default": 1.0, "unit": "kg"},
                                {"name": "Spring Constant", "min": 1, "max": 100, "default": 10, "unit": "N/m"},
                                {"name": "Amplitude", "min": 0.1, "max": 3.0, "default": 1.0, "unit": "m"}
                            ]
                        },
                        {
                            "id": "projectile-motion",
                            "name": "Projectile Motion", 
                            "description": "Motion under gravity with initial velocity",
                            "equations": ["x = v₀ₓt", "y = v₀ᵧt - ½gt²", "R = v₀²sin(2θ)/g"],
                            "parameters": [
                                {"name": "Initial Velocity", "min": 1, "max": 50, "default": 20, "unit": "m/s"},
                                {"name": "Launch Angle", "min": 0, "max": 90, "default": 45, "unit": "°"},
                                {"name": "Gravity", "min": 1, "max": 20, "default": 9.81, "unit": "m/s²"}
                            ]
                        }
                    ]
                },
                {
                    "id": "gravity-systems",
                    "name": "Gravity Systems",
                    "complexity": 7, 
                    "simulationCount": 3,
                    "color": "#00ff41",
                    "description": "Gravitational interactions and orbital mechanics",
                    "simulations": [
                        {
                            "id": "orbital-mechanics",
                            "name": "Orbital Mechanics",
                            "description": "Planetary orbits and satellite motion",
                            "equations": ["F = GMm/r²", "v = √(GM/r)", "T² = (4π²/GM)r³"],
                            "parameters": [
                                {"name": "Central Mass", "min": 1e24, "max": 2e30, "default": 5.97e24, "unit": "kg"},
                                {"name": "Orbital Radius", "min": 1e6, "max": 1e9, "default": 6.37e6, "unit": "m"},
                                {"name": "Eccentricity", "min": 0, "max": 0.9, "default": 0.1, "unit": ""}
                            ]
                        },
                        {
                            "id": "gravitational-slingshot",
                            "name": "Gravitational Slingshot",
                            "description": "Gravity assist maneuver for spacecraft",
                            "equations": ["Δv = 2v_planet", "Energy conservation", "Momentum conservation"],
                            "parameters": [
                                {"name": "Planet Velocity", "min": 5, "max": 50, "default": 30, "unit": "km/s"},
                                {"name": "Approach Angle", "min": 0, "max": 180, "default": 90, "unit": "°"},
                                {"name": "Closest Approach", "min": 1000, "max": 50000, "default": 5000, "unit": "km"}
                            ]
                        },
                        {
                            "id": "n-body-simulation",
                            "name": "N-body Simulation",
                            "description": "Multiple body gravitational interactions",
                            "equations": ["F_ij = Gm_im_j(r_j - r_i)/|r_j - r_i|³", "Numerical integration"],
                            "parameters": [
                                {"name": "Number of Bodies", "min": 2, "max": 10, "default": 3, "unit": ""},
                                {"name": "Time Step", "min": 0.001, "max": 0.1, "default": 0.01, "unit": "s"},
                                {"name": "Simulation Speed", "min": 0.1, "max": 5.0, "default": 1.0, "unit": "x"}
                            ]
                        }
                    ]
                },
                {
                    "id": "chaos-theory",
                    "name": "Chaos Theory",
                    "complexity": 8,
                    "simulationCount": 3, 
                    "color": "#8a2be2",
                    "description": "Complex dynamical systems and chaotic behavior",
                    "simulations": [
                        {
                            "id": "double-pendulum",
                            "name": "Double Pendulum",
                            "description": "Chaotic motion of coupled pendulums",
                            "equations": ["Complex coupled ODEs", "Lagrangian mechanics", "Sensitive to initial conditions"],
                            "parameters": [
                                {"name": "Length 1", "min": 0.5, "max": 2.0, "default": 1.0, "unit": "m"},
                                {"name": "Length 2", "min": 0.5, "max": 2.0, "default": 1.0, "unit": "m"},
                                {"name": "Mass 1", "min": 0.1, "max": 2.0, "default": 1.0, "unit": "kg"},
                                {"name": "Mass 2", "min": 0.1, "max": 2.0, "default": 1.0, "unit": "kg"}
                            ]
                        },
                        {
                            "id": "lorenz-attractor",
                            "name": "Lorenz Attractor",
                            "description": "Strange attractor from atmospheric convection",
                            "equations": ["dx/dt = σ(y - x)", "dy/dt = x(ρ - z) - y", "dz/dt = xy - βz"],
                            "parameters": [
                                {"name": "Sigma (σ)", "min": 5, "max": 15, "default": 10, "unit": ""},
                                {"name": "Rho (ρ)", "min": 20, "max": 35, "default": 28, "unit": ""},
                                {"name": "Beta (β)", "min": 1, "max": 5, "default": 2.67, "unit": ""}
                            ]
                        },
                        {
                            "id": "logistic-map",
                            "name": "Logistic Map",
                            "description": "Discrete-time dynamical system showing chaos",
                            "equations": ["x_{n+1} = rx_n(1 - x_n)", "Bifurcation parameter r"],
                            "parameters": [
                                {"name": "Growth Rate (r)", "min": 0.5, "max": 4.0, "default": 3.5, "unit": ""},
                                {"name": "Initial Population", "min": 0.01, "max": 0.99, "default": 0.5, "unit": ""},
                                {"name": "Iterations", "min": 100, "max": 2000, "default": 500, "unit": ""}
                            ]
                        }
                    ]
                },
                {
                    "id": "quantum-physics",
                    "name": "Quantum Physics",
                    "complexity": 9,
                    "simulationCount": 3,
                    "color": "#ff6b6b", 
                    "description": "Quantum mechanical phenomena and wave functions",
                    "simulations": [
                        {
                            "id": "schrodinger-1d",
                            "name": "Schrödinger Equation 1D",
                            "description": "Quantum wave function evolution",
                            "equations": ["iℏ∂ψ/∂t = Ĥψ", "P(x) = |ψ(x)|²", "⟨x⟩ = ∫ ψ*xψ dx"],
                            "parameters": [
                                {"name": "Barrier Height", "min": 0, "max": 10, "default": 5, "unit": "eV"},
                                {"name": "Particle Mass", "min": 0.1, "max": 2.0, "default": 1.0, "unit": "m_e"},
                                {"name": "Wave Packet Width", "min": 0.5, "max": 3.0, "default": 1.0, "unit": "nm"}
                            ]
                        },
                        {
                            "id": "superposition-demo",
                            "name": "Superposition Demo",
                            "description": "Quantum superposition of states",
                            "equations": ["|ψ⟩ = α|0⟩ + β|1⟩", "|α|² + |β|² = 1", "P(0) = |α|², P(1) = |β|²"],
                            "parameters": [
                                {"name": "Alpha Amplitude", "min": 0, "max": 1, "default": 0.707, "unit": ""},
                                {"name": "Alpha Phase", "min": 0, "max": 360, "default": 0, "unit": "°"},
                                {"name": "Beta Amplitude", "min": 0, "max": 1, "default": 0.707, "unit": ""}
                            ]
                        },
                        {
                            "id": "quantum-tunneling",
                            "name": "Quantum Tunneling", 
                            "description": "Tunneling through potential barriers",
                            "equations": ["T = |ψ_transmitted|²/|ψ_incident|²", "R = |ψ_reflected|²/|ψ_incident|²", "T + R = 1"],
                            "parameters": [
                                {"name": "Barrier Height", "min": 1, "max": 20, "default": 10, "unit": "eV"},
                                {"name": "Barrier Width", "min": 0.1, "max": 2.0, "default": 0.5, "unit": "nm"},
                                {"name": "Particle Energy", "min": 0.1, "max": 15, "default": 5, "unit": "eV"}
                            ]
                        }
                    ]
                }
            ]
        };

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupRouter();
        this.initializeRoute();
    }

    setupEventListeners() {
        // Navigation toggle
        document.getElementById('nav-toggle')?.addEventListener('click', this.toggleNavigation.bind(this));
        
        // Hash change for routing
        window.addEventListener('hashchange', this.handleRouteChange.bind(this));
        
        // Close sidebar on mobile when clicking outside
        document.addEventListener('click', (e) => {
            const sidebar = document.getElementById('sidebar');
            const navToggle = document.getElementById('nav-toggle');
            
            if (window.innerWidth <= 768 && 
                sidebar.classList.contains('open') &&
                !sidebar.contains(e.target) && 
                !navToggle.contains(e.target)) {
                sidebar.classList.remove('open');
            }
        });

        // Modal close
        document.getElementById('modal-close')?.addEventListener('click', this.closeModal.bind(this));
        document.getElementById('modal-overlay')?.addEventListener('click', (e) => {
            if (e.target.id === 'modal-overlay') {
                this.closeModal();
            }
        });
    }

    setupRouter() {
        // Define routes
        this.routes = {
            '': this.renderDashboard.bind(this),
            '/': this.renderDashboard.bind(this),
            '/core-mechanics': () => this.renderCategory('core-mechanics'),
            '/gravity-systems': () => this.renderCategory('gravity-systems'),
            '/chaos-theory': () => this.renderCategory('chaos-theory'),
            '/quantum-physics': () => this.renderCategory('quantum-physics')
        };

        // Add simulation routes dynamically
        this.data.categories.forEach(category => {
            category.simulations.forEach(simulation => {
                this.routes[`/${category.id}/${simulation.id}`] = () => 
                    this.renderSimulation(category.id, simulation.id);
            });
        });
    }

    initializeRoute() {
        const hash = window.location.hash.slice(1);
        this.navigateToRoute(hash || '/');
    }

    handleRouteChange() {
        const hash = window.location.hash.slice(1);
        this.navigateToRoute(hash);
    }

    navigateToRoute(route) {
        if (this.currentRoute === route) return;
        
        this.showLoading();
        this.currentRoute = route;
        
        // Update active navigation
        this.updateActiveNavigation(route);
        
        // Update breadcrumb
        this.updateBreadcrumb(route);
        
        // Render content with delay for loading effect
        setTimeout(() => {
            if (this.routes[route]) {
                this.routes[route]();
            } else {
                this.render404();
            }
            this.hideLoading();
        }, 300);
    }

    updateActiveNavigation(route) {
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });

        const activeLink = document.querySelector(`a[href="#${route}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }
    }

    updateBreadcrumb(route) {
        const breadcrumb = document.getElementById('breadcrumb');
        const parts = route.split('/').filter(Boolean);
        
        if (parts.length === 0) {
            breadcrumb.classList.add('hidden');
            return;
        }

        breadcrumb.classList.remove('hidden');
        let breadcrumbHTML = '<span class="breadcrumb-item"><a href="#/" class="breadcrumb-link">Dashboard</a></span>';
        
        if (parts.length === 1) {
            const category = this.data.categories.find(cat => cat.id === parts[0]);
            if (category) {
                breadcrumbHTML += `<span class="breadcrumb-item">${category.name}</span>`;
            }
        } else if (parts.length === 2) {
            const category = this.data.categories.find(cat => cat.id === parts[0]);
            const simulation = category?.simulations.find(sim => sim.id === parts[1]);
            if (category && simulation) {
                breadcrumbHTML += `<span class="breadcrumb-item"><a href="#/${category.id}" class="breadcrumb-link">${category.name}</a></span>`;
                breadcrumbHTML += `<span class="breadcrumb-item">${simulation.name}</span>`;
            }
        }
        
        breadcrumb.innerHTML = breadcrumbHTML;
    }

    renderDashboard() {
        const template = document.getElementById('dashboard-template');
        const content = template.content.cloneNode(true);
        
        // Populate categories grid
        const categoriesGrid = content.getElementById('categories-grid');
        this.data.categories.forEach(category => {
            const categoryCard = this.createCategoryCard(category);
            categoriesGrid.appendChild(categoryCard);
        });
        
        this.setContent(content);
        
        // Add click listeners to category cards
        setTimeout(() => {
            document.querySelectorAll('.category-card').forEach(card => {
                card.addEventListener('click', (e) => {
                    const categoryId = e.currentTarget.dataset.categoryId;
                    window.location.hash = `/${categoryId}`;
                });
            });
        }, 100);
    }

    createCategoryCard(category) {
        const card = document.createElement('div');
        card.className = 'category-card';
        card.dataset.categoryId = category.id;
        card.style.setProperty('--category-color', category.color);
        card.style.setProperty('--category-glow', category.color + '40');
        
        card.innerHTML = `
            <div class="category-header">
                <div>
                    <h3 class="category-name">${category.name}</h3>
                    <div class="category-complexity">Complexity: ${category.complexity}/10</div>
                </div>
                <div class="category-icon">${this.getCategoryIcon(category.id)}</div>
            </div>
            <p class="category-description">${category.description}</p>
            <div class="category-stats">
                <span class="simulation-count">${category.simulationCount} simulations</span>
            </div>
        `;
        
        return card;
    }

    getCategoryIcon(categoryId) {
        const icons = {
            'core-mechanics': '⚙️',
            'gravity-systems': '🌍',
            'chaos-theory': '🌀',
            'quantum-physics': '⚛️'
        };
        return icons[categoryId] || '🔬';
    }

    renderCategory(categoryId) {
        const category = this.data.categories.find(cat => cat.id === categoryId);
        if (!category) {
            this.render404();
            return;
        }

        const template = document.getElementById('category-template');
        const content = template.content.cloneNode(true);
        
        // Populate category info
        content.querySelector('.category-title').textContent = category.name;
        content.querySelector('.category-description').textContent = category.description;
        content.querySelector('.complexity-value').textContent = category.complexity;
        content.querySelector('.simulation-count').textContent = `${category.simulationCount} simulations`;
        
        // Populate simulations grid
        const simulationsGrid = content.getElementById('simulations-grid');
        category.simulations.forEach(simulation => {
            const simulationCard = this.createSimulationCard(category.id, simulation);
            simulationsGrid.appendChild(simulationCard);
        });
        
        this.setContent(content);
        
        // Add click listeners to simulation cards
        setTimeout(() => {
            document.querySelectorAll('.simulation-card').forEach(card => {
                card.addEventListener('click', (e) => {
                    const categoryId = e.currentTarget.dataset.categoryId;
                    const simulationId = e.currentTarget.dataset.simulationId;
                    window.location.hash = `/${categoryId}/${simulationId}`;
                });
            });
        }, 100);
    }

    createSimulationCard(categoryId, simulation) {
        const card = document.createElement('div');
        card.className = 'simulation-card';
        card.dataset.categoryId = categoryId;
        card.dataset.simulationId = simulation.id;
        
        const equationsHTML = simulation.equations.slice(0, 2).map(eq => 
            `<div class="equation-item">${eq}</div>`
        ).join('');
        
        card.innerHTML = `
            <h3 class="simulation-name">${simulation.name}</h3>
            <p class="simulation-description">${simulation.description}</p>
            <div class="simulation-equations">${equationsHTML}</div>
        `;
        
        return card;
    }

    renderSimulation(categoryId, simulationId) {
        const category = this.data.categories.find(cat => cat.id === categoryId);
        const simulation = category?.simulations.find(sim => sim.id === simulationId);
        
        if (!category || !simulation) {
            this.render404();
            return;
        }

        const template = document.getElementById('simulation-template');
        const content = template.content.cloneNode(true);
        
        // Populate simulation info
        content.querySelector('.simulation-title').textContent = simulation.name;
        content.querySelector('.simulation-description').textContent = simulation.description;
        
        // Populate parameters
        const parametersList = content.getElementById('parameters-list');
        simulation.parameters.forEach(param => {
            const parameterItem = this.createParameterControl(param, simulationId);
            parametersList.appendChild(parameterItem);
        });
        
        // Populate equations
        const equationsList = content.getElementById('equations-list');
        simulation.equations.forEach(equation => {
            const equationItem = document.createElement('div');
            equationItem.className = 'equation-item';
            equationItem.textContent = equation;
            equationsList.appendChild(equationItem);
        });
        
        this.setContent(content);
        
        // Setup simulation controls
        this.setupSimulationControls(simulationId);
        
        // Initialize parameter values
        this.initializeSimulationState(simulationId, simulation);
    }

    createParameterControl(param, simulationId) {
        const item = document.createElement('div');
        item.className = 'parameter-item';
        
        const paramId = `${simulationId}-${param.name.toLowerCase().replace(/\s+/g, '-')}`;
        
        item.innerHTML = `
            <div class="parameter-label">
                <span>${param.name}</span>
                <span class="parameter-value" id="${paramId}-value">${param.default} ${param.unit}</span>
            </div>
            <input type="range" 
                   class="parameter-slider" 
                   id="${paramId}"
                   min="${param.min}" 
                   max="${param.max}" 
                   step="${this.getStepSize(param)}"
                   value="${param.default}">
        `;
        
        // Add event listener
        const slider = item.querySelector('.parameter-slider');
        slider.addEventListener('input', (e) => {
            this.updateParameter(simulationId, param.name, parseFloat(e.target.value), param.unit);
        });
        
        return item;
    }

    getStepSize(param) {
        const range = param.max - param.min;
        if (range > 100) return 1;
        if (range > 10) return 0.1;
        return 0.01;
    }

    updateParameter(simulationId, paramName, value, unit) {
        const paramId = `${simulationId}-${paramName.toLowerCase().replace(/\s+/g, '-')}`;
        const valueDisplay = document.getElementById(`${paramId}-value`);
        
        if (valueDisplay) {
            const formattedValue = this.formatValue(value);
            valueDisplay.textContent = `${formattedValue} ${unit}`;
        }
        
        // Update simulation state
        if (!this.simulationStates.has(simulationId)) {
            this.simulationStates.set(simulationId, {});
        }
        
        const state = this.simulationStates.get(simulationId);
        state[paramName] = value;
        
        // Update live calculations
        this.updateLiveCalculations(simulationId);
    }

    formatValue(value) {
        if (value >= 1e6) return (value / 1e6).toFixed(2) + 'M';
        if (value >= 1000) return (value / 1000).toFixed(2) + 'k';
        if (value < 0.01) return value.toExponential(2);
        return value.toFixed(2);
    }

    setupSimulationControls(simulationId) {
        const playPauseBtn = document.getElementById('play-pause-btn');
        const resetBtn = document.getElementById('reset-btn');
        const exportBtn = document.getElementById('export-btn');
        const theoryToggle = document.getElementById('theory-toggle');
        
        let isPlaying = false;
        
        playPauseBtn?.addEventListener('click', () => {
            isPlaying = !isPlaying;
            playPauseBtn.innerHTML = isPlaying ? '⏸ Pause' : '▶ Start';
            
            if (isPlaying) {
                this.startSimulation(simulationId);
            } else {
                this.pauseSimulation(simulationId);
            }
        });
        
        resetBtn?.addEventListener('click', () => {
            this.resetSimulation(simulationId);
            isPlaying = false;
            playPauseBtn.innerHTML = '▶ Start';
        });
        
        exportBtn?.addEventListener('click', () => {
            this.exportSimulation(simulationId);
        });
        
        theoryToggle?.addEventListener('click', () => {
            const content = document.getElementById('theory-content');
            const icon = theoryToggle.querySelector('.toggle-icon');
            
            theoryToggle.classList.toggle('collapsed');
            content.classList.toggle('collapsed');
            icon.textContent = theoryToggle.classList.contains('collapsed') ? '▶' : '▼';
        });
    }

    initializeSimulationState(simulationId, simulation) {
        const state = {};
        simulation.parameters.forEach(param => {
            state[param.name] = param.default;
        });
        this.simulationStates.set(simulationId, state);
        
        // Initialize live calculations
        this.updateLiveCalculations(simulationId);
    }

    updateLiveCalculations(simulationId) {
        const state = this.simulationStates.get(simulationId);
        if (!state) return;
        
        // Mock calculations based on simulation type
        const calculations = this.calculatePhysicsValues(simulationId, state);
        
        const energyValue = document.getElementById('energy-value');
        const momentumValue = document.getElementById('momentum-value');
        const timeValue = document.getElementById('time-value');
        
        if (energyValue) energyValue.textContent = `${calculations.energy.toFixed(2)} J`;
        if (momentumValue) momentumValue.textContent = `${calculations.momentum.toFixed(2)} kg⋅m/s`;
        if (timeValue) timeValue.textContent = `${calculations.time.toFixed(2)} s`;
    }

    calculatePhysicsValues(simulationId, state) {
        // Mock physics calculations - in a real app, these would be actual physics computations
        const baseEnergy = Object.values(state).reduce((sum, val) => sum + val, 0);
        const baseMomentum = Math.sqrt(baseEnergy) * 2;
        const time = Date.now() / 1000 % 100;
        
        return {
            energy: baseEnergy * Math.sin(time * 0.1) + baseEnergy,
            momentum: baseMomentum * Math.cos(time * 0.1) + baseMomentum,
            time: time
        };
    }

    startSimulation(simulationId) {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }
        
        const animate = () => {
            this.updateLiveCalculations(simulationId);
            this.animationFrameId = requestAnimationFrame(animate);
        };
        
        animate();
    }

    pauseSimulation(simulationId) {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }

    resetSimulation(simulationId) {
        this.pauseSimulation(simulationId);
        
        // Reset all parameters to defaults
        const category = this.data.categories.find(cat => 
            cat.simulations.some(sim => sim.id === simulationId)
        );
        const simulation = category?.simulations.find(sim => sim.id === simulationId);
        
        if (simulation) {
            simulation.parameters.forEach(param => {
                const paramId = `${simulationId}-${param.name.toLowerCase().replace(/\s+/g, '-')}`;
                const slider = document.getElementById(paramId);
                const valueDisplay = document.getElementById(`${paramId}-value`);
                
                if (slider) slider.value = param.default;
                if (valueDisplay) valueDisplay.textContent = `${param.default} ${param.unit}`;
            });
            
            this.initializeSimulationState(simulationId, simulation);
        }
    }

    exportSimulation(simulationId) {
        const state = this.simulationStates.get(simulationId);
        const exportData = {
            simulationId,
            parameters: state,
            timestamp: new Date().toISOString()
        };
        
        this.showModal('Export Simulation', `
            <h3>Simulation Configuration</h3>
            <pre style="background: rgba(0,0,0,0.5); padding: 1rem; border-radius: 8px; overflow-x: auto;">
${JSON.stringify(exportData, null, 2)}
            </pre>
            <p style="margin-top: 1rem; color: var(--text-secondary);">
                Copy this configuration to share or save your simulation setup.
            </p>
        `);
    }

    render404() {
        const content = document.createElement('div');
        content.innerHTML = `
            <div style="text-align: center; padding: 4rem 0;">
                <h1 style="font-size: 3rem; margin-bottom: 1rem; color: var(--neon-red);">404</h1>
                <p style="font-size: 1.25rem; margin-bottom: 2rem; color: var(--text-secondary);">
                    Simulation not found in the quantum realm
                </p>
                <a href="#/" class="btn btn-primary">Return to Dashboard</a>
            </div>
        `;
        this.setContent(content);
    }

    setContent(content) {
        const container = document.getElementById('content-container');
        container.innerHTML = '';
        container.appendChild(content);
    }

    toggleNavigation() {
        const sidebar = document.getElementById('sidebar');
        sidebar.classList.toggle('open');
    }

    showLoading() {
        document.getElementById('loading-screen').classList.remove('hidden');
    }

    hideLoading() {
        document.getElementById('loading-screen').classList.add('hidden');
    }

    showModal(title, content) {
        const modalBody = document.getElementById('modal-body');
        modalBody.innerHTML = `
            <h2 style="margin-bottom: 1rem; color: var(--text-primary);">${title}</h2>
            ${content}
        `;
        document.getElementById('modal-overlay').classList.remove('hidden');
    }

    closeModal() {
        document.getElementById('modal-overlay').classList.add('hidden');
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.hyperionApp = new HyperionApp();
    
    // Add some visual effects
    setTimeout(() => {
        document.body.classList.add('loaded');
    }, 500);
});

// Add resize handler for responsive behavior
window.addEventListener('resize', () => {
    if (window.innerWidth > 768) {
        document.getElementById('sidebar').classList.remove('open');
    }
});

// Prevent default behavior for hash links
document.addEventListener('click', (e) => {
    if (e.target.matches('a[href^="#"]')) {
        e.preventDefault();
        const href = e.target.getAttribute('href');
        window.location.hash = href;
    }
});