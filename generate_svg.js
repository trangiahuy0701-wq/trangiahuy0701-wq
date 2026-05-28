const fs = require('fs');

const width = 850;
const height = 300;

function generateParallaxStars(count, size, color, durationClass) {
  let stars = '';
  for (let i = 0; i < count; i++) {
    const x = Math.random() * width * 2; // double width for scrolling
    const y = Math.random() * height;
    const r = Math.random() * size + 0.2;
    const opacity = Math.random() * 0.8 + 0.2;
    stars += `<circle cx="${x}" cy="${y}" r="${r}" fill="${color}" opacity="${opacity}" />\n`;
  }
  return stars;
}

function generateMeteors(count) {
  let meteors = '';
  for (let i = 0; i < count; i++) {
    const y = Math.random() * (height / 2);
    const delay = Math.random() * 10;
    const duration = Math.random() * 2 + 1; // fast meteor
    const length = Math.random() * 100 + 50;
    
    meteors += `
    <g style="animation: meteor ${duration}s ${delay}s linear infinite;">
      <line x1="0" y1="0" x2="-${length}" y2="${length}" stroke="url(#meteor-gradient)" stroke-width="2" />
      <circle cx="0" cy="0" r="1.5" fill="#ffffff" filter="url(#glow)" />
    </g>
    `;
  }
  return meteors;
}

const headerSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <!-- Deep Space Background Gradient -->
    <radialGradient id="space-bg" cx="50%" cy="50%" r="75%">
      <stop offset="0%" stop-color="#0a051d" />
      <stop offset="50%" stop-color="#05020f" />
      <stop offset="100%" stop-color="#000000" />
    </radialGradient>

    <!-- Nebula Glows -->
    <radialGradient id="nebula-cyan" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#00f0ff" stop-opacity="0.15" />
      <stop offset="100%" stop-color="#00f0ff" stop-opacity="0" />
    </radialGradient>
    <radialGradient id="nebula-pink" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#ff007f" stop-opacity="0.15" />
      <stop offset="100%" stop-color="#ff007f" stop-opacity="0" />
    </radialGradient>

    <!-- Meteor Tail Gradient -->
    <linearGradient id="meteor-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="1" />
      <stop offset="20%" stop-color="#00f0ff" stop-opacity="0.8" />
      <stop offset="100%" stop-color="#00f0ff" stop-opacity="0" />
    </linearGradient>

    <!-- General Glow Filter -->
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="3" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>

    <style>
      /* Parallax Scrolling for 3D effect */
      @keyframes scroll-fast {
        from { transform: translateX(0); }
        to { transform: translateX(-${width}px); }
      }
      @keyframes scroll-medium {
        from { transform: translateX(0); }
        to { transform: translateX(-${width}px); }
      }
      @keyframes scroll-slow {
        from { transform: translateX(0); }
        to { transform: translateX(-${width}px); }
      }

      /* Meteor Animation */
      @keyframes meteor {
        0% { transform: translate(${width + 200}px, -100px) scale(1); opacity: 1; }
        20% { transform: translate(${(width / 2)}px, ${(height / 2)}px) scale(1); opacity: 1; }
        40% { transform: translate(-200px, ${height + 200}px) scale(0); opacity: 0; }
        100% { transform: translate(-200px, ${height + 200}px) scale(0); opacity: 0; }
      }

      /* Floating Nebula */
      @keyframes float-nebula {
        0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.8; }
        50% { transform: translate(-20px, 10px) scale(1.1); opacity: 1; }
      }
      @keyframes float-nebula-alt {
        0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.8; }
        50% { transform: translate(20px, -10px) scale(1.2); opacity: 1; }
      }

      /* Title Styling */
      .title {
        font-family: 'Orbitron', 'Courier New', sans-serif;
        font-size: 42px;
        font-weight: 900;
        fill: #ffffff;
        text-anchor: middle;
        letter-spacing: 3px;
      }
      .title-glow {
        font-family: 'Orbitron', 'Courier New', sans-serif;
        font-size: 42px;
        font-weight: 900;
        fill: none;
        stroke: #00f0ff;
        stroke-width: 6px;
        stroke-opacity: 0.6;
        text-anchor: middle;
        letter-spacing: 3px;
      }
      .subtitle {
        font-family: 'Orbitron', 'Courier New', sans-serif;
        font-size: 14px;
        font-weight: bold;
        fill: #ff007f;
        text-anchor: middle;
        letter-spacing: 8px;
      }
    </style>
  </defs>

  <!-- Base Space Background -->
  <rect width="${width}" height="${height}" fill="url(#space-bg)" />

  <!-- Animated Nebulas -->
  <circle cx="20%" cy="30%" r="200" fill="url(#nebula-cyan)" style="animation: float-nebula 15s ease-in-out infinite;" />
  <circle cx="80%" cy="70%" r="250" fill="url(#nebula-pink)" style="animation: float-nebula-alt 20s ease-in-out infinite;" />
  <circle cx="50%" cy="50%" r="300" fill="url(#nebula-cyan)" style="animation: float-nebula 25s ease-in-out infinite;" opacity="0.5" />

  <!-- Layer 1: Background Stars (Slow) -->
  <g style="animation: scroll-slow 120s linear infinite;">
    ${generateParallaxStars(250, 0.8, '#ffffff')}
  </g>

  <!-- Layer 2: Midground Stars (Medium) -->
  <g style="animation: scroll-medium 60s linear infinite;">
    ${generateParallaxStars(150, 1.5, '#00f0ff')}
  </g>

  <!-- Layer 3: Foreground Stars (Fast) -->
  <g style="animation: scroll-fast 30s linear infinite;">
    ${generateParallaxStars(70, 2.5, '#ff007f')}
  </g>

  <!-- Shooting Stars / Meteors -->
  ${generateMeteors(8)}

  <!-- Text Section -->
  <g transform="translate(${width / 2}, 140)">
    <text y="0" class="title-glow" filter="url(#glow)">TRAN NGUYEN GIA HUY</text>
    <text y="0" class="title">TRAN NGUYEN GIA HUY</text>
    
    <text y="45" class="subtitle">CYBERNETIC ENGINEER | FULL-STACK DEVELOPER</text>
  </g>
</svg>
`;

const footerSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="100" viewBox="0 0 ${width} 100">
  <defs>
    <radialGradient id="space-bg" cx="50%" cy="0%" r="100%">
      <stop offset="0%" stop-color="#0a051d" />
      <stop offset="50%" stop-color="#05020f" />
      <stop offset="100%" stop-color="#000000" />
    </radialGradient>
    <style>
      @keyframes scroll-medium {
        from { transform: translateX(0); }
        to { transform: translateX(-${width}px); }
      }
      .footer-text {
        font-family: 'Orbitron', 'Courier New', sans-serif;
        font-size: 12px;
        fill: #00f0ff;
        opacity: 0.6;
        letter-spacing: 4px;
        text-anchor: middle;
      }
    </style>
  </defs>
  
  <rect width="${width}" height="100" fill="url(#space-bg)" />
  
  <g style="animation: scroll-medium 60s linear infinite;">
    ${generateParallaxStars(100, 1.5, '#00f0ff')}
  </g>
  
  <text x="50%" y="60%" class="footer-text">END OF SYSTEM TRANSMISSION</text>
</svg>
`;

fs.writeFileSync('tech-header.svg', headerSvg);
fs.writeFileSync('tech-footer.svg', footerSvg);
console.log('SVGs generated successfully!');
