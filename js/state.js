export const state = {
    gameLoopId: null,
    isPlaying: false,
    score: 0,
    lastTime: 0,
    timeScale: 1,
    comboKills: 0,
    comboMultiplier: 1,
    comboDisplayTimer: 0,

    bgStars: [],
    bgMeteors: [],
    bgEmbers: [],
    bgScrollY: 0,

    player: null,
    projectiles: [],
    enemies: [],
    particles: [],
    powerups: [],
    explosions: [],
    enemyProjectiles: [],
    boss: null,
    
    nextBossScore: 10000,
    bossKillCount: 0,
    clearPhaseTimer: 0,

    beamActive: false,
    beamTimer: 0,
    beamTarget: null,

    keys: {
        w: false, a: false, s: false, d: false,
        ArrowUp: false, ArrowLeft: false, ArrowDown: false, ArrowRight: false,
        ' ': false
    },
    mouse: {
        x: 400, // Default to center
        y: 450,
        isDown: false,
        isActive: false
    },
    
    canvas: null,
    ctx: null
};

// Helper for resetting state on new game
export function resetGameState() {
    state.projectiles = [];
    state.enemies = [];
    state.particles = [];
    state.powerups = [];
    state.explosions = [];
    state.enemyProjectiles = [];
    state.boss = null;
    state.bossKillCount = 0;
    state.nextBossScore = 10000;
    state.clearPhaseTimer = 0;
    state.beamActive = false;
    state.beamTimer = 0;
    state.beamTarget = null;
    state.comboKills = 0;
    state.comboMultiplier = 1;
    state.comboDisplayTimer = 0;
    state.score = 0;
}
