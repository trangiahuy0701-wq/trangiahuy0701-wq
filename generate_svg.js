const fs = require('fs');

const width = 850;
const height = 300;

function generateStars(count, isTwinkle) {
  let stars = '';
  for (let i = 0; i < count; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const r = Math.random() * 1.5 + 0.5;
    const color = Math.random() > 0.8 ? '#00f0ff' : '#ffffff';
    if (isTwinkle) {
      const delay = Math.random() * 5;
      const duration = Math.random() * 3 + 2;
      stars += `<circle cx="${x}" cy="${y}" r="${r}" fill="${color}" style="animation: twinkle ${duration}s ${delay}s infinite alternate;" />\n`;
    } else {
      stars += `<circle cx="${x}" cy="${y}" r="${r}" fill="${color}" opacity="${Math.random() * 0.8 + 0.2}" />\n`;
    }
  }
  return stars;
}

function generateTechLines() {
  let lines = '';
  for (let i = 0; i < 15; i++) {
    const y = Math.random() * height;
    const length = Math.random() * 100 + 50;
    const speed = Math.random() * 5 + 3;
    const delay = Math.random() * 5;
    lines += `
      <rect x="-150" y="${y}" width="${length}" height="1" fill="#00f0ff" opacity="0.4" style="animation: scanline ${speed}s ${delay}s linear infinite;" />
    `;
  }
  return lines;
}

const headerSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <!-- Background Gradient -->
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#02010a" />
      <stop offset="50%" stop-color="#060c21" />
      <stop offset="100%" stop-color="#02010a" />
    </linearGradient>

    <radialGradient id="glow-planet" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#00f0ff" stop-opacity="0.2" />
      <stop offset="100%" stop-color="#00f0ff" stop-opacity="0" />
    </radialGradient>

    <!-- Grid Pattern -->
    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#00f0ff" stroke-width="0.5" stroke-opacity="0.1" />
    </pattern>

    <!-- Animations -->
    <style>
      @keyframes twinkle {
        0% { opacity: 0.2; transform: scale(0.8); }
        100% { opacity: 1; transform: scale(1.5); }
      }
      @keyframes spin {
        100% { transform: rotate(360deg); }
      }
      @keyframes spin-reverse {
        100% { transform: rotate(-360deg); }
      }
      @keyframes scanline {
        0% { transform: translateX(0); }
        100% { transform: translateX(${width + 200}px); }
      }
      @keyframes pulse {
        0%, 100% { opacity: 0.5; }
        50% { opacity: 1; }
      }
      @keyframes float {
        0%, 100% { transform: translateY(0px); }
        50% { transform: translateY(-10px); }
      }
      .title {
        font-family: 'Courier New', Courier, monospace;
        font-size: 42px;
        font-weight: bold;
        fill: #00f0ff;
        text-anchor: middle;
        letter-spacing: 2px;
      }
      .title-glow {
        font-family: 'Courier New', Courier, monospace;
        font-size: 42px;
        font-weight: bold;
        fill: none;
        stroke: #00f0ff;
        stroke-width: 8px;
        stroke-opacity: 0.3;
        text-anchor: middle;
        letter-spacing: 2px;
      }
      .subtitle {
        font-family: 'Courier New', Courier, monospace;
        font-size: 15px;
        fill: #ff007f;
        text-anchor: middle;
        letter-spacing: 6px;
      }
    </style>
  </defs>

  <!-- Background -->
  <rect width="${width}" height="${height}" fill="url(#bg)" />
  <rect width="${width}" height="${height}" fill="url(#grid)" />

  <!-- Stars / Particles -->
  ${generateStars(150, true)}

  <!-- Tech Lines -->
  ${generateTechLines()}

  <!-- Sci-Fi Planet / Blackhole HUD -->
  <g transform="translate(150, 150)" style="animation: float 6s ease-in-out infinite;">
    <circle cx="0" cy="0" r="120" fill="url(#glow-planet)" />
    <!-- HUD Rings -->
    <g style="animation: spin 30s linear infinite;">
      <circle cx="0" cy="0" r="80" fill="none" stroke="#00f0ff" stroke-width="1" stroke-dasharray="10 5 2 5" stroke-opacity="0.5" />
      <circle cx="0" cy="0" r="70" fill="none" stroke="#00f0ff" stroke-width="2" stroke-dasharray="50 20" stroke-opacity="0.3" />
    </g>
    <g style="animation: spin-reverse 20s linear infinite;">
      <circle cx="0" cy="0" r="95" fill="none" stroke="#ff007f" stroke-width="1.5" stroke-dasharray="10 30 50 20" stroke-opacity="0.4" />
      <path d="M 0 -95 L 5 -105 L -5 -105 Z" fill="#ff007f" opacity="0.8" />
      <path d="M 0 95 L 5 105 L -5 105 Z" fill="#ff007f" opacity="0.8" />
    </g>
    <circle cx="0" cy="0" r="40" fill="none" stroke="#00f0ff" stroke-width="0.5" />
    <circle cx="0" cy="0" r="2" fill="#ff007f" style="animation: pulse 2s infinite;" />
  </g>

  <!-- Decoration elements right -->
  <g transform="translate(750, 150)">
    <g style="animation: spin 40s linear infinite;">
      <circle cx="0" cy="0" r="50" fill="none" stroke="#00f0ff" stroke-width="1" stroke-dasharray="4 8" stroke-opacity="0.3" />
    </g>
    <path d="M -30 0 L 30 0 M 0 -30 L 0 30" stroke="#00f0ff" stroke-width="1" opacity="0.2" />
  </g>

  <!-- Text Section -->
  <g transform="translate(480, 140)">
    <!-- Fake Glow using stroke (avoids SVG filter clipping bugs on GitHub) -->
    <text y="0" class="title-glow">TRAN NGUYEN GIA HUY</text>
    <text y="0" class="title">TRAN NGUYEN GIA HUY</text>
    
    <text y="40" class="subtitle">CYBERNETIC ENGINEER | FULL-STACK DEVELOPER</text>
    
    <!-- UI Brackets -->
    <path d="M -260 -40 L -280 -40 L -280 60 L -260 60" fill="none" stroke="#00f0ff" stroke-width="2" opacity="0.5" />
    <path d="M 260 -40 L 280 -40 L 280 60 L 260 60" fill="none" stroke="#00f0ff" stroke-width="2" opacity="0.5" />
    
    <!-- Blinking UI dot -->
    <rect x="-270" y="-30" width="4" height="4" fill="#ff007f" style="animation: pulse 1s infinite;" />
  </g>

</svg>
`;

const footerSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="100" viewBox="0 0 ${width} 100">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#02010a" />
      <stop offset="50%" stop-color="#060c21" />
      <stop offset="100%" stop-color="#02010a" />
    </linearGradient>
    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#00f0ff" stroke-width="0.5" stroke-opacity="0.1" />
    </pattern>
    <style>
      @keyframes scanline {
        0% { transform: translateX(0); }
        100% { transform: translateX(${width + 200}px); }
      }
      .footer-text {
        font-family: 'Courier New', Courier, monospace;
        font-size: 12px;
        fill: #00f0ff;
        opacity: 0.5;
        letter-spacing: 2px;
      }
    </style>
  </defs>
  
  <rect width="${width}" height="100" fill="url(#bg)" />
  <rect width="${width}" height="100" fill="url(#grid)" />
  
  ${generateTechLines()}

  <path d="M 0 50 L ${width} 50" fill="none" stroke="#00f0ff" stroke-width="1" stroke-dasharray="5 15" opacity="0.3" />
  <text x="50%" y="60%" class="footer-text" text-anchor="middle">CONNECTION SECURE // 0xGIAHUY</text>
  
</svg>
`;

fs.writeFileSync('galaxy-header.svg', headerSvg);
fs.writeFileSync('galaxy-footer.svg', footerSvg);
console.log('SVGs generated successfully!');
