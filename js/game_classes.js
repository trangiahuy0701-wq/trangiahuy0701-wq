
    // =========================================
    // PLAYER CLASS
    // =========================================
    class Player {
        constructor() {
            this.x = canvas.width / 2;
            this.y = canvas.height - 50;
            this.width = 34;
            this.height = 34;
            this.speed = 5;
            this.color = '#00f0ff';
            this.cooldown = 0;
            this.shields = 3;
            this.shieldRegen = 0; // regen timer
            this.invincible = 0; // invincibility frames after hit

            this.weaponType = 'normal';
            this.weaponLevel = 1;

            this.mana = 100;
            this.maxMana = 100;
            
            this.magnetTimer = 0;
            this.manaRegenTimer = 0;
        }

        draw() {
            ctx.save();
            ctx.translate(this.x, this.y);

            ctx.shadowBlur = 18;
            ctx.shadowColor = this.color;

            // Engine flame (animated flicker)
            const t = Date.now();
            const flameH = Math.sin(t * 0.05) * 5 + 14;
            const flameColor = (t % 200 < 100) ? '#ff9900' : '#ff5500';
            ctx.fillStyle = flameColor;
            ctx.shadowColor = '#ff6600';
            ctx.beginPath();
            ctx.moveTo(-7, this.height / 2 - 4);
            ctx.lineTo(0, this.height / 2 + flameH);
            ctx.lineTo(7, this.height / 2 - 4);
            ctx.fill();

            // Side micro-thrusters
            ctx.fillStyle = (t % 300 < 150) ? '#ff7700' : '#ffbb00';
            ctx.beginPath();
            ctx.moveTo(-18, 8);
            ctx.lineTo(-14, 8 + 7);
            ctx.lineTo(-22, 8 + 7);
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(18, 8);
            ctx.lineTo(14, 8 + 7);
            ctx.lineTo(22, 8 + 7);
            ctx.fill();

            ctx.shadowColor = this.color;

            // Main hull body
            ctx.fillStyle = '#1a1a2e';
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(0, -this.height / 2);
            ctx.lineTo(9, -this.height / 4);
            ctx.lineTo(11, this.height / 2 - 4);
            ctx.lineTo(-11, this.height / 2 - 4);
            ctx.lineTo(-9, -this.height / 4);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Main wings
            ctx.beginPath();
            ctx.moveTo(9, -3);
            ctx.lineTo(this.width / 2 + 3, 12);
            ctx.lineTo(this.width / 2 + 2, 22);
            ctx.lineTo(11, 16);
            ctx.closePath();
            ctx.moveTo(-9, -3);
            ctx.lineTo(-this.width / 2 - 3, 12);
            ctx.lineTo(-this.width / 2 - 2, 22);
            ctx.lineTo(-11, 16);
            ctx.closePath();
            ctx.fillStyle = '#0d0d1f';
            ctx.fill();
            ctx.stroke();

            // Tail fins
            ctx.beginPath();
            ctx.moveTo(5, this.height / 2 - 4);
            ctx.lineTo(10, this.height / 2 + 4);
            ctx.lineTo(5, this.height / 2 + 1);
            ctx.closePath();
            ctx.moveTo(-5, this.height / 2 - 4);
            ctx.lineTo(-10, this.height / 2 + 4);
            ctx.lineTo(-5, this.height / 2 + 1);
            ctx.closePath();
            ctx.fillStyle = '#0d0d1f';
            ctx.fill();
            ctx.stroke();

            // Cockpit glass
            ctx.fillStyle = 'rgba(0,240,255,0.25)';
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.ellipse(0, -8, 5, 9, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Hull center stripe
            ctx.fillStyle = this.color;
            ctx.globalAlpha = 0.3;
            ctx.fillRect(-2, -this.height / 4, 4, this.height / 2 - 4);
            ctx.globalAlpha = 1;

            // Invincibility flash
            if (this.invincible > 0 && Math.floor(t / 80) % 2 === 0) {
                ctx.globalAlpha = 0.4;
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(0, 0, 20, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 1;
            }

            ctx.restore();
        }

        drawHUD() {
            // Shield icons (bottom left of canvas)
            for (let i = 0; i < 3; i++) {
                ctx.save();
                ctx.globalAlpha = i < this.shields ? 1 : 0.2;
                ctx.fillStyle = '#00f0ff';
                ctx.shadowBlur = i < this.shields ? 8 : 0;
                ctx.shadowColor = '#00f0ff';
                ctx.beginPath();
                const sx = 14 + i * 22;
                const sy = canvas.height - 18;
                ctx.moveTo(sx, sy - 8);
                ctx.lineTo(sx + 7, sy - 2);
                ctx.lineTo(sx + 7, sy + 4);
                ctx.lineTo(sx, sy + 8);
                ctx.lineTo(sx - 7, sy + 4);
                ctx.lineTo(sx - 7, sy - 2);
                ctx.closePath();
                ctx.fill();
                ctx.restore();
            }

            // Combo multiplier
            if (comboMultiplier > 1 || comboDisplayTimer > 0) {
                ctx.save();
                ctx.globalAlpha = Math.min(1, comboDisplayTimer / 30);
                ctx.fillStyle = '#ffee00';
                ctx.shadowBlur = 10;
                ctx.shadowColor = '#ffee00';
                ctx.font = 'bold 14px Orbitron, monospace';
                ctx.textAlign = 'left';
                ctx.fillText(`x${comboMultiplier} COMBO`, 10, canvas.height - 30);
                ctx.restore();
            }

            // Mana Bar (Energy)
            ctx.save();
            const mw = 120;
            const mx = canvas.width - mw - 20;
            const my = canvas.height - 35;
            
            // Tech border
            ctx.strokeStyle = 'rgba(0, 240, 255, 0.5)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(mx - 10, my + 10);
            ctx.lineTo(mx - 2, my - 2);
            ctx.lineTo(mx + mw + 2, my - 2);
            ctx.lineTo(mx + mw + 10, my + 10);
            ctx.closePath();
            ctx.fillStyle = 'rgba(0, 10, 20, 0.7)';
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#111';
            ctx.fillRect(mx, my, mw, 8);
            ctx.fillStyle = '#00aaff';
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#00aaff';
            ctx.fillRect(mx, my, mw * (this.mana / this.maxMana), 8);
            
            ctx.fillStyle = '#00aaff';
            ctx.shadowBlur = 0;
            ctx.font = '9px Orbitron, monospace';
            ctx.textAlign = 'right';
            ctx.fillText('ENERGY', mx - 15, my + 8);
            ctx.restore();

            // Weapon type display
            ctx.save();
            ctx.fillStyle = WEAPON_COLORS[this.weaponType] || '#fff';
            ctx.font = 'bold 12px Orbitron, monospace';
            ctx.textAlign = 'right';
            ctx.shadowBlur = 8;
            ctx.shadowColor = WEAPON_COLORS[this.weaponType] || '#fff';
            ctx.fillText(`${this.weaponType.toUpperCase()} LV.${this.weaponLevel}`, canvas.width - 20, canvas.height - 15);
            ctx.restore();
        }

        takeDamage() {
            if (this.invincible > 0) return false;
            GameAudio.playerHit();
            this.shields--;
            this.invincible = 120; // ~2 sec at 60fps
            this.shieldRegen = 0;
            // Reset combo on hit
            comboKills = 0;
            comboMultiplier = 1;
            if (this.shields <= 0) return true; // dead
            return false;
        }

        update() {
            if (this.invincible > 0) this.invincible -= timeScale;
            this.shieldRegen += timeScale;
            if (this.shieldRegen >= 900 && this.shields < 3) { // ~15s at 60fps
                this.shields = Math.min(3, this.shields + 1);
                this.shieldRegen = 0;
            }

            // Regen mana
            if (this.manaRegenTimer > 0) {
                this.manaRegenTimer -= timeScale;
                this.mana = Math.min(this.maxMana, this.mana + 2 * timeScale); // Fast regen
            } else {
                this.mana = Math.min(this.maxMana, this.mana + 0.25 * timeScale);
            }

            if (mouse.isActive && document.pointerLockElement !== canvas) {
                const dx = mouse.x - this.x;
                const dy = mouse.y - this.y;
                const dist = Math.hypot(dx, dy);
                if (dist > 2) {
                    this.x += dx * 0.25 * timeScale * 60;
                    this.y += dy * 0.25 * timeScale * 60;
                }
            } else if (!mouse.isActive) {
                if ((keys.w || keys.ArrowUp) && this.y - this.height / 2 > 0) this.y -= this.speed * timeScale;
                if ((keys.s || keys.ArrowDown) && this.y + this.height / 2 < canvas.height) this.y += this.speed * timeScale;
                if ((keys.a || keys.ArrowLeft) && this.x - this.width / 2 > 0) this.x -= this.speed * timeScale;
                if ((keys.d || keys.ArrowRight) && this.x + this.width / 2 < canvas.width) this.x += this.speed * timeScale;
            }

            this.x = Math.max(this.width / 2, Math.min(canvas.width - this.width / 2, this.x));
            this.y = Math.max(this.height / 2, Math.min(canvas.height - this.height / 2, this.y));

            if ((keys[' '] || mouse.isDown) && this.cooldown <= 0) {
                GameAudio.shoot();
                this.shoot();
                // Higher level = faster fire (cooldown reduced by level)
                const baseCooldowns = { normal: 18, laser: 22, spread: 28, bomb: 45, lightning: 12, beam: 5 };
                const base = baseCooldowns[this.weaponType] || 18;
                // Each level reduces cooldown by ~15%, min cap at 6 frames
                this.cooldown = Math.max(6, base - (this.weaponLevel - 1) * (base * 0.15));
            }
            if (this.cooldown > 0) this.cooldown -= timeScale;
        }

        shoot() {
            const bx = this.x;
            const by = this.y - this.height / 2;
            let level = Math.min(this.weaponLevel, 8); // Max level increased to 8

            let typeToShoot = this.weaponType;
            let cost = 0;
            if (typeToShoot === 'lightning') cost = 6;
            else if (typeToShoot === 'chain') cost = 12;
            else if (typeToShoot === 'beam') cost = 40; // activation cost
            else if (typeToShoot === 'bomb') cost = 4;

            if (this.mana < cost) {
                typeToShoot = 'normal'; // Fallback
                level = Math.min(level, 3); // Giảm sức mạnh đạn thường khi hết mana
            } else {
                this.mana -= cost;
            }

            if (typeToShoot === 'beam') {
                beamActive = true;
                beamTimer = 180;
                return;
            }

            if (typeToShoot === 'normal') {
                for (let i = 0; i < level; i++) {
                    const offset = (i - (level - 1) / 2) * 10;
                    projectiles.push(new Projectile(bx + offset, by, 0, -10, 'normal'));
                }
            } else if (typeToShoot === 'spread') {
                const numShots = 2 + level;
                for (let i = 0; i < numShots; i++) {
                    const angle = -Math.PI / 2 + (i - (numShots - 1) / 2) * 0.2;
                    projectiles.push(new Projectile(bx, by, Math.cos(angle) * 10, Math.sin(angle) * 10, 'spread'));
                }
            } else if (typeToShoot === 'laser') {
                for (let i = 0; i < level; i++) {
                    const offset = (i - (level - 1) / 2) * 12;
                    projectiles.push(new Projectile(bx + offset, by, 0, -25, 'laser'));
                }
            } else if (typeToShoot === 'bomb') {
                projectiles.push(new Projectile(bx, by, 0, -5 - level * 1.5, 'bomb'));
            } else if (typeToShoot === 'lightning') {
                for (let i = 0; i < level + 1; i++) {
                    const vx = (Math.random() - 0.5) * (10 + level);
                    projectiles.push(new Projectile(bx, by, vx, -8 - level, 'lightning'));
                }
            } else if (typeToShoot === 'chain') {
                // Chain lightning: mỗi level thêm 1 bounce
                for (let i = 0; i < Math.ceil(level / 2); i++) {
                    const vx = (Math.random() - 0.5) * 6;
                    const p = new Projectile(bx + (i - Math.floor(level/4)) * 12, by, vx, -11, 'chain');
                    p.bounces = 2 + level; // Level càng cao bounce càng nhiều
                    p.chainHit = new Set();
                    projectiles.push(p);
                }
            }
        }
    }

    // =========================================
    // LIGHTNING BEAM RENDERING
    // =========================================
    function drawLightningBeam(x1, y1, x2, y2) {
        const segments = 10;
        const dx = (x2 - x1) / segments;
        const dy = (y2 - y1) / segments;

        for (let pass = 0; pass < 3; pass++) {
            ctx.save();
            ctx.strokeStyle = pass === 0 ? 'rgba(255,255,255,0.9)' : (pass === 1 ? 'rgba(100,200,255,0.6)' : 'rgba(150,100,255,0.3)');
            ctx.lineWidth = pass === 0 ? 2 : (pass === 1 ? 5 : 9);
            ctx.shadowBlur = 20;
            ctx.shadowColor = '#00ffff';
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            for (let i = 1; i <= segments; i++) {
                const jitter = (i < segments) ? (Math.random() - 0.5) * 22 : 0;
                ctx.lineTo(x1 + dx * i + jitter, y1 + dy * i + (Math.random() - 0.5) * 22);
            }
            ctx.stroke();
            ctx.restore();
        }
    }

    function updateBeam() {
        if (!beamActive) return;
        beamTimer -= timeScale;
        if (beamTimer <= 0) {
            beamActive = false;
            beamTarget = null;
            return;
        }

        // Find nearest target
        let nearest = null;
        let minDist = Infinity;
        for (let e of enemies) {
            let d = Math.hypot(e.x - player.x, e.y - player.y);
            if (d < minDist) { minDist = d; nearest = e; }
        }
        if (boss && boss.state === 'active') {
            let d = Math.hypot(boss.x - player.x, boss.y - player.y);
            if (d < minDist) { minDist = d; nearest = boss; }
        }

        beamTarget = nearest;
        if (!nearest) return;

        drawLightningBeam(player.x, player.y - player.height / 2, nearest.x, nearest.y);

        // Deal beam damage
        const dmgRate = 0.5 * timeScale;
        if (nearest === boss) {
            boss.hp -= dmgRate * 20;
            if (boss.hp <= 0) killBoss();
        } else {
            nearest.hp -= dmgRate * 3;
            if (nearest.hp <= 0) {
                killEnemy(nearest);
                beamTarget = null;
            }
        }
    }

    // =========================================
    // PROJECTILE CLASS
    // =========================================
    class Projectile {
        constructor(x, y, vx, vy, type) {
            this.x = x; this.y = y;
            this.vx = vx; this.vy = vy;
            this.type = type;
            this.color = WEAPON_COLORS[type] || '#fff';
            this.radius = type === 'bomb' ? 8 : 4;
            if (type === 'laser') this.radius = 3;
            this.piercing = type === 'laser';
            this.hitList = new Set();
            this.history = [];
            this.frame = 0;
        }

        draw() {
            ctx.save();
            ctx.shadowBlur = 15;
            ctx.shadowColor = this.color;
            ctx.fillStyle = this.color;

            // Trail effect
            if (this.history.length > 0) {
                ctx.beginPath();
                ctx.moveTo(this.history[0].x, this.history[0].y);
                for (let i = 1; i < this.history.length; i++) {
                    ctx.lineTo(this.history[i].x, this.history[i].y);
                }
                ctx.lineTo(this.x, this.y);
                ctx.strokeStyle = this.color;
                ctx.lineWidth = this.radius * 1.5;
                ctx.globalAlpha = 0.3;
                ctx.stroke();
                ctx.globalAlpha = 1.0;
            }

            ctx.translate(this.x, this.y);
            ctx.beginPath();

            if (this.type === 'laser') {
                ctx.rect(-this.radius, -30, this.radius * 2, 60);
                ctx.fill();
                ctx.fillStyle = '#fff';
                ctx.fillRect(-this.radius/2, -30, this.radius, 60);
            } else if (this.type === 'normal') {
                ctx.moveTo(0, -this.radius * 2);
                ctx.lineTo(this.radius, 0);
                ctx.lineTo(0, this.radius * 2);
                ctx.lineTo(-this.radius, 0);
                ctx.closePath();
                ctx.fill();
            } else if (this.type === 'spread') {
                let angle = Math.atan2(this.vy, this.vx) + Math.PI / 2;
                ctx.rotate(angle);
                ctx.moveTo(0, -this.radius * 2);
                ctx.lineTo(this.radius * 1.5, this.radius);
                ctx.lineTo(0, 0);
                ctx.lineTo(-this.radius * 1.5, this.radius);
                ctx.closePath();
                ctx.fill();
            } else if (this.type === 'bomb') {
                let pulse = Math.sin(this.frame * 0.3) * 3;
                ctx.arc(0, 0, this.radius + pulse, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#fff';
                ctx.beginPath();
                ctx.arc(0, 0, this.radius * 0.5, 0, Math.PI * 2);
                ctx.fill();
            } else if (this.type === 'lightning' || this.type === 'chain') {
                ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.moveTo((Math.random()-0.5)*20, (Math.random()-0.5)*20);
                ctx.lineTo((Math.random()-0.5)*20, (Math.random()-0.5)*20);
                ctx.stroke();
            }

            ctx.restore();
        }

        update() {
            this.frame++;
            this.history.push({ x: this.x, y: this.y });
            if (this.history.length > 5) this.history.shift();
            if (this.type === 'lightning') {
                let nearest = null, minDist = Infinity;
                const targets = [...enemies];
                if (boss && boss.state === 'active') targets.push(boss);
                for (let e of targets) {
                    let d = Math.hypot(e.x - this.x, e.y - this.y);
                    if (d < minDist) { minDist = d; nearest = e; }
                }
                if (nearest && minDist < 300) {
                    let dx = nearest.x - this.x, dy = nearest.y - this.y;
                    let angle = Math.atan2(dy, dx);
                    this.vx += Math.cos(angle) * 1.5 * timeScale;
                    this.vy += Math.sin(angle) * 1.5 * timeScale;
                    let speed = Math.hypot(this.vx, this.vy);
                    if (speed > 12) { this.vx = (this.vx / speed) * 12; this.vy = (this.vy / speed) * 12; }
                }
            }
            if (this.type === 'chain') {
                // Chain cũng home nhưng nhanh hơn lightning
                let nearest = null, minDist = Infinity;
                const targets = [...enemies].filter(e => !this.chainHit || !this.chainHit.has(e));
                if (boss && boss.state === 'active') targets.push(boss);
                for (let e of targets) {
                    let d = Math.hypot(e.x - this.x, e.y - this.y);
                    if (d < minDist) { minDist = d; nearest = e; }
                }
                if (nearest && minDist < 400) {
                    let dx = nearest.x - this.x, dy = nearest.y - this.y;
                    let angle = Math.atan2(dy, dx);
                    this.vx += Math.cos(angle) * 2.5 * timeScale;
                    this.vy += Math.sin(angle) * 2.5 * timeScale;
                    let speed = Math.hypot(this.vx, this.vy);
                    if (speed > 15) { this.vx = (this.vx / speed) * 15; this.vy = (this.vy / speed) * 15; }
                }
            }
            this.x += this.vx * timeScale;
            this.y += this.vy * timeScale;
        }
    }

    // =========================================
    // EXPLOSION CLASS
    // =========================================
    class Explosion {
        constructor(x, y, radius) {
            this.x = x; this.y = y;
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
            ctx.shadowBlur = 15;
            ctx.shadowColor = this.color;
            ctx.fill();
            ctx.restore();
        }
        update() { this.radius += 5 * timeScale; this.alpha -= 0.05 * timeScale; }
    }

    // =========================================
    // POWERUP CLASS
    // =========================================
    class PowerUp {
        constructor(x, y, forcedType = null) {
            this.x = x; this.y = y;
            this.radius = 10;
            this.vy = 1.8;
            this.vx = 0; // horizontal drift for boss drops

            if (forcedType) {
                this.type = forcedType;
            } else {
                const rand = Math.random();
                if (rand < 0.2) this.type = 'levelUp';
                else if (rand < 0.3) this.type = 'spread';
                else if (rand < 0.4) this.type = 'laser';
                else if (rand < 0.5) this.type = 'bomb';
                else if (rand < 0.6) this.type = 'beam';
                else this.type = 'manaRegen';
            }
            const SUPPORT_COLORS = { manaRegen: '#00aaff' };
            this.color = this.type === 'levelUp' ? '#ffffff' : (WEAPON_COLORS[this.type] || SUPPORT_COLORS[this.type] || '#aaa');
        }
        draw() {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(Date.now() / 200);
            ctx.beginPath();
            ctx.rect(-this.radius, -this.radius, this.radius * 2, this.radius * 2);
            ctx.fillStyle = this.color;
            ctx.shadowBlur = 18;
            ctx.shadowColor = this.color;
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(-this.radius, -this.radius, this.radius * 2, this.radius * 2);
            ctx.rotate(-Date.now() / 200);
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 9px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            const labels = { levelUp: 'UP', beam: '⚡', chain: '⛓', spread: 'S', laser: 'L', bomb: 'B', lightning: '↯', manaRegen: 'MP' };
            ctx.fillText(labels[this.type] || this.type[0].toUpperCase(), 0, 0);
            ctx.restore();
        }
        update() {
            this.y += this.vy * timeScale;
            this.x += this.vx * timeScale;
            // Drift deceleration
            this.vx *= 0.96;
        }
    }

    // =========================================
    // ENEMY CLASS (with types)
    // =========================================
    class Enemy {
        constructor(zone = 0, difficulty = 1) {
            this.zone = zone;
            const zoneTypes = [
                ['scout'],
                ['scout', 'scout', 'fighter'],
                ['scout', 'fighter', 'asteroid', 'tanker'],
                ['fighter', 'drone', 'asteroid', 'tanker'],
                ['demon', 'fighter', 'drone', 'tanker']
            ];
            const possible = zoneTypes[Math.min(zone, 4)];
            this.type = possible[Math.floor(Math.random() * possible.length)];

            this.radius = this.type === 'asteroid' ? Math.random() * 12 + 18 : (this.type === 'tanker' ? 22 : Math.random() * 8 + 10);
            this.x = Math.random() * (canvas.width - this.radius * 2) + this.radius;
            this.y = -this.radius;

            const speedMult = 1 + (difficulty - 1) * 0.4;
            switch (this.type) {
                case 'scout':    this.speed = (Math.random() * 2 + 1.5) * speedMult;   this.hp = 1; this.color = '#39ff14'; break;
                case 'fighter':  this.speed = (Math.random() * 1.5 + 1.2) * speedMult; this.hp = 2; this.color = '#ff4444'; this.shootTimer = Math.random() * 150 + 100; break;
                case 'drone':    this.speed = (Math.random() * 1.5 + 1) * speedMult;   this.hp = 3; this.color = '#ff8800'; this.angle = Math.random() * Math.PI * 2; this.orbitR = 30; break;
                case 'asteroid': this.speed = (Math.random() * 0.8 + 0.4) * speedMult; this.hp = 4; this.color = '#8888aa'; this.rotation = 0; this.rotSpeed = (Math.random() - 0.5) * 0.05; break;
                case 'demon':    this.speed = (Math.random() * 1.5 + 0.8) * speedMult; this.hp = 3; this.color = '#cc0033'; break;
                case 'kamikaze': this.speed = (Math.random() * 2 + 4.0) * speedMult;   this.hp = 1; this.color = '#ff00ff'; break;
                case 'tanker':   this.speed = (Math.random() * 0.5 + 0.3) * speedMult; this.hp = 15 + difficulty * 2; this.color = '#0066ff'; break;
            }
            this.maxHp = this.hp;
        }

        draw() {
            ctx.save();
            ctx.shadowBlur = 10;
            ctx.shadowColor = this.color;

            if (this.type === 'scout') {
                ctx.strokeStyle = this.color;
                ctx.lineWidth = 2;
                ctx.fillStyle = `rgba(57, 255, 20, 0.15)`;
                ctx.beginPath();
                ctx.moveTo(this.x, this.y + this.radius);
                ctx.lineTo(this.x + this.radius * 0.8, this.y - this.radius * 0.7);
                ctx.lineTo(this.x, this.y - this.radius * 0.3);
                ctx.lineTo(this.x - this.radius * 0.8, this.y - this.radius * 0.7);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
                // Center dot
                ctx.fillStyle = this.color;
                ctx.beginPath();
                ctx.arc(this.x, this.y, 3, 0, Math.PI * 2);
                ctx.fill();
            }

            else if (this.type === 'fighter') {
                ctx.translate(this.x, this.y);
                ctx.rotate(Math.PI); // Facing down
                ctx.fillStyle = '#1a0000';
                ctx.strokeStyle = this.color;
                ctx.lineWidth = 2;
                // Hull
                ctx.beginPath();
                ctx.moveTo(0, -this.radius * 0.8);
                ctx.lineTo(this.radius * 0.5, 0);
                ctx.lineTo(this.radius * 0.3, this.radius * 0.9);
                ctx.lineTo(-this.radius * 0.3, this.radius * 0.9);
                ctx.lineTo(-this.radius * 0.5, 0);
                ctx.closePath();
                ctx.fill(); ctx.stroke();
                // Wings
                ctx.beginPath();
                ctx.moveTo(this.radius * 0.4, 0.1);
                ctx.lineTo(this.radius * 1.1, this.radius * 0.6);
                ctx.lineTo(this.radius * 0.3, this.radius * 0.7);
                ctx.moveTo(-this.radius * 0.4, 0.1);
                ctx.lineTo(-this.radius * 1.1, this.radius * 0.6);
                ctx.lineTo(-this.radius * 0.3, this.radius * 0.7);
                ctx.strokeStyle = '#ff2222';
                ctx.stroke();
                // Eye glow
                ctx.fillStyle = '#ff0000';
                ctx.beginPath();
                ctx.arc(0, -this.radius * 0.3, 3, 0, Math.PI * 2);
                ctx.fill();
            }

            else if (this.type === 'asteroid') {
                ctx.translate(this.x, this.y);
                ctx.rotate(this.rotation);
                ctx.fillStyle = '#3a3a55';
                ctx.strokeStyle = this.color;
                ctx.lineWidth = 2;
                ctx.beginPath();
                const sides = 7;
                for (let i = 0; i < sides; i++) {
                    const ang = (i / sides) * Math.PI * 2;
                    const r = this.radius * (0.7 + Math.sin(i * 2.3) * 0.3);
                    if (i === 0) ctx.moveTo(Math.cos(ang) * r, Math.sin(ang) * r);
                    else ctx.lineTo(Math.cos(ang) * r, Math.sin(ang) * r);
                }
                ctx.closePath();
                ctx.fill(); ctx.stroke();
                // Crack lines
                ctx.strokeStyle = 'rgba(180,180,200,0.3)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(-this.radius * 0.3, -this.radius * 0.2);
                ctx.lineTo(this.radius * 0.1, this.radius * 0.4);
                ctx.stroke();
            }

            else if (this.type === 'drone') {
                ctx.translate(this.x, this.y);
                ctx.rotate(Date.now() / 300);
                ctx.strokeStyle = this.color;
                ctx.lineWidth = 2;
                ctx.fillStyle = 'rgba(255,136,0,0.15)';
                ctx.beginPath();
                ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
                ctx.fill(); ctx.stroke();
                // Inner ring
                ctx.beginPath();
                ctx.arc(0, 0, this.radius * 0.5, 0, Math.PI * 2);
                ctx.stroke();
                // Spokes
                for (let i = 0; i < 4; i++) {
                    const a = (i / 4) * Math.PI * 2;
                    ctx.beginPath();
                    ctx.moveTo(0, 0);
                    ctx.lineTo(Math.cos(a) * this.radius, Math.sin(a) * this.radius);
                    ctx.stroke();
                }
                ctx.fillStyle = '#ff8800';
                ctx.beginPath();
                ctx.arc(0, 0, 4, 0, Math.PI * 2);
                ctx.fill();
            }

            else if (this.type === 'demon') {
                ctx.translate(this.x, this.y);
                ctx.fillStyle = '#1a0000';
                ctx.strokeStyle = this.color;
                ctx.lineWidth = 2.5;
                // Body
                ctx.beginPath();
                ctx.arc(0, 0, this.radius * 0.7, 0, Math.PI * 2);
                ctx.fill(); ctx.stroke();
                // Horns
                ctx.beginPath();
                ctx.moveTo(-this.radius * 0.5, -this.radius * 0.5);
                ctx.lineTo(-this.radius * 0.7, -this.radius * 1.1);
                ctx.lineTo(-this.radius * 0.3, -this.radius * 0.5);
                ctx.moveTo(this.radius * 0.5, -this.radius * 0.5);
                ctx.lineTo(this.radius * 0.7, -this.radius * 1.1);
                ctx.lineTo(this.radius * 0.3, -this.radius * 0.5);
                ctx.strokeStyle = '#ff0033';
                ctx.lineWidth = 2;
                ctx.stroke();
                // Eyes
                ctx.fillStyle = '#ff0000';
                ctx.shadowBlur = 12; ctx.shadowColor = '#ff0000';
                ctx.beginPath();
                ctx.arc(-this.radius * 0.25, -this.radius * 0.1, 3, 0, Math.PI * 2);
                ctx.arc(this.radius * 0.25, -this.radius * 0.1, 3, 0, Math.PI * 2);
                ctx.fill();
            }

            else if (this.type === 'kamikaze') {
                ctx.translate(this.x, this.y);
                ctx.fillStyle = '#110022';
                ctx.strokeStyle = this.color;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(0, this.radius);
                ctx.lineTo(-this.radius * 0.8, -this.radius);
                ctx.lineTo(0, -this.radius * 0.4);
                ctx.lineTo(this.radius * 0.8, -this.radius);
                ctx.closePath();
                ctx.fill(); ctx.stroke();
                
                // Động cơ phản lực màu hồng
                ctx.fillStyle = '#ff00ff';
                ctx.beginPath();
                ctx.arc(0, -this.radius, 3 + Math.random() * 3, 0, Math.PI * 2);
                ctx.fill();
            }

            else if (this.type === 'tanker') {
                ctx.translate(this.x, this.y);
                ctx.fillStyle = '#001a33';
                ctx.strokeStyle = this.color;
                ctx.lineWidth = 3;
                
                // Khiên bao quanh
                ctx.beginPath();
                const sides = 6;
                for (let i = 0; i < sides; i++) {
                    const ang = (i / sides) * Math.PI * 2 + Math.PI / 2;
                    if (i === 0) ctx.moveTo(Math.cos(ang) * this.radius, Math.sin(ang) * this.radius);
                    else ctx.lineTo(Math.cos(ang) * this.radius, Math.sin(ang) * this.radius);
                }
                ctx.closePath();
                ctx.fill(); ctx.stroke();

                // Lõi sáng
                ctx.fillStyle = '#00aaff';
                ctx.beginPath();
                ctx.arc(0, 0, this.radius * 0.4, 0, Math.PI * 2);
                ctx.fill();
            }

            // HP bar for multi-hp enemies
            if (this.maxHp > 1) {
                const bw = this.radius * 2;
                const bx = this.x - this.radius;
                const by = this.y + this.radius + 4;
                ctx.globalAlpha = 1;
                ctx.fillStyle = '#333';
                ctx.fillRect(bx, by, bw, 3);
                ctx.fillStyle = this.color;
                ctx.fillRect(bx, by, bw * (this.hp / this.maxHp), 3);
            }

            ctx.restore();
        }

        update() {
            const z = getZone(score);

            if (this.type === 'asteroid') {
                this.rotation += this.rotSpeed * timeScale;
                this.y += this.speed * timeScale;
            } else if (this.type === 'drone') {
                this.angle += 0.02 * timeScale;
                this.y += this.speed * 0.5 * timeScale;
                this.x += Math.sin(this.angle) * 2;
            } else if (this.type === 'demon') {
                // Homing toward player
                if (player) {
                    const dx = player.x - this.x;
                    const dy = player.y - this.y;
                    const dist = Math.hypot(dx, dy);
                    this.x += (dx / dist) * this.speed * 0.6 * timeScale;
                    this.y += (dy / dist) * this.speed * 0.6 * timeScale;
                } else {
                    this.y += this.speed * timeScale;
                }
            } else if (this.type === 'kamikaze') {
                // Lao xuống thẳng người chơi với tốc độ cao
                if (player && this.y < player.y - 100) {
                    const dx = player.x - this.x;
                    const dy = player.y - this.y;
                    const dist = Math.hypot(dx, dy);
                    this.x += (dx / dist) * this.speed * 0.4 * timeScale;
                    this.y += (dy / dist) * this.speed * timeScale;
                } else {
                    this.y += this.speed * timeScale;
                }
            } else if (this.type === 'fighter') {
                this.y += this.speed * timeScale;
                // Fighter shoots back
                this.shootTimer -= timeScale;
                if (this.shootTimer <= 0 && this.y > 0) {
                    this.shootTimer = Math.random() * 120 + 80;
                    if (player) {
                        const dx = player.x - this.x, dy = player.y - this.y;
                        const dist = Math.hypot(dx, dy);
                        const spd = 3 + z * 0.5;
                        enemyProjectiles.push(new EnemyProjectile(this.x, this.y, (dx / dist) * spd, (dy / dist) * spd, 3));
                    }
                }
            } else {
                this.y += this.speed * timeScale;
            }
        }
    }

    // =========================================
    // PARTICLE CLASS
    // =========================================
    class Particle {
        constructor(x, y, color) {
            this.x = x; this.y = y;
            this.radius = Math.random() * 2.5 + 1;
            this.velocity = { x: (Math.random() - 0.5) * 6, y: (Math.random() - 0.5) * 6 };
            this.color = color;
            this.alpha = 1;
        }
        draw() {
            ctx.save();
            ctx.globalAlpha = this.alpha;
            ctx.shadowBlur = 5; ctx.shadowColor = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.fill();
            ctx.restore();
        }
        update() {
            this.x += this.velocity.x * timeScale;
            this.y += this.velocity.y * timeScale;
            this.alpha -= 0.022 * timeScale;
        }
    }

    // =========================================
    // ENEMY PROJECTILE CLASS
    // =========================================
    class EnemyProjectile {
        constructor(x, y, vx, vy, radius = 4) {
            this.x = x; this.y = y;
            this.vx = vx; this.vy = vy;
            this.radius = radius;
            this.color = '#ff0055';
        }
        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.shadowBlur = 10; ctx.shadowColor = this.color;
            ctx.fill();
        }
        update() { this.x += this.vx * timeScale; this.y += this.vy * timeScale; }
    }

    // =========================================
    // BOSS CLASS (with Phase 2)
    // =========================================
    class Boss {
        constructor(difficulty) {
            this.x = canvas.width / 2;
            this.y = -100;
            this.width = 130;
            this.height = 85;
            // Giảm HP đáng kể so với trước - dễ hơn ở boss đầu tiên
            this.maxHp = 800 + difficulty * 400;
            this.hp = this.maxHp;
            this.vx = 1.8 * (1 + difficulty * 0.06);
            this.color = '#ff0055';
            this.state = 'entering';
            this.attackCooldown = 0;
            this.difficulty = difficulty;
            this.phase = 1;
            this.enrageFlash = 0;
        }

        draw() {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.shadowBlur = 25;
            ctx.shadowColor = this.color;

            // Phase 2 enrage glow
            if (this.phase === 2) {
                ctx.globalAlpha = 0.15 + Math.sin(Date.now() / 80) * 0.1;
                ctx.fillStyle = '#aa00ff';
                ctx.beginPath();
                ctx.arc(0, 0, this.width * 0.7, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 1;
            }

            // Body hexagon
            ctx.fillStyle = '#11001a';
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(-this.width / 2, 0);
            ctx.lineTo(-this.width / 3, -this.height / 2);
            ctx.lineTo(this.width / 3, -this.height / 2);
            ctx.lineTo(this.width / 2, 0);
            ctx.lineTo(this.width / 3, this.height / 2);
            ctx.lineTo(-this.width / 3, this.height / 2);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Inner armor plates
            ctx.strokeStyle = this.phase === 2 ? '#aa00ff' : '#ff335577';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(-this.width / 3.5, 0);
            ctx.lineTo(-this.width / 5, -this.height / 2.5);
            ctx.lineTo(this.width / 5, -this.height / 2.5);
            ctx.lineTo(this.width / 3.5, 0);
            ctx.lineTo(this.width / 5, this.height / 2.5);
            ctx.lineTo(-this.width / 5, this.height / 2.5);
            ctx.closePath();
            ctx.stroke();

            // Pulsing core
            const pulse = (Date.now() % 500 < 250);
            ctx.fillStyle = pulse ? (this.phase === 2 ? '#aa00ff' : '#fff') : this.color;
            ctx.shadowBlur = 20; ctx.shadowColor = this.color;
            ctx.beginPath();
            ctx.arc(0, 0, 18, 0, Math.PI * 2);
            ctx.fill();

            // Cannon barrels
            ctx.fillStyle = '#222';
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 2;
            // Left cannon
            ctx.fillRect(-this.width / 2.2 - 5, 5, 12, 30);
            ctx.strokeRect(-this.width / 2.2 - 5, 5, 12, 30);
            // Right cannon
            ctx.fillRect(this.width / 2.2 - 7, 5, 12, 30);
            ctx.strokeRect(this.width / 2.2 - 7, 5, 12, 30);
            // Center cannon (phase 2)
            if (this.phase === 2) {
                ctx.fillStyle = '#330033';
                ctx.strokeStyle = '#aa00ff';
                ctx.fillRect(-6, 10, 12, 35);
                ctx.strokeRect(-6, 10, 12, 35);
            }

            ctx.restore();

            // Health bar
            const hpRatio = Math.max(0, this.hp / this.maxHp);
            const barColor = this.phase === 2 ? '#aa00ff' : this.color;
            ctx.fillStyle = '#1a0000';
            ctx.fillRect(canvas.width / 2 - 200, 22, 400, 12);
            const grad = ctx.createLinearGradient(canvas.width / 2 - 200, 0, canvas.width / 2 + 200, 0);
            grad.addColorStop(0, barColor);
            grad.addColorStop(1, this.phase === 2 ? '#ff0055' : '#ff336688');
            ctx.fillStyle = grad;
            ctx.fillRect(canvas.width / 2 - 200, 22, 400 * hpRatio, 12);
            ctx.strokeStyle = '#ffffff66';
            ctx.strokeRect(canvas.width / 2 - 200, 22, 400, 12);
            // Phase 2 midpoint marker
            ctx.strokeStyle = '#ffffff44';
            ctx.beginPath();
            ctx.moveTo(canvas.width / 2, 22);
            ctx.lineTo(canvas.width / 2, 34);
            ctx.stroke();

            // Boss name label
            ctx.fillStyle = this.phase === 2 ? '#aa00ff' : '#ff0055';
            ctx.font = 'bold 11px Orbitron, monospace';
            ctx.textAlign = 'center';
            ctx.shadowBlur = 8; ctx.shadowColor = barColor;
            const phaseTxt = this.phase === 2 ? ' [ PHASE 2 ]' : '';
            ctx.fillText(`⚠ BOSS${phaseTxt} ⚠`, canvas.width / 2, 18);
        }

        update() {
            // Check phase 2 trigger
            if (this.phase === 1 && this.hp <= this.maxHp * 0.5) {
                this.phase = 2;
                this.color = '#aa00ff';
                this.vx *= 1.3; // Tăng tốc nhẹ hơn (từ 1.5 xuống 1.3)
                createParticles(this.x, this.y, '#aa00ff');
                for (let i = 0; i < 20; i++) particles.push(new Particle(this.x + (Math.random() - 0.5) * 100, this.y + (Math.random() - 0.5) * 60, '#aa00ff'));
            }

            if (this.state === 'entering') {
                this.y += 1.2 * timeScale;
                if (this.y >= 90) { this.y = 90; this.state = 'active'; }
            } else if (this.state === 'active') {
                this.x += this.vx * timeScale;
                if (this.x - this.width / 2 <= 0 || this.x + this.width / 2 >= canvas.width) {
                    this.vx *= -1;
                    this.x = Math.max(this.width / 2, Math.min(canvas.width - this.width / 2, this.x));
                }
                if (this.attackCooldown <= 0) {
                    this.shoot();
                    // Phase 2 bắn chậm hơn một chút so với trước
                    const baseCooldown = this.phase === 2 ? 45 : 55;
                    this.attackCooldown = Math.max(30, baseCooldown - this.difficulty * 1.5); // Giới hạn tốc độ xả đạn
                }
                this.attackCooldown -= timeScale;
            }
        }

        shoot() {
            // Giới hạn tốc độ bay đạn của boss, không cho tăng quá nhanh
            const spd = Math.min(6, 3 + this.difficulty * 0.15);
            // Side cannons - bắn thẳng xuống, dễ né hơn
            const side = (Date.now() % 400 < 200) ? -1 : 1;
            enemyProjectiles.push(new EnemyProjectile(this.x + side * (this.width / 2.2 - 5), this.y + this.height / 2 - 5, 0, spd, 4));

            // Phase 2: bắn đạn thẳng góc hẹp, không bắn chéo full màn
            if (this.phase === 2) {
                enemyProjectiles.push(new EnemyProjectile(this.x, this.y, 0, spd * 1.2, 4));
                enemyProjectiles.push(new EnemyProjectile(this.x - 20, this.y, -spd * 0.3, spd * 1.2, 4));
                enemyProjectiles.push(new EnemyProjectile(this.x + 20, this.y, spd * 0.3, spd * 1.2, 4));
            }
        }
    }

    // =========================================
    // VFX CLASSES
    // =========================================
    class DamageText {
        constructor(x, y, text, color = '#fff', size = 12) {
            this.x = x + (Math.random() - 0.5) * 20;
            this.y = y + (Math.random() - 0.5) * 10;
            this.text = text;
            this.color = color;
            this.size = size;
            this.alpha = 1;
            this.vy = -1.5;
            this.life = 60;
        }
        update() {
            this.y += this.vy * timeScale;
            this.life -= timeScale;
            this.alpha = Math.max(0, this.life / 60);
        }
        draw() {
            ctx.save();
            ctx.globalAlpha = this.alpha;
            ctx.fillStyle = this.color;
            ctx.shadowBlur = 8;
            ctx.shadowColor = this.color;
            ctx.font = `bold ${this.size}px Orbitron, monospace`;
            ctx.textAlign = 'center';
            ctx.fillText(this.text, this.x, this.y);
            ctx.restore();
        }
    }

    class Shockwave {
        constructor(x, y, color = '#00f0ff', maxRadius = 150) {
            this.x = x;
            this.y = y;
            this.radius = 0;
            this.maxRadius = maxRadius;
            this.color = color;
            this.alpha = 1;
            this.speed = maxRadius / 20;
        }
        update() {
            this.radius += this.speed * timeScale;
            this.alpha = Math.max(0, 1 - (this.radius / this.maxRadius));
        }
        draw() {
            if (this.alpha <= 0) return;
            ctx.save();
            ctx.globalAlpha = this.alpha;
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 4 * this.alpha;
            ctx.shadowBlur = 10;
            ctx.shadowColor = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }
    }