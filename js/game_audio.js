const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioCtx = new AudioContext();

// Cờ quản lý âm thanh
let isMuted = false;

function toggleMute() {
    isMuted = !isMuted;
    return isMuted;
}

function ensureResumed() {
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}

function playTone(freq, type, duration, vol = 0.1) {
    if (isMuted) return;
    ensureResumed();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    
    gain.gain.setValueAtTime(vol, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);

    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
}

function playNoise(duration, vol = 0.1) {
    if (isMuted) return;
    ensureResumed();
    const bufferSize = audioCtx.sampleRate * duration;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }
    const noise = audioCtx.createBufferSource();
    noise.buffer = buffer;
    
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 1000;

    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(vol, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(audioCtx.destination);
    noise.start();
}

window.GameAudio = {
    init: function() {
        ensureResumed();
    },
    
    toggleMute: toggleMute,
    isMuted: () => isMuted,

    shoot: function() {
        playTone(400, 'square', 0.1, 0.05);
    },

    explosion: function() {
        playNoise(0.3, 0.3);
    },

    bossExplosion: function() {
        playNoise(0.8, 0.6);
        playTone(100, 'sawtooth', 0.8, 0.5);
    },

    powerup: function() {
        if (isMuted) return;
        ensureResumed();
        const t = audioCtx.currentTime;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, t);
        osc.frequency.setValueAtTime(600, t + 0.1);
        osc.frequency.setValueAtTime(800, t + 0.2);
        
        gain.gain.setValueAtTime(0.1, t);
        gain.gain.linearRampToValueAtTime(0, t + 0.3);

        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(t);
        osc.stop(t + 0.3);
    },

    playerHit: function() {
        playTone(150, 'sawtooth', 0.4, 0.2);
        playNoise(0.4, 0.2);
    }
};
