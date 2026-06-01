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
        } catch (err) { console.error('Error fetching leaderboard:', err); }
    }

    async function saveScore(pName, score) {
        if (!pName || score <= 0) return;
        try {
            const { data: existingRecords, error: fetchErr } = await supabase
                .from('leaderboard').select('id, score').eq('name', pName).order('score', { ascending: false });
            if (fetchErr) throw fetchErr;
            if (existingRecords && existingRecords.length > 0) {
                const bestRecord = existingRecords[0];
                if (score > bestRecord.score) {
                    await supabase.from('leaderboard').update({ score: score, created_at: new Date().toISOString() }).eq('id', bestRecord.id);
                }
                if (existingRecords.length > 1) {
                    const idsToDelete = existingRecords.slice(1).map(r => r.id);
                    await supabase.from('leaderboard').delete().in('id', idsToDelete);
                }
            } else {
                await supabase.from('leaderboard').insert([{ name: pName, score: score }]);
            }
            fetchLeaderboard();
        } catch (err) { console.error('Error saving score:', err); }
    }

    fetchLeaderboard();


    // =========================================
    // HELPER FUNCTIONS
    // =========================================
    function createParticles(x, y, color) {
        for (let i = 0; i < 12; i++) particles.push(new Particle(x, y, color));
    }

    function registerKill() {
        comboKills++;
        // Khó lên combo hơn: cần 10 kill mỗi cấp (từ 5)
        if (comboKills % 10 === 0) comboMultiplier = Math.min(6, comboMultiplier + 1);
        comboDisplayTimer = 90;
    }

    function killEnemy(enemy) {
        GameAudio.explosion();
        createParticles(enemy.x, enemy.y, enemy.color);
        // Điểm cơ bản: scout=50, fighter=80, drone=100, asteroid=120, demon=150
        const basePts = { scout: 50, fighter: 80, drone: 100, asteroid: 120, demon: 150 };
        const pts = basePts[enemy.type] || 50; // Không dùng combo nhân điểm nữa
        score += pts;
        updateScore();
        registerKill();
        if (Math.random() < 0.10) powerups.push(new PowerUp(enemy.x, enemy.y)); // giảm từ 12% xuống 10%
        const idx = enemies.indexOf(enemy);
        if (idx !== -1) enemies.splice(idx, 1);
    }

    function killBoss() {
        GameAudio.bossExplosion();
        const bx = boss.x, by = boss.y, bw = boss.width, bcolor = boss.color;
        for (let i = 0; i < 40; i++) createParticles(bx + (Math.random() - 0.5) * bw, by + (Math.random() - 0.5) * boss.height, bcolor);
        shockwaves.push(new Shockwave(bx, by, '#ff0055', 400)); // Cực đại shockwave khi boss chết

        // Boss kill: điểm cố định, không nhân combo (tránh inflate)
        // Mỗi boss mạnh hơn thì thưởng nhiều hơn
        score += 2000 + bossKillCount * 500;
        updateScore();
        registerKill();
        bossKillCount++;

        // Rải powerup tập trung gần trung tâm màn hình — dễ nhặt
        const dropTypes = ['levelUp', 'spread', 'laser', 'bomb', 'lightning', 'beam'];
        if (bossKillCount >= 5) dropTypes.push('chain');

        const numDrops = 4 + Math.min(bossKillCount - 1, 2); // 4-6 drops
        const spreadW = 130; // Thu hẹp từ 280 xuống 130px
        const cx = canvas.width / 2; // Trung tâm màn hình
        for (let i = 0; i < numDrops; i++) {
            const dropX = cx - spreadW / 2 + (i / Math.max(numDrops - 1, 1)) * spreadW;
            const forcedType = dropTypes[Math.floor(Math.random() * dropTypes.length)];
            const pu = new PowerUp(dropX, 80, forcedType); // Bắt đầu từ gần đầu màn
            pu.vx = (dropX - cx) * 0.02; // Drift nhẹ
            pu.vy = 1.2;
            powerups.push(pu);
        }

        // Kick off 3s clear phase: xóa hết quái và đạn địch
        enemies.length = 0;
        enemyProjectiles.length = 0;
        clearPhaseTimer = 180; // 3 giây @ 60fps

        nextBossScore = calcNextBossScore(bossKillCount);
        boss = null;
        beamTarget = null;
    }

    function resetGame() {
        player = new Player();
        projectiles = [];
        enemies = [];
        particles = [];
        powerups = [];
        explosions = [];
        shockwaves = [];
        damageTexts = [];
        enemyProjectiles = [];
        boss = null;
        bossKillCount = 0;
        nextBossScore = 10000;
        clearPhaseTimer = 0;
        beamActive = false;
        beamTimer = 0;
        beamTarget = null;
        comboKills = 0;
        comboMultiplier = 1;
        comboDisplayTimer = 0;
        score = 0;
        updateScore();
        initBgStars();
    }

    function updateScore() {
        scoreDisplay.innerText = `SCORE: ${score.toString().padStart(6, '0')}`;
    }

    function gameOver() {
        isPlaying = false;
        if (document.pointerLockElement === canvas) document.exitPointerLock();
        cancelAnimationFrame(gameLoopId);
        overlay.classList.remove('hidden');
        overlay.querySelector('h2').innerText = 'GAME OVER';
        overlay.querySelector('h2').setAttribute('data-text', 'GAME OVER');
        startBtn.innerText = 'Try Again!';
        const pName = (playerNameInput.value.trim() || 'ANONYMOUS').toUpperCase();
        if (score > 0) saveScore(pName, score);
    }