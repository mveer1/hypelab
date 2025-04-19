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

// On load, set theme from localStorage
window.addEventListener('DOMContentLoaded', () => {
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark') {
    document.body.setAttribute('data-theme', 'dark');
    document.getElementById('theme-switch').checked = true;
  }
  
  // Optional: On load, select category from URL if provided
  const params = new URLSearchParams(window.location.search);
  const cat = params.get('category');
  if (cat) {
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
    document.querySelectorAll('#category-tabs li').forEach(t => t.classList.remove('active'));
    this.classList.add('active');
    // TODO: Load category-specific content if needed
  });
});

// Simulation list switching
document.querySelectorAll('#simulation-list li').forEach(item => {
  item.addEventListener('click', function() {
    document.querySelectorAll('#simulation-list li').forEach(i => i.classList.remove('active'));
    this.classList.add('active');
    loadSimulation(this.dataset.sim);
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

// Global variables
let canvas, ctx;
let animationFrameId;
let currentSimulation = 'pendulum';

// Initialize the simulation
function initSimulation() {
  // Set up canvas
  canvas = document.getElementById('simulation-canvas');
  ctx = canvas.getContext('2d');
  
  // Set canvas size
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
  
  // Start animation loop
  startAnimationLoop();
}

// Resize canvas to fit container
function resizeCanvas() {
  const container = canvas.parentElement;
  canvas.width = container.clientWidth;
  canvas.height = container.clientHeight;
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
    if (pendulumSim && currentSimulation === 'pendulum') {
      pendulumSim.update(1/60); // Update with a fixed time step
      pendulumSim.draw(ctx, canvas.width, canvas.height);
    }
    
    // Request next frame
    animationFrameId = requestAnimationFrame(animate);
  };
  
  // Start animation
  animate();
}

// Load a specific simulation
function loadSimulation(simName) {
  // Show loading indicator
  showLoadingIndicator(true);
  
  // Set current simulation
  currentSimulation = simName;
  
  // Simulate loading delay
  setTimeout(() => {
    // Hide loading indicator
    showLoadingIndicator(false);
    
    // Initialize the appropriate simulation
    if (simName === 'pendulum') {
      // Pendulum simulation is already initialized in pendulum.js
    } else if (simName === 'chaos') {
      // TODO: Initialize chaos simulation
      alert('Chaos Theory simulation is coming soon!');
    }
  }, 1000);
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
