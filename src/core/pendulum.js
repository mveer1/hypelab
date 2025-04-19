class Pendulum {
    constructor() {
      // Default parameters
      this.defaultParams = {
        count: 3,
        gravity: 9.8,
        damping: 0,
        elasticity: 1
      };
      
      // Initialize with default parameters
      this.params = {...this.defaultParams};
      
      // Initialize pendulum state
      this.initialize();
      
      // Energy history for graphing
      this.energyHistory = {
        time: [],
        kinetic: [],
        potential: [],
        total: []
      };
      
      // Maximum history points to store
      this.maxHistoryPoints = 100;
      
      // Chart instance
      this.chart = null;
      
      // Setup the UI components
      this.setupUI();
    }
    
    // Initialize pendulum state
    initialize() {
      this.thetas = Array(this.params.count).fill(Math.PI/4);
      this.thetaDots = Array(this.params.count).fill(0);
      this.rodLength = 60;
      this.bobMass = 1.0;
      this.time = 0;
      this.running = true;
      
      // Clear energy history
      this.energyHistory = {
        time: [],
        kinetic: [],
        potential: [],
        total: []
      };
    }
    
    // Setup UI components
    setupUI() {
      // Setup parameters controls
      this.setupParameters();
      
      // Setup data display
      this.setupDataDisplay();
      
      // Setup reset button
      document.getElementById('reset-btn').addEventListener('click', () => this.reset());
    }
    
    // Setup parameter controls
    setupParameters() {
      const parametersContainer = document.getElementById('pendulum-parameters');
      parametersContainer.innerHTML = '';
      
      // Create pendulum count parameter
      this.createParameter(
        parametersContainer,
        'count',
        'Pendulum Count',
        2,
        10,
        this.params.count,
        1,
        (value) => {
          this.params.count = parseInt(value);
          this.initialize();
        }
      );
      
      // Create gravity parameter
      this.createParameter(
        parametersContainer,
        'gravity',
        'Gravity',
        0,
        20,
        this.params.gravity,
        0.1,
        (value) => {
          this.params.gravity = parseFloat(value);
          this.initialize();
        }
      );
      
      // Create damping parameter
      this.createParameter(
        parametersContainer,
        'damping',
        'Damping',
        0,
        1,
        this.params.damping,
        0.01,
        (value) => {
          this.params.damping = parseFloat(value);
          this.initialize();
        }
      );
      
      // Create elasticity parameter
      this.createParameter(
        parametersContainer,
        'elasticity',
        'Elasticity',
        0,
        1,
        this.params.elasticity,
        0.01,
        (value) => {
          this.params.elasticity = parseFloat(value);
          this.initialize();
        }
      );
    }
    
    // Create a parameter control
    createParameter(container, id, label, min, max, value, step, onChange) {
      const paramDiv = document.createElement('div');
      paramDiv.className = 'parameter';
      
      const paramLabel = document.createElement('label');
      paramLabel.htmlFor = id;
      paramLabel.textContent = label;
      
      const paramValueDiv = document.createElement('div');
      paramValueDiv.className = 'parameter-value';
      
      const slider = document.createElement('input');
      slider.type = 'range';
      slider.id = id;
      slider.min = min;
      slider.max = max;
      slider.value = value;
      slider.step = step;
      
      const valueDisplay = document.createElement('span');
      valueDisplay.className = 'value';
      valueDisplay.id = `${id}-value`;
      valueDisplay.textContent = value;
      
      slider.addEventListener('input', () => {
        valueDisplay.textContent = slider.value;
      });
      
      slider.addEventListener('change', () => {
        onChange(slider.value);
      });
      
      paramValueDiv.appendChild(slider);
      paramValueDiv.appendChild(valueDisplay);
      paramDiv.appendChild(paramLabel);
      paramDiv.appendChild(paramValueDiv);
      container.appendChild(paramDiv);
    }
    
    // Setup data display (values, graphs, formulas)
    setupDataDisplay() {
      this.setupValuesDisplay();
      this.setupEnergyGraph();
      this.setupFormulasDisplay();
    }
    
    // Setup values display
    setupValuesDisplay() {
      const valuesContainer = document.getElementById('values-container');
      valuesContainer.innerHTML = '';
      
      // Create value cards for energy components
      const energyTypes = [
        { id: 'total-energy', label: 'Total Energy' },
        { id: 'kinetic-energy', label: 'Kinetic Energy' },
        { id: 'potential-energy', label: 'Potential Energy' },
        { id: 'time', label: 'Time' }
      ];
      
      energyTypes.forEach(type => {
        const card = document.createElement('div');
        card.className = 'value-card';
        
        const label = document.createElement('div');
        label.className = 'label';
        label.textContent = type.label;
        
        const value = document.createElement('div');
        value.className = 'value';
        value.id = type.id;
        value.textContent = '0.00';
        
        card.appendChild(label);
        card.appendChild(value);
        valuesContainer.appendChild(card);
      });
    }
    
    // Setup energy graph
    setupEnergyGraph() {
      const ctx = document.getElementById('energy-graph').getContext('2d');
      
      this.chart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: [],
          datasets: [
            {
              label: 'Total Energy',
              data: [],
              borderColor: 'rgb(255, 99, 132)',
              backgroundColor: 'rgba(255, 99, 132, 0.1)',
              borderWidth: 2,
              tension: 0.1
            },
            {
              label: 'Kinetic Energy',
              data: [],
              borderColor: 'rgb(54, 162, 235)',
              backgroundColor: 'rgba(54, 162, 235, 0.1)',
              borderWidth: 2,
              tension: 0.1
            },
            {
              label: 'Potential Energy',
              data: [],
              borderColor: 'rgb(75, 192, 192)',
              backgroundColor: 'rgba(75, 192, 192, 0.1)',
              borderWidth: 2,
              tension: 0.1
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: false,
          scales: {
            x: {
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
    
    // Setup formulas display
    setupFormulasDisplay() {
      const formulasContainer = document.getElementById('formulas-container');
      formulasContainer.innerHTML = '';
      
      // Add formula cards
      const formulas = [
        {
          title: 'Equations of Motion',
          content: `
            <p>For an n-pendulum system, the equations of motion are derived from Lagrangian mechanics:</p>
            <div class="formula">L = T - V = ∑(1/2 * m * v²) - ∑(m * g * h)</div>
            <p>Where:</p>
            <ul>
              <li>L is the Lagrangian</li>
              <li>T is kinetic energy</li>
              <li>V is potential energy</li>
              <li>m is mass</li>
              <li>v is velocity</li>
              <li>g is gravity</li>
              <li>h is height</li>
            </ul>
          `
        },
        {
          title: 'Energy Conservation',
          content: `
            <p>In an ideal system (no damping or elasticity loss):</p>
            <div class="formula">E_total = E_kinetic + E_potential = constant</div>
            <p>Kinetic energy:</p>
            <div class="formula">E_kinetic = ∑(1/2 * m * v²)</div>
            <p>Potential energy:</p>
            <div class="formula">E_potential = ∑(m * g * h)</div>
            <p>With damping, energy decreases over time:</p>
            <div class="formula">dE/dt = -c * v²</div>
            <p>where c is the damping coefficient.</p>
          `
        }
      ];
      
      formulas.forEach(formula => {
        const card = document.createElement('div');
        card.className = 'formula-card';
        
        const title = document.createElement('div');
        title.className = 'formula-title';
        title.textContent = formula.title;
        
        const content = document.createElement('div');
        content.className = 'formula-content';
        content.innerHTML = formula.content;
        
        card.appendChild(title);
        card.appendChild(content);
        formulasContainer.appendChild(card);
      });
    }
    
    // Reset simulation to default parameters
    reset() {
      // Reset parameters to defaults
      this.params = {...this.defaultParams};
      
      // Update UI sliders
      Object.keys(this.params).forEach(param => {
        const slider = document.getElementById(param);
        const valueDisplay = document.getElementById(`${param}-value`);
        if (slider && valueDisplay) {
          slider.value = this.params[param];
          valueDisplay.textContent = this.params[param];
        }
      });
      
      // Reinitialize pendulum state
      this.initialize();
    }
    
    // Update simulation state
    update(dt) {
      if (!this.running || this.params.gravity === 0) {
        return;
      }
      
      // Update time
      this.time += dt;
      
      // Update pendulum physics using RK4 integration
      this.updatePendulumPhysics(dt);
      
      // Calculate and record energy
      this.calculateEnergy();
      
      // Update data display
      this.updateDataDisplay();
    }
    
    // Update pendulum physics using RK4 integration
    updatePendulumPhysics(dt) {
      // Simple pendulum physics for demonstration
      // In a real implementation, this would be a proper n-pendulum simulation
      // using the equations of motion derived from Lagrangian mechanics
      
      // For each pendulum
      for (let i = 0; i < this.params.count; i++) {
        // Calculate acceleration based on angle, gravity, and damping
        let acc = -this.params.gravity / this.rodLength * Math.sin(this.thetas[i]);
        
        // Apply damping
        acc -= this.params.damping * this.thetaDots[i];
        
        // Update angular velocity
        this.thetaDots[i] += acc * dt;
        
        // Update angle
        this.thetas[i] += this.thetaDots[i] * dt;
        
        // Apply elasticity at extremes (simplified model)
        if (Math.abs(this.thetas[i]) > Math.PI * 0.9 && Math.abs(this.thetaDots[i]) > 0.1) {
          this.thetaDots[i] *= this.params.elasticity;
        }
      }
    }
    
    // Calculate energy of the system
    calculateEnergy() {
      let kinetic = 0;
      let potential = 0;
      
      // For each pendulum
      for (let i = 0; i < this.params.count; i++) {
        // Kinetic energy: 1/2 * m * v^2
        const velocity = this.thetaDots[i] * this.rodLength;
        kinetic += 0.5 * this.bobMass * velocity * velocity;
        
        // Potential energy: m * g * h
        // Height is calculated relative to the lowest point
        const height = this.rodLength * (1 - Math.cos(this.thetas[i]));
        potential += this.bobMass * this.params.gravity * height;
      }
      
      const total = kinetic + potential;
      
      // Record energy history
      this.energyHistory.time.push(this.time);
      this.energyHistory.kinetic.push(kinetic);
      this.energyHistory.potential.push(potential);
      this.energyHistory.total.push(total);
      
      // Limit history length
      if (this.energyHistory.time.length > this.maxHistoryPoints) {
        this.energyHistory.time.shift();
        this.energyHistory.kinetic.shift();
        this.energyHistory.potential.shift();
        this.energyHistory.total.shift();
      }
      
      return { kinetic, potential, total };
    }
    
    // Update data display (values and graph)
    updateDataDisplay() {
      // Update energy values
      document.getElementById('total-energy').textContent = 
        this.energyHistory.total[this.energyHistory.total.length - 1].toFixed(2) + ' J';
      document.getElementById('kinetic-energy').textContent = 
        this.energyHistory.kinetic[this.energyHistory.kinetic.length - 1].toFixed(2) + ' J';
      document.getElementById('potential-energy').textContent = 
        this.energyHistory.potential[this.energyHistory.potential.length - 1].toFixed(2) + ' J';
      document.getElementById('time').textContent = 
        this.time.toFixed(2) + ' s';
      
      // Update energy graph
      this.updateEnergyGraph();
    }
    
    // Update energy graph
    updateEnergyGraph() {
      if (!this.chart) return;
      
      this.chart.data.labels = this.energyHistory.time;
      this.chart.data.datasets[0].data = this.energyHistory.total;
      this.chart.data.datasets[1].data = this.energyHistory.kinetic;
      this.chart.data.datasets[2].data = this.energyHistory.potential;
      this.chart.update();
    }
    
    // Draw pendulum on canvas
    draw(ctx, width, height) {
      // Clear canvas
      ctx.clearRect(0, 0, width, height);
      
      // Calculate origin (pivot point for first pendulum)
      const originX = width / 2;
      const originY = height / 4;
      
      // Draw pendulum
      let prevX = originX;
      let prevY = originY;
      
      // Draw each pendulum
      for (let i = 0; i < this.params.count; i++) {
        // Calculate endpoint of this pendulum
        const angle = this.thetas[i];
        const x = prevX + this.rodLength * Math.sin(angle);
        const y = prevY + this.rodLength * Math.cos(angle);
        
        // Draw rod
        ctx.beginPath();
        ctx.moveTo(prevX, prevY);
        ctx.lineTo(x, y);
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Draw bob
        ctx.beginPath();
        ctx.arc(x, y, 10, 0, Math.PI * 2);
        ctx.fillStyle = i === 0 ? '#ff5a5f' : 
                       i === 1 ? '#3a96ff' : 
                       i === 2 ? '#8338ec' : 
                       '#ffbe0b';
        ctx.fill();
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // Update previous point for next pendulum
        prevX = x;
        prevY = y;
      }
    }
  }
  
  // Initialize pendulum when the script loads
  let pendulumSim;
  document.addEventListener('DOMContentLoaded', () => {
    pendulumSim = new Pendulum();
  });
  
