class NewtonsCradle {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;

        // Matter.js engine setup
        this.engine = Matter.Engine.create();
        this.world = this.engine.world;

        // Simulation parameters
        this.gravity = 9.81;
        this.damping = 0.01; // air resistance
        this.restitution = 0.95; // elasticity
        this.numBalls = 5; // default number of balls
        this.ballsPulledBack = 1; // default balls pulled back

        // Ball properties
        this.ballRadius = 20;
        this.ballMass = 1;
        this.stringLength = 200;

        // Arrays to hold balls and constraints
        this.balls = [];
        this.constraints = [];

        // State
        this.isDragging = false;
        this.draggedBall = null;
        this.isPaused = false;

        // Energy data for graph
        this.energyData = {
            kinetic: Array(this.numBalls).fill(0),
            potential: Array(this.numBalls).fill(0),
            total: Array(this.numBalls).fill(0)
        };

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
                    this.engine.gravity.y = value / 9.81;
                }
            },
            {
                id: 'damping',
                name: 'Air Resistance',
                min: 0,
                max: 0.1,
                step: 0.001,
                value: this.damping,
                onChange: (value) => {
                    this.damping = value;
                    for (let ball of this.balls) {
                        ball.frictionAir = value;
                    }
                }
            },
            {
                id: 'restitution',
                name: 'Elasticity',
                min: 0.1,
                max: 1.0,
                step: 0.01,
                value: this.restitution,
                onChange: (value) => {
                    this.restitution = value;
                    for (let ball of this.balls) {
                        ball.restitution = value;
                    }
                }
            },
            {
                id: 'numBalls',
                name: 'Number of Balls',
                min: 3,
                max: 7,
                step: 1,
                value: this.numBalls,
                onChange: (value) => {
                    this.numBalls = value;
                    this.reset();
                }
            },
            {
                id: 'ballsPulledBack',
                name: 'Balls Pulled Back',
                min: 1,
                max: 3,
                step: 1,
                value: this.ballsPulledBack,
                onChange: (value) => {
                    this.ballsPulledBack = Math.min(value, Math.floor(this.numBalls / 2));
                    this.reset();
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
            },
            {
                id: 'pullLeft',
                name: 'Pull Left Side',
                type: 'button',
                onClick: () => {
                    this.pullLeftSide();
                    return 'Pull Left';
                }
            },
            {
                id: 'pullRight',
                name: 'Pull Right Side',
                type: 'button',
                onClick: () => {
                    this.pullRightSide();
                    return 'Pull Right';
                }
            }
        ];

        // Values for display
        this.values = [
            {
                id: 'totalMomentum',
                name: 'Total Momentum',
                value: 0,
                precision: 2
            },
            {
                id: 'totalEnergy',
                name: 'Total Energy',
                value: 0,
                precision: 2
            }
        ];

        console.log("this.values at load:", this.values);

        // Setup canvas mouse events
        this.setupMouseEvents();

        // Initialize simulation
        this.reset();

        // Initialize energy chart
        this.initEnergyChart();
        

        // Add individual ball velocities
        for (let i = 0; i < this.numBalls; i++) {
            this.values.push({
                id: `ball${i}`,
                name: `Ball ${i + 1} Velocity (m/s)`,
                value: 0,
                precision: 2
            });
        }

        // Formulas
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
                title: 'Pendulum Motion',
                description: 'Position of each ball is determined by pendulum physics and constraints.',
                equation: 'x = L sin(θ), y = L cos(θ)'
            }
        ];
    }

    setupMouseEvents() {
        this.canvas.addEventListener('mousedown', (e) => {
            if (this.isPaused) return;
            
            const mousePos = this.getMousePos(e);
            for (let ball of this.balls) {
                const dx = mousePos.x - ball.position.x;
                const dy = mousePos.y - ball.position.y;
                if (Math.sqrt(dx*dx + dy*dy) < this.ballRadius) {
                    this.isDragging = true;
                    this.draggedBall = ball;
                    Matter.Body.setStatic(ball, true);
                    break;
                }
            }
        });

        this.canvas.addEventListener('mousemove', (e) => {
            if (this.isPaused) return;
            
            if (this.isDragging && this.draggedBall) {
                const mousePos = this.getMousePos(e);
                
                // Calculate the distance from pivot point
                const constraint = this.constraints[this.balls.indexOf(this.draggedBall)];
                const pivotX = constraint.pointA.x;
                const pivotY = constraint.pointA.y;
                
                // Calculate direction vector from pivot to mouse
                const dx = mousePos.x - pivotX;
                const dy = mousePos.y - pivotY;
                
                // Normalize to string length
                const distance = Math.sqrt(dx*dx + dy*dy);
                const normalizedX = dx / distance * this.stringLength;
                const normalizedY = dy / distance * this.stringLength;
                
                // Set position
                Matter.Body.setPosition(this.draggedBall, {
                    x: pivotX + normalizedX,
                    y: pivotY + normalizedY
                });
            }
        });

        this.canvas.addEventListener('mouseup', (e) => {
            if (this.isPaused) return;
            
            if (this.isDragging && this.draggedBall) {
                Matter.Body.setStatic(this.draggedBall, false);
                this.isDragging = false;
                this.draggedBall = null;
            }
        });
    }

    getMousePos(event) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top
        };
    }

    pullLeftSide() {
        for (let i = 0; i < this.ballsPulledBack; i++) {
            Matter.Body.setPosition(this.balls[i], {
                x: this.balls[i].position.x - 100,
                y: this.balls[i].position.y - 100
            });
            Matter.Body.setVelocity(this.balls[i], { x: 0, y: 0 });
        }
    }

    pullRightSide() {
        for (let i = 0; i < this.ballsPulledBack; i++) {
            const idx = this.numBalls - 1 - i;
            Matter.Body.setPosition(this.balls[idx], {
                x: this.balls[idx].position.x + 100,
                y: this.balls[idx].position.y - 100
            });
            Matter.Body.setVelocity(this.balls[idx], { x: 0, y: 0 });
        }
    }

    reset() {
        // Clear world
        Matter.World.clear(this.world, false);
        Matter.Engine.clear(this.engine);

        this.balls = [];
        this.constraints = [];

        // Setup gravity
        this.engine.gravity.y = this.gravity / 9.81; // normalize to earth gravity

        // Create balls
        const startX = this.canvas.width / 2 - (this.numBalls - 1) * this.ballRadius * 2 / 2;
        const startY = this.canvas.height / 3;

        for (let i = 0; i < this.numBalls; i++) {
            const ball = Matter.Bodies.circle(startX + i * this.ballRadius * 2, startY + this.stringLength, this.ballRadius, {
                mass: this.ballMass,
                restitution: this.restitution,
                frictionAir: this.damping,
                friction: 0,
                frictionStatic: 0
            });
            this.balls.push(ball);
            Matter.World.add(this.world, ball);

            // Constraint (string)
            const constraint = Matter.Constraint.create({
                pointA: { x: startX + i * this.ballRadius * 2, y: startY },
                bodyB: ball,
                length: this.stringLength,
                stiffness: 1
            });
            this.constraints.push(constraint);
            Matter.World.add(this.world, constraint);
        }

        // Pull back balls on left side
        this.pullLeftSide();

        // Reset energy data
        this.energyData = {
            kinetic: Array(this.numBalls).fill(0),
            potential: Array(this.numBalls).fill(0),
            total: Array(this.numBalls).fill(0)
        };

        // Reset values
        console.log("this.values at reset:", this.values);
        (this.values || []).forEach(val => val.value = 0);
        
        // Update values display to match new number of balls
        while (this.values.length > 2 + this.numBalls) {
            this.values.pop();
        }
        
        while (this.values.length < 2 + this.numBalls) {
            const i = this.values.length - 2;
            this.values.push({
                id: `ball${i}`,
                name: `Ball ${i + 1} Velocity (m/s)`,
                value: 0,
                precision: 2
            });
        }
    }

    onResize(width, height) {
        // Recalculate positions when canvas size changes
        this.reset();
    }

    update(dt) {
        if (this.isPaused) return;
        
        Matter.Engine.update(this.engine, dt * 1000);

        // Calculate total momentum and energy
        let totalMomentum = 0;
        let totalEnergy = 0;

        // Update energy data
        for (let i = 0; i < this.numBalls; i++) {
            const ball = this.balls[i];
            const v = ball.velocity;
            const speed = Math.sqrt(v.x * v.x + v.y * v.y);
            const kinetic = 0.5 * this.ballMass * speed * speed;
            const height = this.canvas.height - ball.position.y;
            const potential = this.ballMass * this.gravity * height / 100; // scale height
            const total = kinetic + potential;

            this.energyData.kinetic[i] = kinetic;
            this.energyData.potential[i] = potential;
            this.energyData.total[i] = total;

            // Calculate momentum
            totalMomentum += this.ballMass * speed * Math.sign(v.x);
            totalEnergy += total;

            // Update values for individual balls
            if (i + 2 < this.values.length) {
                this.values[i + 2].value = speed;
            }
        }

        // Update total values
        this.values[0].value = Math.abs(totalMomentum);
        this.values[1].value = totalEnergy;

        this.draw();
        this.updateEnergyChart();
    }

    draw() {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw ceiling
        ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--border-color');
        ctx.fillRect(0, this.canvas.height / 3 - 10, this.canvas.width, 10);

        // Draw strings
        ctx.strokeStyle = getComputedStyle(document.body).getPropertyValue('--text-color');
        ctx.lineWidth = 2;
        for (let i = 0; i < this.numBalls; i++) {
            const c = this.constraints[i];
            ctx.beginPath();
            ctx.moveTo(c.pointA.x, c.pointA.y);
            ctx.lineTo(this.balls[i].position.x, this.balls[i].position.y);
            ctx.stroke();
        }

        // Draw balls
        for (let ball of this.balls) {
            ctx.beginPath();
            ctx.arc(ball.position.x, ball.position.y, this.ballRadius, 0, Math.PI * 2);
            ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--primary-color');
            ctx.fill();
            ctx.strokeStyle = getComputedStyle(document.body).getPropertyValue('--text-color');
            ctx.lineWidth = 2;
            ctx.stroke();
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

        // Add new data point (sum over all balls)
        const kineticSum = this.energyData.kinetic.reduce((a,b) => a+b, 0);
        const potentialSum = this.energyData.potential.reduce((a,b) => a+b, 0);
        const totalSum = this.energyData.total.reduce((a,b) => a+b, 0);

        this.energyChart.data.datasets[0].data.push(kineticSum);
        this.energyChart.data.datasets[1].data.push(potentialSum);
        this.energyChart.data.datasets[2].data.push(totalSum);

        this.energyChart.update();
    }

    getEnergy() {
        // Sum energies across all balls
        const kineticSum = this.energyData.kinetic.reduce((a,b) => a+b, 0);
        const potentialSum = this.energyData.potential.reduce((a,b) => a+b, 0);
        const totalSum = this.energyData.total.reduce((a,b) => a+b, 0);
        
        return {
            kinetic: kineticSum,
            potential: potentialSum,
            total: totalSum
        };
    }
}
