class NewtonsCradle {
  constructor(canvas, ctx) {
    this.canvas = canvas;
    this.ctx = ctx;
    
    // Physics constants
    this.gravity = 9.81;
    this.restitution = 1.0;
    this.totalPendulums = 5;
    this.pendulumsToPull = 1;
    
    // Pendulum properties
    this.pendulumRadius = 20;
    this.pendulumSpacing = 2.1 * this.pendulumRadius;
    this.stringLength = 200;
    this.maxAngle = Math.PI / 4;
      
       // Energy chart
    this.energyChart = null;
    
    // Initialize pendulums
    this.reset();
    
    // Initialize energy chart
    this.initEnergyChart();
      
    // Define parameters for UI controls
    this.parameters = [
        {
            id: 'gravity',
            name: 'Gravity (m/s²)',
            min: 1,
            max: 20,
            step: 0.1,
            value: this.gravity,
            onChange: (value) => {
                this.gravity = value;
                this.reset();
            }
        },
        {
            id: 'restitution',
            name: 'Restitution',
            min: 0.1,
            max: 1.0,
            step: 0.01,
            value: this.restitution,
            onChange: (value) => {
                this.restitution = value;
                this.reset();
            }
        },
        {
            id: 'totalPendulums',
            name: 'Total Pendulums',
            min: 2,
            max: 10,
            step: 1,
            value: this.totalPendulums,
            onChange: (value) => {
                this.totalPendulums = value;
                this.reset();
            }
        },
        {
            id: 'pendulumsToPull',
            name: 'Pendulums to Pull',
            min: 1,
            max: this.totalPendulums - 1,
            step: 1,
            value: this.pendulumsToPull,
            onChange: (value) => {
                this.pendulumsToPull = Math.min(value, this.totalPendulums - 1);
                this.reset();
            }
        }
    ];
    
    // Define values for display
    this.values = [
        {
            id: 'kineticEnergy',
            name: 'Kinetic Energy (J)',
            value: 0,
            precision: 2
        },
        {
            id: 'potentialEnergy',
            name: 'Potential Energy (J)',
            value: 0,
            precision: 2
        },
        {
            id: 'totalEnergy',
            name: 'Total Energy (J)',
            value: 0,
            precision: 2
        },
        {
            id: 'momentum',
            name: 'Total Momentum',
            value: 0,
            precision: 2
        }
    ];
    
    // Define formulas
    this.formulas = [
        {
            title: 'Conservation of Momentum',
            description: 'In an elastic collision, momentum is conserved.',
            equation: 'm₁v₁ + m₂v₂ = m₁v₁\' + m₂v₂\''
        },
        {
            title: 'Conservation of Energy',
            description: 'In an elastic collision, kinetic energy is conserved.',
            equation: '½m₁v₁² + ½m₂v₂² = ½m₁v₁\'² + ½m₂v₂\'²'
        },
        {
            title: 'Pendulum Period',
            description: 'The period of a simple pendulum depends on its length and gravity.',
            equation: 'T = 2π√(L/g)'
        }
    ];
  }
  
  reset() {
      // Create pendulums
      this.pendulums = [];
      
      for (let i = 0; i < this.totalPendulums; i++) {
          this.pendulums.push({
              x: 0, // Will be set in onResize
              y: 0, // Will be set in onResize
              angle: 0,
              velocity: 0,
              mass: 1
          });
      }
      
      // Set initial angles for pulled pendulums
      for (let i = 0; i < this.pendulumsToPull; i++) {
          this.pendulums[i].angle = -this.maxAngle;
      }
      
      // Calculate positions
      this.onResize(this.canvas.width, this.canvas.height);
  }
  
  onResize(width, height) {
      // Calculate the center point for the pendulum array
      this.centerX = width / 2;
      this.centerY = height / 3;
      
      // Calculate pendulum positions
      this.updatePendulumPositions();
  }
  
  updatePendulumPositions() {
      // Calculate the starting x position to center the pendulums
      const totalWidth = (this.totalPendulums - 1) * this.pendulumSpacing;
      const startX = this.centerX - totalWidth / 2;
      
      for (let i = 0; i < this.pendulums.length; i++) {
          const pendulum = this.pendulums[i];
          
          // Calculate pivot point (where string attaches to ceiling)
          const pivotX = startX + i * this.pendulumSpacing;
          const pivotY = this.centerY - this.stringLength;
          
          // Calculate pendulum position based on angle
          pendulum.pivotX = pivotX;
          pendulum.pivotY = pivotY;
          pendulum.x = pivotX + this.stringLength * Math.sin(pendulum.angle);
          pendulum.y = pivotY + this.stringLength * Math.cos(pendulum.angle);
      }
  }
  
  update(dt) {
      // Apply smaller time steps for stability
      const subSteps = 10;
      const subDt = dt / subSteps;
      
      for (let step = 0; step < subSteps; step++) {
          // Update pendulum physics
          for (let i = 0; i < this.pendulums.length; i++) {
              const pendulum = this.pendulums[i];
              
              // Calculate acceleration due to gravity
              const acceleration = -this.gravity / this.stringLength * Math.sin(pendulum.angle);
              
              // Update velocity and angle
              pendulum.velocity += acceleration * subDt;
              pendulum.angle += pendulum.velocity * subDt;
          }
          
          // Update positions
          this.updatePendulumPositions();
          
          // Check for collisions
          this.handleCollisions();
      }
      
      // Calculate energy values
      this.calculateEnergy();
      
      // Update energy chart
      this.updateEnergyChart();
      
      // Draw the simulation
      this.draw();
  }
  
  handleCollisions() {
      // Check for collisions between adjacent pendulums
      for (let i = 0; i < this.pendulums.length - 1; i++) {
          const p1 = this.pendulums[i];
          const p2 = this.pendulums[i + 1];
          
          // Calculate distance between pendulums
          const dx = p2.x - p1.x;
          const dy = p2.y - p1.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          // If pendulums are overlapping
          if (distance < 2 * this.pendulumRadius) {
              // Calculate collision normal
              const nx = dx / distance;
              const ny = dy / distance;
              
              // Calculate relative velocity along normal
              const v1 = p1.velocity * this.stringLength;
              const v2 = p2.velocity * this.stringLength;
              
              // Project velocities onto collision normal
              const v1n = v1 * Math.cos(p1.angle) * nx + v1 * Math.sin(p1.angle) * ny;
              const v2n = v2 * Math.cos(p2.angle) * nx + v2 * Math.sin(p2.angle) * ny;
              
              // Calculate new velocities (elastic collision)
              const m1 = p1.mass;
              const m2 = p2.mass;
              
              // Calculate impulse
              let impulse = (2 * (v1n - v2n)) / (m1 + m2);
              impulse *= this.restitution;
              
              // Apply impulse to velocities
              p1.velocity -= impulse * m2 * Math.sin(p1.angle);
              p2.velocity += impulse * m1 * Math.sin(p2.angle);
              
              // Move pendulums apart to prevent sticking
              const overlap = 2 * this.pendulumRadius - distance;
              p1.angle -= overlap * 0.5 * nx / this.stringLength;
              p2.angle += overlap * 0.5 * nx / this.stringLength;
          }
      }
  }
  
  calculateEnergy() {
      let kineticEnergy = 0;
      let potentialEnergy = 0;
      let momentum = 0;
      
      for (const pendulum of this.pendulums) {
          // Calculate kinetic energy: 0.5 * m * v^2
          const velocity = pendulum.velocity * this.stringLength;
          kineticEnergy += 0.5 * pendulum.mass * velocity * velocity;
          
          // Calculate potential energy: m * g * h
          // h = L - L*cos(angle) = L * (1 - cos(angle))
          const height = this.stringLength * (1 - Math.cos(pendulum.angle));
          potentialEnergy += pendulum.mass * this.gravity * height;
          
          // Calculate momentum
          momentum += pendulum.mass * velocity;
      }
      
      // Update values
      this.values[0].value = kineticEnergy;
      this.values[1].value = potentialEnergy;
      this.values[2].value = kineticEnergy + potentialEnergy;
      this.values[3].value = Math.abs(momentum);
  }
  
  getEnergy() {
      return {
          kinetic: this.values[0].value,
          potential: this.values[1].value,
          total: this.values[2].value
      };
  }
  
  draw() {
      // Clear canvas
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      
      // Draw ceiling
      this.ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--border-color');
      this.ctx.fillRect(0, this.centerY - this.stringLength - 10, this.canvas.width, 10);
      
      // Draw pendulums
      for (const pendulum of this.pendulums) {
          // Draw string
          this.ctx.beginPath();
          this.ctx.moveTo(pendulum.pivotX, pendulum.pivotY);
          this.ctx.lineTo(pendulum.x, pendulum.y);
          this.ctx.strokeStyle = getComputedStyle(document.body).getPropertyValue('--text-color');
          this.ctx.lineWidth = 2;
          this.ctx.stroke();
          
          // Draw pendulum ball
          this.ctx.beginPath();
          this.ctx.arc(pendulum.x, pendulum.y, this.pendulumRadius, 0, Math.PI * 2);
          this.ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--primary-color');
          this.ctx.fill();
          this.ctx.strokeStyle = getComputedStyle(document.body).getPropertyValue('--text-color');
          this.ctx.lineWidth = 2;
          this.ctx.stroke();
      }
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
                    label: 'Kinetic Energy',
                    data: Array(100).fill(0),
                    borderColor: getComputedStyle(document.body).getPropertyValue('--primary-color'),
                    tension: 0.4,
                    fill: false
                },
                {
                    label: 'Potential Energy',
                    data: Array(100).fill(0),
                    borderColor: getComputedStyle(document.body).getPropertyValue('--secondary-color'),
                    tension: 0.4,
                    fill: false
                },
                {
                    label: 'Total Energy',
                    data: Array(100).fill(0),
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
                    display: false
                },
                y: {
                    beginAtZero: true
                }
            }
        }
        });
    }

    updateEnergyChart() {
        if (!this.energyChart) return;
        
        // Shift data to the left
        this.energyChart.data.datasets[0].data.shift();
        this.energyChart.data.datasets[1].data.shift();
        this.energyChart.data.datasets[2].data.shift();
        
        // Add new data point
        this.energyChart.data.datasets[0].data.push(this.values[0].value);
        this.energyChart.data.datasets[1].data.push(this.values[1].value);
        this.energyChart.data.datasets[2].data.push(this.values[2].value);
        
        // Update chart
        this.energyChart.update();
    }

}
