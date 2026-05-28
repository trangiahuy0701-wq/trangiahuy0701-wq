// game.js - Space Shooter HTML5 Canvas Game

const initGame = () => {
    const canvas = document.getElementById('game-canvas');
    const ctx = canvas.getContext('2d');
    const scoreDisplay = document.getElementById('score-display');
    const startBtn = document.getElementById('start-btn');
    const overlay = document.getElementById('game-ui');

    let gameLoopId;
    let isPlaying = false;
    let score = 0;
    let lastTime = 0;
    let timeScale = 1;

    // Game Entities
    let player;
    let projectiles = [];
    let enemies = [];
    let particles = [];

    // Keys
    const keys = {
        w: false, a: false, s: false, d: false,
        ArrowUp: false, ArrowLeft: false, ArrowDown: false, ArrowRight: false,
        ' ': false
    };

    // Classes
    class Player {
        constructor() {
            this.x = canvas.width / 2;
            this.y = canvas.height - 50;
            this.width = 30;
            this.height = 30;
            this.speed = 5;
            this.color = '#00f0ff';
            this.cooldown = 0;
        }

        draw() {
            ctx.save();
            ctx.translate(this.x, this.y);
            
            // Draw futuristic ship
            ctx.fillStyle = this.color;
            ctx.shadowBlur = 10;
            ctx.shadowColor = this.color;
            
            ctx.beginPath();
            ctx.moveTo(0, -this.height/2);
            ctx.lineTo(this.width/2, this.height/2);
            ctx.lineTo(0, this.height/4);
            ctx.lineTo(-this.width/2, this.height/2);
            ctx.closePath();
            ctx.fill();
            
            ctx.restore();
        }

        update() {
            if ((keys.w || keys.ArrowUp) && this.y - this.height/2 > 0) this.y -= this.speed * timeScale;
            if ((keys.s || keys.ArrowDown) && this.y + this.height/2 < canvas.height) this.y += this.speed * timeScale;
            if ((keys.a || keys.ArrowLeft) && this.x - this.width/2 > 0) this.x -= this.speed * timeScale;
            if ((keys.d || keys.ArrowRight) && this.x + this.width/2 < canvas.width) this.x += this.speed * timeScale;

            if (keys[' '] && this.cooldown <= 0) {
                this.shoot();
                this.cooldown = 15; // Frames between shots
            }
            if (this.cooldown > 0) this.cooldown -= timeScale;
        }

        shoot() {
            projectiles.push(new Projectile(this.x, this.y - this.height/2));
        }
    }

    class Projectile {
        constructor(x, y) {
            this.x = x;
            this.y = y;
            this.radius = 3;
            this.speed = 10;
            this.color = '#ff007f';
        }

        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.shadowBlur = 10;
            ctx.shadowColor = this.color;
            ctx.fill();
        }

        update() {
            this.y -= this.speed * timeScale;
        }
    }

    class Enemy {
        constructor(difficulty = 1) {
            this.radius = Math.random() * 10 + 10;
            this.x = Math.random() * (canvas.width - this.radius * 2) + this.radius;
            this.y = -this.radius;
            // Speed scales up with difficulty
            let baseSpeed = Math.random() * 2 + 1;
            this.speed = baseSpeed * (1 + (difficulty - 1) * 0.5); 
            this.color = '#39ff14'; // Neon green
        }

        draw() {
            ctx.beginPath();
            ctx.moveTo(this.x, this.y + this.radius);
            ctx.lineTo(this.x + this.radius, this.y - this.radius);
            ctx.lineTo(this.x - this.radius, this.y - this.radius);
            ctx.closePath();
            
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 2;
            ctx.shadowBlur = 10;
            ctx.shadowColor = this.color;
            ctx.stroke();
            
            ctx.fillStyle = 'rgba(57, 255, 20, 0.2)';
            ctx.fill();
        }

        update() {
            this.y += this.speed * timeScale;
        }
    }

    class Particle {
        constructor(x, y, color) {
            this.x = x;
            this.y = y;
            this.radius = Math.random() * 2 + 1;
            this.velocity = {
                x: (Math.random() - 0.5) * 5,
                y: (Math.random() - 0.5) * 5
            };
            this.color = color;
            this.alpha = 1;
        }

        draw() {
            ctx.save();
            ctx.globalAlpha = this.alpha;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.fill();
            ctx.restore();
        }

        update() {
            this.x += this.velocity.x * timeScale;
            this.y += this.velocity.y * timeScale;
            this.alpha -= 0.02 * timeScale;
        }
    }

    // Input Handling
    window.addEventListener('keydown', (e) => {
        if (keys.hasOwnProperty(e.key)) {
            keys[e.key] = true;
            // Prevent scrolling when pressing space or arrows
            if(['Space', 'ArrowUp', 'ArrowDown', ' '].includes(e.key)) e.preventDefault();
        }
    });

    window.addEventListener('keyup', (e) => {
        if (keys.hasOwnProperty(e.key)) {
            keys[e.key] = false;
        }
    });

    // Game Logic
    function createParticles(x, y, color) {
        for(let i=0; i<10; i++) {
            particles.push(new Particle(x, y, color));
        }
    }

    function resetGame() {
        player = new Player();
        projectiles = [];
        enemies = [];
        particles = [];
        score = 0;
        updateScore();
    }

    function updateScore() {
        scoreDisplay.innerText = `SCORE: ${score.toString().padStart(6, '0')}`;
    }

    function gameOver() {
        isPlaying = false;
        cancelAnimationFrame(gameLoopId);
        overlay.classList.remove('hidden');
        overlay.querySelector('h2').innerText = 'Loser';
        overlay.querySelector('h2').setAttribute('data-text', 'Loser');
        startBtn.innerText = 'Try Again!';
    }

    function animate(timestamp) {
        if (!isPlaying) return;
        
        gameLoopId = requestAnimationFrame(animate);
        
        if (!timestamp) timestamp = performance.now();
        let deltaTime = (timestamp - lastTime) / 1000;
        lastTime = timestamp;
        if (deltaTime > 0.1) deltaTime = 0.016; // cap delta time
        timeScale = deltaTime * 60; // normalize to 60fps pacing
        
        // Clear canvas cleanly for transparent background
        ctx.shadowBlur = 0;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Update & Draw Player
        player.update();
        player.draw();

        // Calculate Dynamic Difficulty
        // For every 2000 points, difficulty increases by 1.
        let difficulty = 1 + (score / 2000);
        let spawnRate = 0.03 * difficulty;
        if (spawnRate > 0.15) spawnRate = 0.15; // Cap maximum spawn rate

        // Spawn Enemies
        if (Math.random() < spawnRate * timeScale) {
            enemies.push(new Enemy(difficulty));
        }

        // Update Particles backwards
        for (let i = particles.length - 1; i >= 0; i--) {
            let particle = particles[i];
            if (particle.alpha <= 0) {
                particles.splice(i, 1);
            } else {
                particle.update();
                particle.draw();
            }
        }

        // Update Projectiles backwards
        for (let j = projectiles.length - 1; j >= 0; j--) {
            let p = projectiles[j];
            p.update();
            p.draw();
            if (p.y < 0) {
                projectiles.splice(j, 1);
            }
        }

        // Update Enemies backwards
        for (let i = enemies.length - 1; i >= 0; i--) {
            let enemy = enemies[i];
            enemy.update();
            enemy.draw();

            // Remove off-screen enemies
            if (enemy.y - enemy.radius > canvas.height) {
                enemies.splice(i, 1);
                continue;
            }

            // Collision: Projectile hits Enemy
            let hit = false;
            for (let j = projectiles.length - 1; j >= 0; j--) {
                let p = projectiles[j];
                const dist = Math.hypot(p.x - enemy.x, p.y - enemy.y);
                if (dist < enemy.radius + p.radius) {
                    createParticles(enemy.x, enemy.y, enemy.color);
                    projectiles.splice(j, 1);
                    hit = true;
                    score += 100;
                    updateScore();
                    break;
                }
            }
            if (hit) {
                enemies.splice(i, 1);
                continue;
            }

            // Collision: Enemy hits Player
            const distToPlayer = Math.hypot(player.x - enemy.x, player.y - enemy.y);
            if (distToPlayer < enemy.radius + player.width/2) {
                createParticles(player.x, player.y, player.color);
                gameOver();
            }
        }
    }

    // Start Button Event
    startBtn.addEventListener('click', () => {
        if (isPlaying) return;
        startBtn.blur(); // Remove focus so spacebar doesn't trigger it again
        cancelAnimationFrame(gameLoopId);
        resetGame();
        overlay.classList.add('hidden');
        isPlaying = true;
        lastTime = performance.now();
        animate(performance.now());
    });

    // Initial clear
    ctx.clearRect(0, 0, canvas.width, canvas.height);
};

window.addEventListener('DOMContentLoaded', initGame);
