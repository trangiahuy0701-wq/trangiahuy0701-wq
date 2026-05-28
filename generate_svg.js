const fs = require('fs');

const width = 800;
const height = 300;

function generateStars(count, width, height, isTwinkle) {
  let stars = '';
  for (let i = 0; i < count; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const r = Math.random() * 1.5 + 0.5;
    if (isTwinkle) {
      const delay = Math.random() * 5;
      const duration = Math.random() * 3 + 2;
      stars += `<circle cx="${x}" cy="${y}" r="${r}" fill="#ffffff" style="animation: twinkle ${duration}s ${delay}s infinite alternate;" />\n`;
    } else {
      stars += `<circle cx="${x}" cy="${y}" r="${r}" fill="#ffffff" opacity="${Math.random() * 0.8 + 0.2}" />\n`;
    }
  }
  return stars;
}

function generateParallax(width, height) {
  let parallaxGroups = '';
  for(let layer = 1; layer <= 3; layer++) {
    let layerStars = '';
    for(let i=0; i < 150; i++) {
      // Create stars that span twice the width so they can scroll
      const x = Math.random() * width * 2;
      const y = Math.random() * height;
      const r = (layer * 0.6) + Math.random();
      // Color tint based on layer
      const colors = ['#ffffff', '#00f0ff', '#ff007f', '#d400ff'];
      const color = colors[Math.floor(Math.random() * colors.length)];
      layerStars += `<circle cx="${x}" cy="${y}" r="${r}" fill="${color}" opacity="${layer * 0.3}" />\n`;
    }
    const duration = (5 - layer) * 20; // layer 3 (foreground) moves faster
    parallaxGroups += `
      <g style="animation: drift ${duration}s linear infinite;">
         ${layerStars}
      </g>
    `;
  }
  return parallaxGroups;
}

const headerSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <radialGradient id="bg" cx="50%" cy="50%" r="70%">
      <stop offset="0%" stop-color="#140628" />
      <stop offset="100%" stop-color="#030108" />
    </radialGradient>
    <style>
      @keyframes twinkle {
        0% { opacity: 0.1; transform: scale(0.8); }
        100% { opacity: 1; transform: scale(1.5); }
      }
      @keyframes drift {
        from { transform: translateX(0); }
        to { transform: translateX(-${width}px); }
      }
      @keyframes pulse {
        0% { transform: scale(1); opacity: 0.6; }
        50% { transform: scale(1.05); opacity: 0.8; }
        100% { transform: scale(1); opacity: 0.6; }
      }
      .title {
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        font-size: 38px;
        font-weight: 800;
        fill: #00f0ff;
        text-anchor: middle;
      }
      .subtitle {
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        font-size: 16px;
        font-weight: 600;
        fill: #ff007f;
        text-anchor: middle;
        letter-spacing: 5px;
      }
    </style>
    <filter id="glow-cyan" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="5" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
    <filter id="glow-pink" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="4" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
    <filter id="nebula-blur">
      <feGaussianBlur stdDeviation="30" />
    </filter>
  </defs>
  
  <!-- Background -->
  <rect width="${width}" height="${height}" fill="url(#bg)" />
  
  <!-- Nebulas -->
  <circle cx="20%" cy="30%" r="80" fill="#9d00ff" filter="url(#nebula-blur)" opacity="0.4" style="animation: pulse 8s infinite alternate;" />
  <circle cx="80%" cy="70%" r="100" fill="#00f0ff" filter="url(#nebula-blur)" opacity="0.3" style="animation: pulse 10s infinite alternate;" />
  <circle cx="50%" cy="50%" r="120" fill="#ff007f" filter="url(#nebula-blur)" opacity="0.2" style="animation: pulse 12s infinite alternate;" />

  <!-- Twinkling stars -->
  ${generateStars(150, width, height, true)}
  
  <!-- Parallax 3D background -->
  ${generateParallax(width, height)}
  
  <!-- Text -->
  <g transform="translate(400, 140)">
    <text y="0" class="title" filter="url(#glow-cyan)">TRAN NGUYEN GIA HUY</text>
    <text y="40" class="subtitle" filter="url(#glow-pink)">CYBERNETIC ENGINEER | FULL-STACK DEVELOPER</text>
  </g>
</svg>
`;

const footerSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="100" viewBox="0 0 ${width} 100">
  <defs>
    <radialGradient id="bg" cx="50%" cy="0%" r="100%">
      <stop offset="0%" stop-color="#140628" />
      <stop offset="100%" stop-color="#030108" />
    </radialGradient>
    <style>
      @keyframes twinkle {
        0% { opacity: 0.1; transform: scale(0.8); }
        100% { opacity: 1; transform: scale(1.5); }
      }
      @keyframes drift {
        from { transform: translateX(0); }
        to { transform: translateX(-${width}px); }
      }
    </style>
    <filter id="nebula-blur">
      <feGaussianBlur stdDeviation="20" />
    </filter>
  </defs>
  
  <rect width="${width}" height="100" fill="url(#bg)" />
  
  <circle cx="50%" cy="10%" r="50" fill="#00f0ff" filter="url(#nebula-blur)" opacity="0.3" />
  
  ${generateStars(50, width, 100, true)}
  ${generateParallax(width, 100)}
  
</svg>
`;

fs.writeFileSync('galaxy-header.svg', headerSvg);
fs.writeFileSync('galaxy-footer.svg', footerSvg);
console.log('SVGs generated successfully!');
