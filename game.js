// game.js - Space Shooter HTML5 Canvas Game

const initGame = () => {
    const canvas = document.getElementById('game-canvas');
    const ctx = canvas.getContext('2d');
    const scoreDisplay = document.getElementById('score-display');
    const startBtn = document.getElementById('start-btn');
    const overlay = document.getElementById('game-ui');
    const playerNameInput = document.getElementById('player-name');
    const leaderboardDiv = document.getElementById('leaderboard');
    const leaderboardList = document.getElementById('leaderboard-list');

    // Initialize Supabase
    const supabaseUrl = 'https://eedipgtvopycaxztgpuj.supabase.co';
    const supabaseKey = 'sb_publishable_XM6Uv0acZV9OjczTMYO-8w_h-X-L3Gh';
    const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

    async function fetchLeaderboard() {
        try {
            const { data, error } = await supabase
                .from('leaderboard')
                .select('name, score')
                .order('score', { ascending: false })
                .limit(10);
            
            if (error) throw error;
            
            if (data && data.length > 0) {
                leaderboardDiv.classList.remove('hidden');
                leaderboardList.innerHTML = data.map(entry => `<li><span>${entry.name}</span><span>${entry.score}</span></li>`).join('');
            } else {
                leaderboardList.innerHTML = `<li><span style="color: #888;">NO RECORDS YET</span></li>`;
            }
        } catch (err) {
            console.error('Error fetching leaderboard:', err);
        }
    }

    async function submitScore(name, finalScore) {
        if (!name || finalScore <= 0) return;
        try {
            const { error } = await supabase
                .from('leaderboard')
                .insert([{ name: name, score: finalScore }]);
            if (error) throw error;
            fetchLeaderboard(); // Refresh list
        } catch (err) {
            console.error('Error submitting score:', err);
        }
    }

    fetchLeaderboard();

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
    let powerups = [];
    let explosions = [];

    // Input state
    const keys = {
        w: false, a: false, s: false, d: false,
        ArrowUp: false, ArrowLeft: false, ArrowDown: false, ArrowRight: false,
        ' ': false
    };
    
    const mouse = {
        x: canvas.width / 2,
        y: canvas.height - 50,
        isDown: false,
        isActive: false
    };

    // Constants
    const WEAPON_COLORS = {
        normal: '#ff007f',
        laser: '#00ffff',
        spread: '#ffff00',
        bomb: '#ff8800',
        lightning: '#8800ff'
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
            
            this.weaponType = 'normal';
            this.weaponLevel = 1;
        }

        draw() {
            ctx.save();
            ctx.translate(this.x, this.y);
            
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
            if (mouse.isActive && document.pointerLockElement !== canvas) {
                // Fallback mouse follow logic if pointer lock is rejected or lost
                const dx = mouse.x - this.x;
                const dy = mouse.y - this.y;
                const dist = Math.hypot(dx, dy);
                if (dist > 2) {
                    this.x += dx * 0.25 * timeScale * 60; 
                    this.y += dy * 0.25 * timeScale * 60;
                }
            } else if (!mouse.isActive) {
                // Keyboard overrides
                if ((keys.w || keys.ArrowUp) && this.y - this.height/2 > 0) this.y -= this.speed * timeScale;
                if ((keys.s || keys.ArrowDown) && this.y + this.height/2 < canvas.height) this.y += this.speed * timeScale;
                if ((keys.a || keys.ArrowLeft) && this.x - this.width/2 > 0) this.x -= this.speed * timeScale;
                if ((keys.d || keys.ArrowRight) && this.x + this.width/2 < canvas.width) this.x += this.speed * timeScale;
            }

            // Keep in bounds
            this.x = Math.max(this.width/2, Math.min(canvas.width - this.width/2, this.x));
            this.y = Math.max(this.height/2, Math.min(canvas.height - this.height/2, this.y));

            // Shooting
            if ((keys[' '] || mouse.isDown) && this.cooldown <= 0) {
                this.shoot();
                // Cooldowns based on weapon type
                const cooldowns = { normal: 15, laser: 20, spread: 25, bomb: 40, lightning: 10 };
                this.cooldown = cooldowns[this.weaponType] || 15;
            }
            if (this.cooldown > 0) this.cooldown -= timeScale;
        }

        shoot() {
            const bx = this.x;
            const by = this.y - this.height/2;
            let level = Math.min(this.weaponLevel, 5); // cap at level 5
            
            if (this.weaponType === 'normal') {
                for(let i=0; i<level; i++) {
                    const offset = (i - (level-1)/2) * 10;
                    projectiles.push(new Projectile(bx + offset, by, 0, -10, 'normal'));
                }
            } else if (this.weaponType === 'spread') {
                const numShots = 2 + level;
                for(let i=0; i<numShots; i++) {
                    const angle = -Math.PI/2 + (i - (numShots-1)/2) * 0.2;
                    projectiles.push(new Projectile(bx, by, Math.cos(angle)*10, Math.sin(angle)*10, 'spread'));
                }
            } else if (this.weaponType === 'laser') {
                for(let i=0; i<level; i++) {
                    const offset = (i - (level-1)/2) * 15;
                    projectiles.push(new Projectile(bx + offset, by, 0, -20, 'laser'));
                }
            } else if (this.weaponType === 'bomb') {
                // Shoot 1 big bomb, level increases blast radius and speed
                projectiles.push(new Projectile(bx, by, 0, -5 - level, 'bomb'));
            } else if (this.weaponType === 'lightning') {
                for(let i=0; i<level; i++) {
                    // Fire in slight spread, but they will home in
                    const vx = (Math.random() - 0.5) * 10;
                    projectiles.push(new Projectile(bx, by, vx, -8, 'lightning'));
                }
            }
        }
    }

    class Projectile {
        constructor(x, y, vx, vy, type) {
            this.x = x;
            this.y = y;
            this.vx = vx;
            this.vy = vy;
            this.type = type;
            this.color = WEAPON_COLORS[type] || '#fff';
            
            this.radius = type === 'bomb' ? 6 : 3;
            if(type === 'laser') this.radius = 2; // thin
            this.piercing = type === 'laser';
            this.hitList = new Set(); // To track which enemies the laser already hit
        }

        draw() {
            ctx.beginPath();
            if (this.type === 'laser') {
                ctx.rect(this.x - this.radius, this.y - 20, this.radius * 2, 40);
            } else {
                ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            }
            ctx.fillStyle = this.color;
            ctx.shadowBlur = 10;
            ctx.shadowColor = this.color;
            ctx.fill();
        }

        update() {
            if (this.type === 'lightning') {
                // Homing behavior
                let nearest = null;
                let minDist = Infinity;
                for (let e of enemies) {
                    let d = Math.hypot(e.x - this.x, e.y - this.y);
                    if (d < minDist) { minDist = d; nearest = e; }
                }
                if (nearest && minDist < 300) {
                    let dx = nearest.x - this.x;
                    let dy = nearest.y - this.y;
                    let angle = Math.atan2(dy, dx);
                    // Steer towards enemy
                    this.vx += Math.cos(angle) * 1.5 * timeScale;
                    this.vy += Math.sin(angle) * 1.5 * timeScale;
                    // Cap speed
                    let speed = Math.hypot(this.vx, this.vy);
                    if (speed > 12) {
                        this.vx = (this.vx / speed) * 12;
                        this.vy = (this.vy / speed) * 12;
                    }
                }
            }
            
            this.x += this.vx * timeScale;
            this.y += this.vy * timeScale;
        }
    }

    class Explosion {
        constructor(x, y, radius) {
            this.x = x;
            this.y = y;
            this.maxRadius = radius;
            this.radius = 1;
            this.alpha = 1;
            this.color = WEAPON_COLORS['bomb'];
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
            this.radius += 5 * timeScale;
            this.alpha -= 0.05 * timeScale;
        }
    }

    class PowerUp {
        constructor(x, y) {
            this.x = x;
            this.y = y;
            this.radius = 8;
            this.vy = 2;
            
            const rand = Math.random();
            if (rand < 0.4) this.type = 'levelUp';
            else if (rand < 0.55) this.type = 'spread';
            else if (rand < 0.7) this.type = 'laser';
            else if (rand < 0.85) this.type = 'bomb';
            else this.type = 'lightning';
            
            this.color = this.type === 'levelUp' ? '#ffffff' : WEAPON_COLORS[this.type];
        }
        draw() {
            ctx.save();
            ctx.translate(this.x, this.y);
            // Rotate powerup slightly
            ctx.rotate(Date.now() / 200);
            ctx.beginPath();
            ctx.rect(-this.radius, -this.radius, this.radius*2, this.radius*2);
            ctx.fillStyle = this.color;
            ctx.shadowBlur = 15;
            ctx.shadowColor = this.color;
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.strokeRect(-this.radius, -this.radius, this.radius*2, this.radius*2);
            
            // Draw letter inside
            ctx.rotate(-Date.now() / 200);
            ctx.fillStyle = '#fff';
            ctx.font = '10px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            const text = this.type === 'levelUp' ? 'UP' : this.type[0].toUpperCase();
            ctx.fillText(text, 0, 0);
            ctx.restore();
        }
        update() {
            this.y += this.vy * timeScale;
        }
    }

    class Enemy {
        constructor(difficulty = 1) {
            this.radius = Math.random() * 10 + 10;
            this.x = Math.random() * (canvas.width - this.radius * 2) + this.radius;
            this.y = -this.radius;
            let baseSpeed = Math.random() * 2 + 1;
            this.speed = baseSpeed * (1 + (difficulty - 1) * 0.5); 
            this.color = '#39ff14';
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

    // Input Listeners
    window.addEventListener('keydown', (e) => {
        if (keys.hasOwnProperty(e.key)) {
            keys[e.key] = true;
            if (['w', 'a', 's', 'd', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                mouse.isActive = false; // Keyboard takes control
            }
            if(['Space', 'ArrowUp', 'ArrowDown', ' '].includes(e.key)) e.preventDefault();
        }
    });
    window.addEventListener('keyup', (e) => {
        if (keys.hasOwnProperty(e.key)) { keys[e.key] = false; }
    });
    
    // Mouse Listeners for canvas
    document.addEventListener('mousemove', (e) => {
        if (document.pointerLockElement === canvas) {
            if (Math.abs(e.movementX) > 0 || Math.abs(e.movementY) > 0) {
                 mouse.isActive = true;
            }
            if (mouse.isActive && player) {
                // Hardware 1:1 mouse tracking
                // Sensitive movement for fast response
                player.x += e.movementX * 1.5;
                player.y += e.movementY * 1.5;
                
                // Keep strictly in bounds instantly
                player.x = Math.max(player.width/2, Math.min(canvas.width - player.width/2, player.x));
                player.y = Math.max(player.height/2, Math.min(canvas.height - player.height/2, player.y));
            }
        } else {
            // Fallback if not locked
            const rect = canvas.getBoundingClientRect();
            const scaleX = canvas.width / rect.width;
            const scaleY = canvas.height / rect.height;
            mouse.x = (e.clientX - rect.left) * scaleX;
            mouse.y = (e.clientY - rect.top) * scaleY;
            mouse.isActive = true;
        }
    });
    canvas.addEventListener('mousedown', () => mouse.isDown = true);
    canvas.addEventListener('mouseup', () => mouse.isDown = false);
    canvas.addEventListener('mouseleave', () => mouse.isDown = false);

    function createParticles(x, y, color) {
        for(let i=0; i<10; i++) particles.push(new Particle(x, y, color));
    }

    function resetGame() {
        player = new Player();
        projectiles = [];
        enemies = [];
        particles = [];
        powerups = [];
        explosions = [];
        score = 0;
        updateScore();
    }

    function updateScore() {
        scoreDisplay.innerText = `SCORE: ${score.toString().padStart(6, '0')}`;
    }

    function gameOver() {
        isPlaying = false;
        if (document.pointerLockElement === canvas) {
            document.exitPointerLock();
        }
        cancelAnimationFrame(gameLoopId);
        overlay.classList.remove('hidden');
        overlay.querySelector('h2').innerText = 'Loser';
        overlay.querySelector('h2').setAttribute('data-text', 'Loser');
        startBtn.innerText = 'Try Again!';
        
        // Submit score if player entered a name
        const pName = playerNameInput.value.trim() || 'ANONYMOUS';
        if (score > 0) {
            submitScore(pName, score);
        }
    }

    function animate(timestamp) {
        if (!isPlaying) return;
        
        gameLoopId = requestAnimationFrame(animate);
        
        if (!timestamp) timestamp = performance.now();
        let deltaTime = (timestamp - lastTime) / 1000;
        lastTime = timestamp;
        if (deltaTime > 0.1) deltaTime = 0.016; 
        timeScale = deltaTime * 60; 
        
        ctx.shadowBlur = 0;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        player.update();
        player.draw();

        let difficulty = 1 + (score / 2000);
        let spawnRate = 0.03 * difficulty;
        if (spawnRate > 0.15) spawnRate = 0.15; 

        if (Math.random() < spawnRate * timeScale) enemies.push(new Enemy(difficulty));

        // Update arrays backwards
        for (let i = particles.length - 1; i >= 0; i--) {
            let p = particles[i];
            if (p.alpha <= 0) particles.splice(i, 1);
            else { p.update(); p.draw(); }
        }

        for (let i = explosions.length - 1; i >= 0; i--) {
            let e = explosions[i];
            if (e.alpha <= 0) explosions.splice(i, 1);
            else { e.update(); e.draw(); }
        }

        for (let i = powerups.length - 1; i >= 0; i--) {
            let p = powerups[i];
            p.update(); p.draw();
            if (p.y > canvas.height) { powerups.splice(i, 1); continue; }
            
            // Collision with player
            if (Math.hypot(p.x - player.x, p.y - player.y) < p.radius + player.width) {
                if (p.type === 'levelUp') {
                    player.weaponLevel++;
                } else {
                    player.weaponType = p.type;
                    // Retain level when switching weapon
                }
                score += 500; updateScore();
                powerups.splice(i, 1);
            }
        }

        for (let j = projectiles.length - 1; j >= 0; j--) {
            let p = projectiles[j];
            p.update(); p.draw();
            if (p.y < -50 || p.x < -50 || p.x > canvas.width + 50 || p.y > canvas.height + 50) {
                projectiles.splice(j, 1);
            }
        }

        for (let i = enemies.length - 1; i >= 0; i--) {
            let enemy = enemies[i];
            enemy.update(); enemy.draw();

            if (enemy.y - enemy.radius > canvas.height) { enemies.splice(i, 1); continue; }

            // Explosion collision
            let hitByExplosion = false;
            for(let ex of explosions) {
                if (Math.hypot(ex.x - enemy.x, ex.y - enemy.y) < ex.radius + enemy.radius) {
                    hitByExplosion = true; break;
                }
            }
            if (hitByExplosion) {
                createParticles(enemy.x, enemy.y, enemy.color);
                score += 100; updateScore();
                if (Math.random() < 0.1) powerups.push(new PowerUp(enemy.x, enemy.y));
                enemies.splice(i, 1);
                continue;
            }

            let hit = false;
            for (let j = projectiles.length - 1; j >= 0; j--) {
                let p = projectiles[j];
                // Prevent laser hitting same enemy multiple times per frame or sticking
                if (p.piercing && p.hitList && p.hitList.has(enemy)) continue;

                if (Math.hypot(p.x - enemy.x, p.y - enemy.y) < enemy.radius + p.radius * 2) { 
                    createParticles(enemy.x, enemy.y, enemy.color);
                    hit = true;
                    score += 100; updateScore();
                    
                    if (p.type === 'bomb') {
                        explosions.push(new Explosion(p.x, p.y, 80 + player.weaponLevel * 20));
                        projectiles.splice(j, 1);
                    } else if (p.piercing) {
                        p.hitList.add(enemy);
                    } else {
                        projectiles.splice(j, 1);
                    }
                    break;
                }
            }
            
            if (hit) {
                if (Math.random() < 0.1) powerups.push(new PowerUp(enemy.x, enemy.y));
                enemies.splice(i, 1);
                continue;
            }

            if (Math.hypot(player.x - enemy.x, player.y - enemy.y) < enemy.radius + player.width/2) {
                createParticles(player.x, player.y, player.color);
                gameOver();
            }
        }
    }

    startBtn.addEventListener('click', async () => {
        if (isPlaying) return;
        
        // Request Pointer Lock to capture mouse
        try {
            await canvas.requestPointerLock();
        } catch (err) {
            console.warn("Pointer lock failed or not supported:", err);
        }

        // Optionally require a name
        const pName = playerNameInput.value.trim();
        if (!pName) {
            playerNameInput.focus();
            // Just flash it to show it's recommended
            playerNameInput.style.borderColor = 'red';
            setTimeout(() => playerNameInput.style.borderColor = 'var(--neon-pink)', 500);
        }
        
        startBtn.blur(); 
        cancelAnimationFrame(gameLoopId);
        resetGame();
        overlay.classList.add('hidden');
        isPlaying = true;
        lastTime = performance.now();
        animate(performance.now());
    });

    ctx.clearRect(0, 0, canvas.width, canvas.height);
};

window.addEventListener('DOMContentLoaded', initGame);
