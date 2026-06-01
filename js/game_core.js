
window.addEventListener('DOMContentLoaded', () => {
    canvas = document.getElementById('game-canvas');
    ctx = canvas.getContext('2d');
    scoreDisplay = document.getElementById('score-display');
    startBtn = document.getElementById('start-btn');
    overlay = document.getElementById('game-ui');
    playerNameInput = document.getElementById('player-name');
    leaderboardDiv = document.getElementById('leaderboard');
    leaderboardList = document.getElementById('leaderboard-list');

    if (window.supabase) {
        supabase = window.supabase.createClient(supabaseUrl, supabaseKey);
        fetchLeaderboard();
    }


    // =========================================
    // INPUT LISTENERS
    // =========================================
    window.addEventListener('keydown', (e) => {
        if (keys.hasOwnProperty(e.key)) {
            keys[e.key] = true;
            if (['w', 'a', 's', 'd', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) mouse.isActive = false;
            if (['Space', 'ArrowUp', 'ArrowDown', ' '].includes(e.key)) e.preventDefault();
        }
    });
    window.addEventListener('keyup', (e) => {
        if (keys.hasOwnProperty(e.key)) keys[e.key] = false;
    });
    document.addEventListener('mousemove', (e) => {
        if (document.pointerLockElement === canvas) {
            if (Math.abs(e.movementX) > 0 || Math.abs(e.movementY) > 0) mouse.isActive = true;
            if (mouse.isActive && player) {
                player.x += e.movementX * 1.5;
                player.y += e.movementY * 1.5;
                player.x = Math.max(player.width / 2, Math.min(canvas.width - player.width / 2, player.x));
                player.y = Math.max(player.height / 2, Math.min(canvas.height - player.height / 2, player.y));
            }
        } else {
            const rect = canvas.getBoundingClientRect();
            mouse.x = (e.clientX - rect.left) * (canvas.width / rect.width);
            mouse.y = (e.clientY - rect.top) * (canvas.height / rect.height);
            mouse.isActive = true;
        }
    });
    canvas.addEventListener('mousedown', () => mouse.isDown = true);
    canvas.addEventListener('mouseup', () => mouse.isDown = false);
    canvas.addEventListener('mouseleave', () => mouse.isDown = false);

    // =========================================
    // MAIN GAME LOOP
    // =========================================
    function animate(timestamp) {
        if (!isPlaying) return;
        gameLoopId = requestAnimationFrame(animate);

        if (!timestamp) timestamp = performance.now();
        let deltaTime = (timestamp - lastTime) / 1000;
        lastTime = timestamp;
        if (deltaTime > 0.1) deltaTime = 0.016;
        timeScale = deltaTime * 60;

        const zone = getZone(score);

        // Draw dynamic background
        drawBackground(zone);

        ctx.shadowBlur = 0;

        // Update combo display timer
        if (comboDisplayTimer > 0) comboDisplayTimer -= timeScale;

        player.update();
        player.draw();
        player.drawHUD();

        // Update beam
        updateBeam();

        const difficulty = 1 + (score / 2000);
        let spawnRate = 0.015 + (score / 4000) * 0.01; // Bắt đầu chậm hơn, tăng dần đều
        if (spawnRate > 0.07) spawnRate = 0.07; // Giới hạn spawn thấp hơn một chút

        // Boss spawn logic
        if (score >= nextBossScore && !boss && clearPhaseTimer <= 0) {
            boss = new Boss(difficulty);
        }

        if (boss) {
            spawnRate = 0; // Tỷt hoàn toàn spawn quai khi đánh boss
            boss.update();
            boss.draw();
        }

        // Clear phase sau khi giết boss
        if (clearPhaseTimer > 0) {
            clearPhaseTimer -= timeScale;
            spawnRate = 0; // Không spawn quai trong clear phase

            // Hiển thị thông báo WAVE CLEAR
            const t = clearPhaseTimer;
            const alpha = Math.min(1, t / 60);
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.textAlign = 'center';
            ctx.font = 'bold 22px Orbitron, monospace';
            ctx.fillStyle = '#00ffcc';
            ctx.shadowBlur = 20; ctx.shadowColor = '#00ffcc';
            ctx.fillText('\u2605 WAVE CLEAR \u2605', canvas.width / 2, canvas.height / 2 - 20);
            ctx.font = '13px Orbitron, monospace';
            ctx.fillStyle = '#ffffff';
            ctx.shadowBlur = 0;
            ctx.fillText(`NEXT WAVE IN ${Math.ceil(clearPhaseTimer / 60)}s`, canvas.width / 2, canvas.height / 2 + 10);
            ctx.restore();
        }

        if (!boss && clearPhaseTimer <= 0 && Math.random() < spawnRate * timeScale) {
            enemies.push(new Enemy(zone, difficulty));
        }

        // Particles
        for (let i = particles.length - 1; i >= 0; i--) {
            let p = particles[i];
            if (p.alpha <= 0) particles.splice(i, 1);
            else { p.update(); p.draw(); }
        }

        // Explosions
        for (let i = explosions.length - 1; i >= 0; i--) {
            let e = explosions[i];
            if (e.alpha <= 0) explosions.splice(i, 1);
            else { e.update(); e.draw(); }
        }

        // Shockwaves
        for (let i = shockwaves.length - 1; i >= 0; i--) {
            let sw = shockwaves[i];
            if (sw.alpha <= 0) shockwaves.splice(i, 1);
            else { sw.update(); sw.draw(); }
        }

        // Damage Texts
        for (let i = damageTexts.length - 1; i >= 0; i--) {
            let dt = damageTexts[i];
            if (dt.alpha <= 0) damageTexts.splice(i, 1);
            else { dt.update(); dt.draw(); }
        }

        // PowerUps
        for (let i = powerups.length - 1; i >= 0; i--) {
            let p = powerups[i];
            
            p.update(); p.draw();
            if (p.y > canvas.height) { powerups.splice(i, 1); continue; }
            if (Math.hypot(p.x - player.x, p.y - player.y) < p.radius + player.width * 0.8) {
                GameAudio.powerup();
                if (p.type === 'levelUp') {
                    player.weaponLevel = Math.min(8, player.weaponLevel + 1);
                } else if (p.type === 'manaRegen') {
                    player.manaRegenTimer = 300; // 5 seconds of ultra mana regen
                    damageTexts.push(new DamageText(player.x, player.y - 20, "MANA BOOST!", "#00aaff", 14));
                } else if (player.weaponType === p.type) {
                    // Nếu nhặt TRÙNG loại vũ khí đang dùng -> nâng cấp Level
                    player.weaponLevel = Math.min(8, player.weaponLevel + 1);
                } else {
                    player.weaponType = p.type;
                    if (p.type === 'beam') {
                        beamActive = true;
                        beamTimer = 180;
                    }
                }
                updateScore();
                powerups.splice(i, 1);
            }
        }

        // Enemy projectiles
        for (let j = enemyProjectiles.length - 1; j >= 0; j--) {
            let ep = enemyProjectiles[j];
            ep.update(); ep.draw();
            if (ep.y > canvas.height + 50 || ep.x < -50 || ep.x > canvas.width + 50) {
                enemyProjectiles.splice(j, 1); continue;
            }
            if (player.invincible <= 0 && Math.hypot(player.x - ep.x, player.y - ep.y) < ep.radius + player.width / 2 - 6) {
                const dead = player.takeDamage();
                enemyProjectiles.splice(j, 1);
                if (dead) { createParticles(player.x, player.y, player.color); gameOver(); return; }
            }
        }

        // Player projectiles
        for (let j = projectiles.length - 1; j >= 0; j--) {
            let p = projectiles[j];
            p.update(); p.draw();
            let removed = false;
            if (p.y < -50 || p.x < -50 || p.x > canvas.width + 50 || p.y > canvas.height + 50) {
                projectiles.splice(j, 1); continue;
            }

            // Hit Boss
            if (boss && boss.state === 'active') {
                if (Math.abs(p.x - boss.x) < boss.width / 2 && Math.abs(p.y - boss.y) < boss.height / 2) {
                    if (!(p.piercing && p.hitList && p.hitList.has(boss))) {
                        createParticles(p.x, p.y, boss.color);
                        let dmg = (p.type === 'bomb') ? 250 + player.weaponLevel * 60 : 22 + player.weaponLevel * 6;
                        if (p.type === 'chain') dmg = 60 + player.weaponLevel * 15; // Chain mạnh vs boss
                        boss.hp -= dmg;
                        damageTexts.push(new DamageText(p.x, p.y, Math.floor(dmg).toString(), '#ff0055', 16));
                        
                        if (p.type === 'bomb') {
                            explosions.push(new Explosion(p.x, p.y, 90 + player.weaponLevel * 25));
                            shockwaves.push(new Shockwave(p.x, p.y, '#ff8800', 120 + player.weaponLevel * 20));
                            projectiles.splice(j, 1); removed = true;
                        } else if (p.piercing || p.type === 'chain') {
                            if (p.hitList) p.hitList.add(boss);
                        } else {
                            projectiles.splice(j, 1); removed = true;
                        }
                        if (boss && boss.hp <= 0) killBoss();
                    }
                }
            }
            if (removed) continue;
        }

        // Vẽ tia chain giữa các projectile chain đang bay
        for (let p of projectiles) {
            if (p.type === 'chain' && p.chainHit && p.chainHit.size > 0) {
                const lastHit = [...p.chainHit][p.chainHit.size - 1];
                if (lastHit && lastHit.x) {
                    drawLightningBeam(p.x, p.y, lastHit.x, lastHit.y);
                }
            }
        }

        // Enemies
        for (let i = enemies.length - 1; i >= 0; i--) {
            let enemy = enemies[i];
            enemy.update(); enemy.draw();

            if (enemy.y - enemy.radius > canvas.height) { enemies.splice(i, 1); continue; }

            // Explosion collision
            let hitByExplosion = false;
            for (let ex of explosions) {
                if (Math.hypot(ex.x - enemy.x, ex.y - enemy.y) < ex.radius + enemy.radius) {
                    hitByExplosion = true; break;
                }
            }
            if (hitByExplosion) {
                enemy.hp -= 3;
                damageTexts.push(new DamageText(enemy.x, enemy.y, '3', '#ffaa00', 14));
                if (enemy.hp <= 0) killEnemy(enemy);
                else createParticles(enemy.x, enemy.y, enemy.color);
                continue;
            }

            // Projectile collision
            let hit = false;
            for (let j = projectiles.length - 1; j >= 0; j--) {
                let p = projectiles[j];
                if (p.piercing && p.hitList && p.hitList.has(enemy)) continue;
                if (p.type === 'chain' && p.chainHit && p.chainHit.has(enemy)) continue;
                if (Math.hypot(p.x - enemy.x, p.y - enemy.y) < enemy.radius + p.radius * 2) {
                    const dmg = (p.type === 'bomb') ? 3 : (p.type === 'chain' ? 2 : 1);
                    enemy.hp -= dmg;
                    damageTexts.push(new DamageText(enemy.x, enemy.y - enemy.radius, dmg.toString(), '#fff', 12));
                    createParticles(enemy.x, enemy.y, enemy.color);
                    hit = true;
                    if (p.type === 'bomb') {
                        explosions.push(new Explosion(p.x, p.y, 80 + player.weaponLevel * 20));
                        shockwaves.push(new Shockwave(p.x, p.y, '#ff8800', 100 + player.weaponLevel * 10));
                        projectiles.splice(j, 1);
                    } else if (p.piercing) {
                        p.hitList.add(enemy);
                        score += 50; updateScore(); registerKill();
                        if (enemy.hp <= 0) { killEnemy(enemy); hit = false; break; }
                    } else if (p.type === 'chain' && p.bounces > 0) {
                        // Chain bounce: tìm quai gần nhất chưa bị đánh
                        p.chainHit.add(enemy);
                        p.bounces--;
                        let nextTarget = null, minD = Infinity;
                        for (let e2 of enemies) {
                            if (p.chainHit.has(e2)) continue;
                            let d = Math.hypot(e2.x - enemy.x, e2.y - enemy.y);
                            if (d < minD && d < 200) { minD = d; nextTarget = e2; }
                        }
                        if (nextTarget) {
                            // Đẩy projectile về hướng mục tiêu mới
                            const dx = nextTarget.x - enemy.x, dy = nextTarget.y - enemy.y;
                            const dist = Math.hypot(dx, dy);
                            p.vx = (dx / dist) * 14;
                            p.vy = (dy / dist) * 14;
                            p.x = enemy.x; p.y = enemy.y;
                            // Vẽ tia sét giữa 2 điểm bounce
                            drawLightningBeam(enemy.x, enemy.y, nextTarget.x, nextTarget.y);
                        } else {
                            projectiles.splice(j, 1);
                        }
                        if (enemy.hp <= 0) { killEnemy(enemy); hit = false; break; }
                    } else {
                        projectiles.splice(j, 1);
                    }
                    if (!p.piercing || p.type === 'bomb') break;
                }
            }
            if (hit && enemy.hp <= 0) { killEnemy(enemy); continue; }
            else if (hit) { score += 10; updateScore(); }

            // Beam kills handled in updateBeam(), skip hp check for beam target
            if (enemy === beamTarget) continue;

            // Player collision
            if (player.invincible <= 0 && Math.hypot(player.x - enemy.x, player.y - enemy.y) < enemy.radius + player.width / 2 - 4) {
                const dead = player.takeDamage();
                createParticles(player.x, player.y, player.color);
                enemies.splice(i, 1);
                if (dead) { gameOver(); return; }
            }
        }

        // Boss player collision
        if (boss && boss.state === 'active' && player.invincible <= 0) {
            if (Math.abs(player.x - boss.x) < boss.width / 2 && Math.abs(player.y - boss.y) < boss.height / 2) {
                const dead = player.takeDamage();
                createParticles(player.x, player.y, player.color);
                if (dead) { gameOver(); return; }
            }
        }
    }

    startBtn.addEventListener('click', async () => {
        if (isPlaying) return;
        try { await canvas.requestPointerLock(); } catch (err) { console.warn('Pointer lock failed:', err); }
        const pName = playerNameInput.value.trim();
        if (!pName) {
            playerNameInput.focus();
            playerNameInput.style.borderColor = 'red';
            setTimeout(() => playerNameInput.style.borderColor = 'var(--neon-pink)', 500);
        }
        startBtn.blur();
        cancelAnimationFrame(gameLoopId);
        GameAudio.init(); // Initialize audio context on user interaction
        resetGame();
        overlay.classList.add('hidden');
        isPlaying = true;
        lastTime = performance.now();
        animate(performance.now());
    });

    ctx.clearRect(0, 0, canvas.width, canvas.height);

});
