// Debug initialization
console.log('Main.js loading...');

// Add a global error handler
window.addEventListener('error', function(event) {
    console.error('Global error caught:', event.error);
});

// Log when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM fully loaded');
});

// Log when window is loaded (including all resources)
window.addEventListener('load', function() {
    console.log('Window fully loaded');
});

// Global variables
let canvas, ctx;
let animationFrameId;
let currentCategory = 'Core';
let currentSimulation = 'newtonsCradle';
let simulationInstance = null;

// Simulation catalog
const simulationCatalog = {
    Core: [
        { id: 'newtonsCradle', name: "Newton's Cradle", ready: true },
        { id: 'core-sim2', name: "Harmonic Oscillator", ready: false }
    ],
    Quantum: [
        { id: 'quantum-sim1', name: "Wave Function", ready: false },
        { id: 'quantum-sim2', name: "Particle in a Box", ready: false }
    ],
    Gravity: [
        { id: 'gravity-sim1', name: "Orbital Motion", ready: false },
        { id: 'gravity-sim2', name: "Gravitational Lensing", ready: false }
    ],
    Chaos: [
      { id: 'doublePendulum', name: "Double Pendulum", ready: true },
      { id: 'chaos-sim2', name: "Lorenz Attractor", ready: false }
    ]  
};

// Theme toggle logic
const themeSwitch = document.getElementById('theme-switch');
themeSwitch.addEventListener('change', function() {
    if (this.checked) {
        document.body.setAttribute('data-theme', 'dark');
        localStorage.setItem('theme', 'dark');
    } else {
        document.body.setAttribute('data-theme', 'light');
        localStorage.setItem('theme', 'light');
    }
});

// On load, set theme from localStorage and initialize
window.addEventListener('DOMContentLoaded', () => {
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark') {
      document.body.setAttribute('data-theme', 'dark');
      document.getElementById('theme-switch').checked = true;
  }

  // Optional: On load, select category from URL if provided
  const params = new URLSearchParams(window.location.search);
  const cat = params.get('category');
  if (cat && simulationCatalog[cat]) {
      currentCategory = cat;
      document.querySelectorAll('#category-tabs li').forEach(tab => {
          tab.classList.toggle('active', tab.dataset.category === cat);
      });
  }

  // Initialize simulation
  initSimulation();
});

// Category tab switching
document.querySelectorAll('#category-tabs li').forEach(tab => {
  tab.addEventListener('click', function() {
      const category = this.dataset.category;
      console.log('Category clicked:', category);
      // Only process if this is a different category
      if (currentCategory !== category) {
          // Update UI - mark this tab as active
          document.querySelectorAll('#category-tabs li').forEach(t => {
              t.classList.remove('active');
          });
          this.classList.add('active');
          
          // Update current category
          currentCategory = category;
          
          // Update simulation list
          updateSimulationList();
          
          // Select first simulation in the category
          if (simulationCatalog[category] && simulationCatalog[category].length > 0) {
              currentSimulation = simulationCatalog[category][0].id;
              loadSimulation(currentSimulation);
          }
      }
      else {
        console.log('else block opened');
      }
  });
});



// Data tabs switching (Graphs/Values/Formulas)
document.querySelectorAll('.data-tab').forEach(tab => {
    tab.addEventListener('click', function() {
        document.querySelectorAll('.data-tab').forEach(t => t.classList.remove('active'));
        this.classList.add('active');
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        document.getElementById(this.dataset.tab + '-container').classList.add('active');
    });
});

// Reset button
document.getElementById('reset-btn').addEventListener('click', function() {
    if (simulationInstance && typeof simulationInstance.reset === 'function') {
        simulationInstance.reset();
    }
});

// Initialize the simulation
function initSimulation() {
  // Set up canvas
  canvas = document.getElementById('simulation-canvas');
  ctx = canvas.getContext('2d');
  
  // Set canvas size
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
  
  // Update simulation list
  updateSimulationList();
  
  // Load default simulation
  loadSimulation(currentSimulation);
  
}


// Resize canvas to fit container
function resizeCanvas() {
    const container = canvas.parentElement;
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    
    // If simulation is active, tell it the canvas was resized
    if (simulationInstance && typeof simulationInstance.onResize === 'function') {
        simulationInstance.onResize(canvas.width, canvas.height);
    }
}

// Update the simulation list based on current category
function updateSimulationList() {
  const simulationList = document.getElementById('simulation-list');
  
  // Clear the list
  simulationList.innerHTML = '';
  
  // Safety check - ensure the category exists
  if (!simulationCatalog[currentCategory]) {
      console.error(`Category ${currentCategory} not found in simulationCatalog`);
      return;
  }
  
  // Get simulations for the current category
  const simulations = simulationCatalog[currentCategory];
  
  // Add each simulation to the list
  simulations.forEach(sim => {
      const item = document.createElement('li');
      item.dataset.sim = sim.id;
      item.textContent = sim.name;
      
      // Mark the current simulation as active
      if (sim.id === currentSimulation) {
          item.classList.add('active');
      }
      
      // Add click event listener
      item.addEventListener('click', function() {
          // Update active state in UI
          document.querySelectorAll('#simulation-list li').forEach(li => {
              li.classList.remove('active');
          });
          this.classList.add('active');
          
          // Load the simulation
          loadSimulation(sim.id);
      });
      
      // Add to the list
      simulationList.appendChild(item);
  });
  
  // Debug output
  console.log(`Updated simulation list for category: ${currentCategory}`);
  console.log(`Added ${simulations.length} simulations to the list`);
}


// Load a specific simulation
function loadSimulation(simId) {
  // Update current simulation
  currentSimulation = simId;
  
  // Update active state in list
  document.querySelectorAll('#simulation-list li').forEach(item => {
      item.classList.toggle('active', item.dataset.sim === simId);
  });
  
  // Show loading indicator
  showLoadingIndicator(true);
  
  // Find simulation in catalog
  let simInfo = null;
  for (const cat in simulationCatalog) {
      const sim = simulationCatalog[cat].find(s => s.id === simId);
      if (sim) {
          simInfo = sim;
          break;
      }
  }
    
    // Clear any existing animation
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
    
    // Clear parameters
    document.getElementById('parameters').innerHTML = '';
    
    // Clear values
    document.getElementById('values-container').innerHTML = '';
    
    // Clear formulas
    document.getElementById('formulas-container').innerHTML = '';
    
    // Clear any existing chart
    const graphCanvas = document.getElementById('energy-graph');
    if (graphCanvas) {
        const graphContainer = document.getElementById('graphs-container');
        graphContainer.innerHTML = '';
        const newCanvas = document.createElement('canvas');
        newCanvas.id = 'energy-graph';
        graphContainer.appendChild(newCanvas);
    }
    
    // Initialize the simulation
    setTimeout(() => {
        if (simInfo && simInfo.ready) {
            // Create new simulation instance
            switch(simId) {
              case 'newtonsCradle':
                  simulationInstance = new NewtonsCradle(canvas, ctx);
                  break;
              case 'doublePendulum':
                  simulationInstance = new DoublePendulum(canvas, ctx);
                  break;
              // Add other simulations as they are implemented
              default:
                  simulationInstance = null;
          }
            
            if (simulationInstance) {
                // Initialize parameters UI
                if (simulationInstance.parameters) {
                    createParameterControls(simulationInstance.parameters);
                }
                
                // Initialize values display
                if (simulationInstance.values) {
                    createValueCards(simulationInstance.values);
                }
                
                // Initialize formulas
                if (simulationInstance.formulas) {
                    createFormulaCards(simulationInstance.formulas);
                }
                
                // Start animation loop
                startAnimationLoop();
            }
        } else {
            // Show "under construction" for simulations not yet implemented
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--text-color');
            ctx.font = 'bold 24px var(--font-family)';
            ctx.textAlign = 'center';
            ctx.fillText('Simulation Under Construction', canvas.width / 2, canvas.height / 2 - 20);
            ctx.font = '16px var(--font-family)';
            ctx.fillText('This simulation is coming soon!', canvas.width / 2, canvas.height / 2 + 20);
        }
        
        // Hide loading indicator
        showLoadingIndicator(false);
    }, 500);
}

// Create parameter controls based on simulation parameters
// Create parameter controls based on simulation parameters
function createParameterControls(parameters) {
  const parametersContainer = document.getElementById('parameters');
  parametersContainer.innerHTML = ''; // Clear existing controls
  
  parameters.forEach(param => {
      if (param.type === 'checkbox') {
          // Create checkbox control
          const paramDiv = document.createElement('div');
          paramDiv.className = 'parameter parameter-checkbox';
          
          const checkbox = document.createElement('input');
          checkbox.type = 'checkbox';
          checkbox.id = `param-${param.id}`;
          checkbox.checked = param.value;
          
          const label = document.createElement('label');
          label.htmlFor = `param-${param.id}`;
          label.textContent = param.name;
          
          checkbox.addEventListener('change', function() {
              param.value = this.checked;
              if (param.onChange) {
                  param.onChange(param.value);
              }
          });
          
          paramDiv.appendChild(checkbox);
          paramDiv.appendChild(label);
          parametersContainer.appendChild(paramDiv);
          
      } else if (param.type === 'button') {
          // Create button control
          const paramDiv = document.createElement('div');
          paramDiv.className = 'parameter parameter-button';
          
          const button = document.createElement('button');
          button.id = `param-${param.id}`;
          button.textContent = param.name;
          
          button.addEventListener('click', function() {
              if (param.onClick) {
                  const newLabel = param.onClick();
                  if (newLabel) {
                      this.textContent = newLabel;
                  }
              }
          });
          
          paramDiv.appendChild(button);
          parametersContainer.appendChild(paramDiv);
          
      } else {
          // Default: Create slider control
          const paramDiv = document.createElement('div');
          paramDiv.className = 'parameter';
          
          const label = document.createElement('label');
          label.textContent = param.name;
          paramDiv.appendChild(label);
          
          const paramValueDiv = document.createElement('div');
          paramValueDiv.className = 'parameter-value';
          
          const slider = document.createElement('input');
          slider.type = 'range';
          slider.min = param.min;
          slider.max = param.max;
          slider.step = param.step || 0.01;
          slider.value = param.value;
          
          const valueDisplay = document.createElement('span');
          valueDisplay.className = 'value';
          valueDisplay.textContent = param.value;
          
          slider.addEventListener('input', function() {
              param.value = parseFloat(this.value);
              valueDisplay.textContent = param.value.toFixed(2);
              if (param.onChange) {
                  param.onChange(param.value);
              }
          });
          
          paramValueDiv.appendChild(slider);
          paramValueDiv.appendChild(valueDisplay);
          paramDiv.appendChild(paramValueDiv);
          
          parametersContainer.appendChild(paramDiv);
      }
  });
}


// Create value cards for displaying simulation values
function createValueCards(values) {
    const valuesContainer = document.getElementById('values-container');
    
    values.forEach(val => {
        const card = document.createElement('div');
        card.className = 'value-card';
        card.id = `value-${val.id}`;
        
        const label = document.createElement('div');
        label.className = 'label';
        label.textContent = val.name;
        
        const value = document.createElement('div');
        value.className = 'value';
        value.textContent = val.value.toFixed(val.precision || 2);
        
        card.appendChild(label);
        card.appendChild(value);
        
        valuesContainer.appendChild(card);
    });
}

// Create formula cards for displaying relevant formulas
function createFormulaCards(formulas) {
    const formulasContainer = document.getElementById('formulas-container');
    
    formulas.forEach(formula => {
        const card = document.createElement('div');
        card.className = 'formula-card';
        
        const title = document.createElement('div');
        title.className = 'formula-title';
        title.textContent = formula.title;
        
        const content = document.createElement('div');
        content.className = 'formula-content';
        content.textContent = formula.description;
        
        const formulaDisplay = document.createElement('div');
        formulaDisplay.className = 'formula';
        formulaDisplay.textContent = formula.equation;
        
        card.appendChild(title);
        card.appendChild(content);
        card.appendChild(formulaDisplay);
        
        formulasContainer.appendChild(card);
    });
}


// Start animation loop
function startAnimationLoop() {
    // Cancel any existing animation frame
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
    }
    
    // Animation loop
    const animate = () => {
        // Update simulation
        if (simulationInstance && typeof simulationInstance.update === 'function') {
            simulationInstance.update(1/60); // Update with a fixed time step
            
            // Update value displays
            if (simulationInstance.values) {
                simulationInstance.values.forEach(val => {
                    const valueElement = document.querySelector(`#value-${val.id} .value`);
                    if (valueElement) {
                        valueElement.textContent = val.value.toFixed(val.precision || 2);
                    }
                });
            }
        }
        
        // Request next frame
        animationFrameId = requestAnimationFrame(animate);
    };
    
    // Start animation
    animate();
}

// Show/hide loading indicator
function showLoadingIndicator(show) {
    const loadingIndicator = document.getElementById('loading-indicator');
    if (show) {
        loadingIndicator.classList.remove('hidden');
    } else {
        loadingIndicator.classList.add('hidden');
    }
}
