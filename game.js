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
            if ((keys.w || keys.ArrowUp) && this.y - this.height/2 > 0) this.y -= this.speed;
            if ((keys.s || keys.ArrowDown) && this.y + this.height/2 < canvas.height) this.y += this.speed;
            if ((keys.a || keys.ArrowLeft) && this.x - this.width/2 > 0) this.x -= this.speed;
            if ((keys.d || keys.ArrowRight) && this.x + this.width/2 < canvas.width) this.x += this.speed;

            if (keys[' '] && this.cooldown <= 0) {
                this.shoot();
                this.cooldown = 10; // Frames between shots
            }
            if (this.cooldown > 0) this.cooldown--;
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
            this.y -= this.speed;
        }
    }

    class Enemy {
        constructor() {
            this.radius = Math.random() * 10 + 10;
            this.x = Math.random() * (canvas.width - this.radius * 2) + this.radius;
            this.y = -this.radius;
            this.speed = Math.random() * 2 + 1;
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
            this.y += this.speed;
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
            this.x += this.velocity.x;
            this.y += this.velocity.y;
            this.alpha -= 0.02;
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
        overlay.querySelector('h2').innerText = 'SYSTEM FAILURE';
        overlay.querySelector('h2').setAttribute('data-text', 'SYSTEM FAILURE');
        startBtn.innerText = 'REBOOT SYSTEM';
    }

    function animate() {
        if (!isPlaying) return;
        
        gameLoopId = requestAnimationFrame(animate);
        
        // Clear canvas with slight trail effect
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Update & Draw Player
        player.update();
        player.draw();

        // Spawn Enemies
        if (Math.random() < 0.03) {
            enemies.push(new Enemy());
        }

        // Update Particles
        particles.forEach((particle, index) => {
            if (particle.alpha <= 0) {
                particles.splice(index, 1);
            } else {
                particle.update();
                particle.draw();
            }
        });

        // Update Projectiles
        projectiles.forEach((projectile, pIndex) => {
            projectile.update();
            projectile.draw();

            // Remove off-screen projectiles
            if (projectile.y < 0) {
                projectiles.splice(pIndex, 1);
            }
        });

        // Update Enemies
        enemies.forEach((enemy, eIndex) => {
            enemy.update();
            enemy.draw();

            // Remove off-screen enemies
            if (enemy.y - enemy.radius > canvas.height) {
                enemies.splice(eIndex, 1);
            }

            // Collision: Projectile hits Enemy
            projectiles.forEach((projectile, pIndex) => {
                const dist = Math.hypot(projectile.x - enemy.x, projectile.y - enemy.y);
                if (dist - enemy.radius - projectile.radius < 0) {
                    createParticles(enemy.x, enemy.y, enemy.color);
                    enemies.splice(eIndex, 1);
                    projectiles.splice(pIndex, 1);
                    score += 100;
                    updateScore();
                }
            });

            // Collision: Enemy hits Player
            const dist = Math.hypot(player.x - enemy.x, player.y - enemy.y);
            if (dist - enemy.radius - player.width/2 < 0) {
                createParticles(player.x, player.y, player.color);
                gameOver();
            }
        });
    }

    // Start Button Event
    startBtn.addEventListener('click', () => {
        resetGame();
        overlay.classList.add('hidden');
        isPlaying = true;
        animate();
    });

    // Initial clear
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
};

window.addEventListener('DOMContentLoaded', initGame);
