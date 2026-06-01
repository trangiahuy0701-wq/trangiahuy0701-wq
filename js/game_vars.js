
var canvas, ctx, scoreDisplay, startBtn, overlay, playerNameInput, leaderboardDiv, leaderboardList;
var supabaseUrl = 'https://eedipgtvopycaxztgpuj.supabase.co';
var supabaseKey = 'sb_publishable_XM6Uv0acZV9OjczTMYO-8w_h-X-L3Gh';
var supabase;


    // =========================================
    // GAME STATE
    // =========================================
    var gameLoopId;
    var isPlaying = false;
    var score = 0;
    var lastTime = 0;
    var timeScale = 1;
    var comboKills = 0;
    var comboMultiplier = 1;
    var comboDisplayTimer = 0;

    // Map zone background state
    var bgStars = [];
    var bgMeteors = [];
    var bgEmbers = [];
    var bgScrollY = 0;

    // Game Entities
    var player;
    var projectiles = [];
    var enemies = [];
    var particles = [];
    var powerups = [];
    var explosions = [];
    var shockwaves = []; // For shockwave effects
    var damageTexts = []; // For floating damage numbers
    var enemyProjectiles = [];
    var boss = null;
    var nextBossScore = 10000;
    var bossKillCount = 0;
    var clearPhaseTimer = 0; // 3s clear phase sau khi boss chết

    // Lightning Beam
    var beamActive = false;
    var beamTimer = 0;
    var beamTarget = null;

    // Input state
    var keys = {
        w: false, a: false, s: false, d: false,
        ArrowUp: false, ArrowLeft: false, ArrowDown: false, ArrowRight: false,
        ' ': false
    };
    var mouse = {
        x: 400,
        y: 450,
        isDown: false,
        isActive: false
    };

    // Constants
    var WEAPON_COLORS = {
        normal: '#ff007f',
        laser: '#00ffff',
        spread: '#ffff00',
        bomb: '#ff8800',
        lightning: '#aa00ff',
        beam: '#ffffff',
        chain: '#00ffcc'  // Chain lightning - chỉ mở sau boss thứ 5
    };

    // =========================================
    // ZONE SYSTEM
    // =========================================
    function getZone(s) {
        if (s < 10000) return 0;   // Cyber Space
        if (s < 30000) return 1;   // Danger Zone
        if (s < 60000) return 2;   // Meteor Belt
        if (s < 100000) return 3;  // Supernova
        return 4;                  // Inferno
    }

    // Tính next boss score theo lịch tầng
    function calcNextBossScore(killCount) {
        if (killCount === 0) return 10000;
        if (killCount === 1) return 30000;
        if (killCount === 2) return 60000;
        // Tầng 4 trở đi: 60k + (n-2)*30k
        return 60000 + (killCount - 2) * 30000;
    }

    var ZONE_CONFIG = [
        { name: 'CYBER SPACE',  bgTop: '#02000f', bgBot: '#05002a', starColor: '#00f0ff', accentColor: '#8800ff' },
        { name: 'DANGER ZONE',  bgTop: '#1a0000', bgBot: '#3d0010', starColor: '#ff4444', accentColor: '#ff0055' },
        { name: 'METEOR BELT',  bgTop: '#050508', bgBot: '#101018', starColor: '#aaaacc', accentColor: '#6677aa' },
        { name: 'SUPERNOVA',    bgTop: '#1a0a00', bgBot: '#3d1a00', starColor: '#ffcc00', accentColor: '#ff6600' },
        { name: 'INFERNO',      bgTop: '#1a0000', bgBot: '#3d0500', starColor: '#ff3300', accentColor: '#ff6600' },
    ];

    // Initialize background stars
    function initBgStars() {
        bgStars = [];
        for (let i = 0; i < 150; i++) {
            let layer = Math.random();
            let size, speed, alpha;
            if (layer < 0.6) { // Lớp xa nhất (nhiều sao, nhỏ, chậm)
                size = Math.random() * 0.8 + 0.2;
                speed = Math.random() * 0.3 + 0.1;
                alpha = Math.random() * 0.3 + 0.2;
            } else if (layer < 0.9) { // Lớp giữa
                size = Math.random() * 1.5 + 0.8;
                speed = Math.random() * 1.0 + 0.5;
                alpha = Math.random() * 0.5 + 0.4;
            } else { // Lớp gần nhất (to, bay nhanh)
                size = Math.random() * 2.5 + 1.5;
                speed = Math.random() * 3.0 + 1.5;
                alpha = Math.random() * 0.8 + 0.6;
            }
            bgStars.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                r: size,
                speed: speed,
                alpha: alpha
            });
        }
        bgMeteors = [];
        bgEmbers = [];
    }

    function drawBackground(zone) {
        const zc = ZONE_CONFIG[zone];

        // Gradient background
        const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
        grad.addColorStop(0, zc.bgTop);
        grad.addColorStop(1, zc.bgBot);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Scrolling stars
        ctx.save();
        for (let star of bgStars) {
            star.y += star.speed * timeScale;
            if (star.y > canvas.height) { star.y = -2; star.x = Math.random() * canvas.width; }

            ctx.globalAlpha = star.alpha;
            ctx.fillStyle = zc.starColor;
            ctx.shadowBlur = 4;
            ctx.shadowColor = zc.starColor;
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();

        // Zone-specific background effects
        if (zone === 2) {
            // Meteor zone: draw some background asteroids
            if (Math.random() < 0.03) {
                bgMeteors.push({ x: Math.random() * canvas.width, y: -20, vx: (Math.random() - 0.5) * 1.5, vy: Math.random() * 1.5 + 0.5, r: Math.random() * 12 + 5, alpha: 0.3 });
            }
            ctx.save();
            for (let i = bgMeteors.length - 1; i >= 0; i--) {
                let m = bgMeteors[i];
                m.x += m.vx; m.y += m.vy;
                if (m.y > canvas.height + 30) { bgMeteors.splice(i, 1); continue; }
                ctx.globalAlpha = m.alpha;
                ctx.fillStyle = '#555566';
                ctx.beginPath();
                ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
        }

        if (zone === 4) {
            // Inferno: lava glow lines
            if (Math.random() < 0.05) {
                bgEmbers.push({ x: Math.random() * canvas.width, y: canvas.height + 5, vy: -(Math.random() * 2 + 0.5), alpha: 0.6, r: Math.random() * 2 + 1 });
            }
            ctx.save();
            for (let i = bgEmbers.length - 1; i >= 0; i--) {
                let e = bgEmbers[i];
                e.y += e.vy; e.alpha -= 0.005;
                if (e.alpha <= 0 || e.y < -5) { bgEmbers.splice(i, 1); continue; }
                ctx.globalAlpha = e.alpha;
                ctx.fillStyle = '#ff4400';
                ctx.shadowBlur = 6; ctx.shadowColor = '#ff4400';
                ctx.beginPath();
                ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
        }

        // Zone name HUD (top right)
        ctx.save();
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = zc.accentColor;
        ctx.font = '11px Orbitron, monospace';
        ctx.textAlign = 'right';
        ctx.fillText(`[ ${zc.name} ]`, canvas.width - 10, 15);
        ctx.restore();
    }