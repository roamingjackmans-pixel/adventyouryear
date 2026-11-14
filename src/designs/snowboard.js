/* Design — "Halfpipe Holiday"
   A terrain park at golden hour: a lit halfpipe with a rider in a Santa hat
   boosting out of it, rails and a kicker strung with lights, a DJ booth, a big tree. */
(function () {
  const A = (window.AYY = window.AYY || {});
  A.designs = A.designs || {};
  const W = 1600, H = 1000;
  const f = (n) => Math.round(n * 10) / 10;
  // halfpipe cross-section at depth d (0 = far end, 1 = bottom edge of the board)
  const sec = (d) => { const fy = 530 + d * 470; return { fy, fh: 40 + d * 190, ly: fy - (20 + d * 230), lh: 80 + d * 400 }; };
  const RD = {
    board: 'M-30 -3 Q-35 0 -30 3 L30 3 Q35 0 30 -3Z',
    legs: 'M-12 -2 L-8 -16 L4 -19 L12 -2 L5 -2 L0 -11 L-5 -2Z',
    torso: 'M-9 -16 Q-6 -37 5 -39 Q14 -35 10 -16Z',
    hat: 'M-5 -47 Q-2 -61 15 -59 Q7 -53 9 -46Z',
  };

  function build() {
    const R = A.util.rng(3307);
    const rr = (a, b) => a + R() * (b - a);
    const lights = [], candles = [], out = [];
    const add = (s) => out.push(s);
    const BULB = ['#ffd36b', '#ff5d4d', '#6cc8ff', '#8ff07a', '#ff9be3', '#fff1b8', '#ffa94d'];

    function bulb(x, y, c, r = 3.4) {
      lights.push({ x, y, c, r });
      return `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r * 2.4)}" fill="${c}" opacity=".28"/><ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(r * 0.8)}" ry="${f(r * 1.15)}" fill="${c}"/>`;
    }
    function lightString(x0, y0, x1, y1, sag, n, off = 0, r = 3.2) {
      const cx = (x0 + x1) / 2, cy = Math.max(y0, y1) + sag;
      let s = `<path d="M${x0} ${y0} Q${cx} ${cy} ${x1} ${y1}" stroke="#1d1424" stroke-width="1.5" fill="none"/>`;
      for (let i = 1; i < n; i++) {
        const t = i / n;
        s += bulb((1 - t) * (1 - t) * x0 + 2 * (1 - t) * t * cx + t * t * x1, (1 - t) * (1 - t) * y0 + 2 * (1 - t) * t * cy + t * t * y1 + 4, BULB[(i + off) % 7], r);
      }
      return s;
    }
    function pine(x, base, h, col = '#24414a', snow = '#f7e3ea', dark = '#182c34') {
      let s = `<rect x="${f(x - h * 0.03)}" y="${f(base - h * 0.1)}" width="${f(h * 0.06)}" height="${f(h * 0.12)}" fill="#3a2418"/>`;
      for (let k = 0; k < 4; k++) {
        const ty = base - h + k * h * 0.2, w = h * (0.13 + k * 0.08), th = h * 0.32;
        s += `<path d="M${f(x)} ${f(ty)} L${f(x - w)} ${f(ty + th)} Q${f(x)} ${f(ty + th + h * 0.05)} ${f(x + w)} ${f(ty + th)}Z" fill="${col}"/>`;
        s += `<path d="M${f(x)} ${f(ty)} L${f(x + w)} ${f(ty + th)} Q${f(x + w * 0.5)} ${f(ty + th + h * 0.03)} ${f(x + w * 0.1)} ${f(ty + th * 0.9)}Z" fill="${dark}" opacity=".6"/>`;
        s += `<path d="M${f(x)} ${f(ty)} L${f(x - w * 0.62)} ${f(ty + th * 0.6)} Q${f(x - w * 0.35)} ${f(ty + th * 0.72)} ${f(x - w * 0.12)} ${f(ty + th * 0.55)} Q${f(x + w * 0.18)} ${f(ty + th * 0.7)} ${f(x + w * 0.5)} ${f(ty + th * 0.5)}Z" fill="${snow}"/>`;
      }
      return s;
    }
    function rider(x, y, s, rot, jacket, pants, hat, board) {
      return `<g transform="translate(${f(x)} ${f(y)}) rotate(${rot}) scale(${s})">
        <path d="${RD.board}" fill="${board}"/><path d="M-24 -3 H24" stroke="#fff" stroke-width="1.2" opacity=".6"/>
        <path d="${RD.legs}" fill="${pants}"/><path d="${RD.torso}" fill="${jacket}"/>
        <path d="M4 -30 L16 -6" stroke="${jacket}" stroke-width="5.5" stroke-linecap="round"/><path d="M-4 -30 L-20 -40" stroke="${jacket}" stroke-width="5.5" stroke-linecap="round"/>
        <circle cx="2" cy="-44" r="6.5" fill="#f1c9a5"/><path d="${RD.hat}" fill="${hat}"/><circle cx="15" cy="-59" r="3.4" fill="#fff"/><path d="M-5 -46 Q3 -49 10 -46" stroke="#fff" stroke-width="3" fill="none"/>
        <rect x="1" y="-47" width="9" height="4" rx="2" fill="#7fe0ff"/>
      </g>`;
    }

    add(`<defs>
      <linearGradient id="b-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1c1548"/><stop offset=".38" stop-color="#5a2a74"/><stop offset=".7" stop-color="#cf5878"/><stop offset="1" stop-color="#ffb35c"/></linearGradient>
      <linearGradient id="b-snow" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f6d8e0"/><stop offset=".5" stop-color="#ece0f0"/><stop offset="1" stop-color="#d9d6ef"/></linearGradient>
      <linearGradient id="b-wallL" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fbe4e6"/><stop offset="1" stop-color="#e2cfe6"/></linearGradient>
      <linearGradient id="b-wallR" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#b9b0d8"/><stop offset="1" stop-color="#8d84bb"/></linearGradient>
      <linearGradient id="b-floor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e1d4ea"/><stop offset="1" stop-color="#cfc6e6"/></linearGradient>
      <radialGradient id="b-sun" cx="800" cy="520" r="700" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#ffd27a" stop-opacity=".55"/><stop offset=".4" stop-color="#ff8a6a" stop-opacity=".15"/><stop offset="1" stop-color="#ff8a6a" stop-opacity="0"/></radialGradient>
      <linearGradient id="b-banner" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e2384a"/><stop offset=".5" stop-color="#b81d33"/><stop offset="1" stop-color="#8a1022"/></linearGradient>
      <linearGradient id="b-gold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff1b0"/><stop offset=".45" stop-color="#e2b04a"/><stop offset="1" stop-color="#9c6b1c"/></linearGradient>
      <linearGradient id="b-booth" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a2a52"/><stop offset="1" stop-color="#1d1430"/></linearGradient>
      <radialGradient id="b-flood" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff6d8" stop-opacity=".9"/><stop offset="1" stop-color="#fff6d8" stop-opacity="0"/></radialGradient>
      <filter id="b-sh" x="-20%" y="-20%" width="140%" height="160%"><feDropShadow dx="0" dy="6" stdDeviation="6" flood-color="#1a0a2a" flood-opacity=".45"/></filter>
      <radialGradient id="b-vig" cx="800" cy="520" r="1050" gradientUnits="userSpaceOnUse"><stop offset=".6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#140820" stop-opacity=".55"/></radialGradient>
    </defs>`);

    /* sky */
    add(`<rect width="${W}" height="620" fill="url(#b-sky)"/>`);
    for (let i = 0; i < 90; i++) add(`<circle cx="${f(rr(0, W))}" cy="${f(rr(0, 260))}" r="${f(rr(0.6, 1.8))}" fill="#fff" opacity="${f(rr(0.3, 1))}"/>`);
    add(`<path d="M232 120 a34 34 0 1 0 30 52 a28 28 0 1 1 -30 -52Z" fill="#fff4d6"/><circle cx="240" cy="150" r="70" fill="#fff4d6" opacity=".08"/>`);
    add(`<rect width="${W}" height="620" fill="url(#b-sun)"/>`);
    /* mountains with alpenglow */
    const range = [[0, 470], [130, 360], [240, 410], [380, 280], [500, 350], [640, 250], [760, 330], [880, 290], [1000, 360], [1120, 260], [1260, 340], [1380, 300], [1500, 380], [1600, 340]];
    add(`<path d="M${range.map((p) => p.join(' ')).join(' L')} V600 H0Z" fill="#f2b9c8"/>`);
    for (let i = 1; i < range.length - 1; i++) {
      const [px, py] = range[i], [vx, vy] = range[i + 1];
      if (py < range[i - 1][1] && py < vy) add(`<path d="M${px} ${py} L${vx} ${vy} L${f(px + (vx - px) * 0.3)} ${vy + 140}Z" fill="#7d5c9c"/><path d="M${px} ${py} l-10 26 l6 -3 l-5 18" stroke="#5a3d78" stroke-width="2" fill="none" opacity=".6"/>`);
    }
    add(`<path d="M0 500 Q400 470 800 492 Q1200 514 1600 488 V600 H0Z" fill="#a98cc0"/>`);
    for (let x = 0; x < W; x += 13) { const y = 494 + Math.sin(x / 140) * 10; add(`<path d="M${f(x)} ${f(y - rr(12, 24))} L${f(x + 6)} ${f(y + 6)} L${f(x - 6)} ${f(y + 6)}Z" fill="#4e3a6e"/>`); }

    /* ground */
    add(`<path d="M0 520 Q400 506 800 516 Q1200 526 1600 512 V1000 H0Z" fill="url(#b-snow)"/>`);
    /* the halfpipe, dug into the slope and running toward us */
    const n = sec(0), m = sec(1);
    add(`<path d="M${800 - n.lh} ${n.ly} L${800 - n.fh} ${n.fy} L${800 - m.fh} ${m.fy} L${800 - m.lh} ${m.ly}Z" fill="url(#b-wallL)"/>`);
    add(`<path d="M${800 + n.lh} ${n.ly} L${800 + n.fh} ${n.fy} L${800 + m.fh} ${m.fy} L${800 + m.lh} ${m.ly}Z" fill="url(#b-wallR)"/>`);
    add(`<path d="M${800 - n.fh} ${n.fy} L${800 + n.fh} ${n.fy} L${800 + m.fh} ${m.fy} L${800 - m.fh} ${m.fy}Z" fill="url(#b-floor)"/>`);
    // carving lines on the walls and floor
    for (let k = 0; k < 7; k++) {
      const d0 = 0.1 + k * 0.12, a = sec(d0), b = sec(Math.min(1, d0 + 0.08));
      add(`<path d="M${f(800 - a.lh * 0.9)} ${f(a.ly + 8)} Q${f(800 - a.fh)} ${f(a.fy)} 800 ${f((a.fy + b.fy) / 2)} Q${f(800 + b.fh)} ${f(b.fy)} ${f(800 + b.lh * 0.9)} ${f(b.ly + 8)}" stroke="#ffffff" stroke-width="${f(1 + k * 0.4)}" fill="none" opacity=".55"/>`);
    }
    // blue coping along both lips, with lights
    add(`<path d="M${800 - n.lh} ${n.ly} L${800 - m.lh} ${m.ly}" stroke="#2a6fd6" stroke-width="5"/><path d="M${800 + n.lh} ${n.ly} L${800 + m.lh} ${m.ly}" stroke="#2a6fd6" stroke-width="5"/>`);
    for (let i = 0; i <= 16; i++) {
      const d = i / 16, s = sec(d), r = 2.4 + d * 3.4;
      add(bulb(800 - s.lh, s.ly - 6 - d * 6, BULB[i % 7], r) + bulb(800 + s.lh, s.ly - 6 - d * 6, BULB[(i + 3) % 7], r));
    }
    /* the big tree at the top of the pipe */
    add(pine(800, 516, 210, '#1d4f3a', '#fbe8ee', '#123326'));
    for (let i = 0; i < 26; i++) { const yy = rr(330, 500), half = (yy - 306) * 0.38; add(bulb(800 + rr(-half, half), yy, BULB[i % 7], 3)); }
    add(`<path d="M800 290 l7 14 15 2 -11 10 3 15 -14 -7 -14 7 3 -15 -11 -10 15 -2Z" fill="url(#b-gold)"/>`);

    /* floodlight towers + the banner strung between them */
    [470, 1130].forEach((x) => {
      add(`<path d="M${x - 12} 540 L${x - 3} 60 L${x + 3} 60 L${x + 12} 540Z" fill="#3a3046"/><path d="M${x - 8} 520 L${x + 8} 470 M${x + 8} 520 L${x - 8} 470 M${x - 6} 420 L${x + 6} 370 M${x + 6} 420 L${x - 6} 370" stroke="#2a2236" stroke-width="2"/>`);
      add(`<rect x="${x - 30}" y="30" width="60" height="26" rx="4" fill="#2a2236"/><circle cx="${x - 14}" cy="43" r="9" fill="#fff6d8"/><circle cx="${x + 14}" cy="43" r="9" fill="#fff6d8"/><ellipse cx="${x}" cy="44" rx="90" ry="60" fill="url(#b-flood)" opacity=".5"/>`);
    });
    add(`<g filter="url(#b-sh)">
      <path d="M480 64 Q800 92 1120 64 L1120 140 Q800 168 480 140Z" fill="url(#b-banner)"/>
      <path d="M480 74 Q800 102 1120 74 M480 130 Q800 158 1120 130" stroke="url(#b-gold)" stroke-width="3" fill="none"/>
      <path d="M480 64 L500 64 L500 140 L480 140Z M1100 64 L1120 64 L1120 140 L1100 140Z" fill="#6a0c1a"/>
      ${Array.from({ length: 8 }, (_, i) => `<circle cx="${490}" cy="${72 + i * 9}" r="2" fill="#fff" opacity=".7"/><circle cx="${1110}" cy="${72 + i * 9}" r="2" fill="#fff" opacity=".7"/>`).join('')}
    </g>`);
    // festoon lights crossing the park
    add(lightString(0, 300, 470, 250, 70, 14, 0, 3.4));
    add(lightString(1130, 250, 1600, 300, 70, 14, 3, 3.4));

    /* left side: a kicker with a rider in the air, and a lit rail */
    add(`<path d="M80 760 Q200 744 290 690 L300 700 Q220 760 90 780Z" fill="#fff"/><path d="M290 690 L300 700 L300 780 L230 780Z" fill="#cfc6e6"/>`);
    add(lightString(90, 778, 300, 700, -14, 8, 2, 3));
    add(rider(250, 600, 1.3, -24, '#1fa37a', '#c4202f', '#c4202f', '#f2a81d'));
    add(`<path d="M80 900 L420 830" stroke="#d0d4dc" stroke-width="7" stroke-linecap="round"/><path d="M110 894 v30 M250 864 v30 M390 836 v30" stroke="#8a8f99" stroke-width="5"/>`);
    for (let i = 0; i < 12; i++) add(bulb(90 + i * 28, 896 - i * 5.9 + 10, BULB[i % 7], 2.8));
    add(rider(250, 858, 1.4, -12, '#2a6fd6', '#2b2b4a', '#c4202f', '#e0392f'));

    /* spectators along the right deck */
    for (let i = 0; i < 9; i++) {
      const x = 985 + i * 30 + rr(-5, 5), y = 552 + i * 9;
      const c = ['#e0392f', '#2a6fd6', '#f2a81d', '#1fa37a', '#c23aa0'][i % 5];
      add(`<g transform="translate(${f(x)} ${f(y)}) scale(${f(0.62 + i * 0.03)}) translate(${f(-x)} ${f(-y)})"><ellipse cx="${f(x)}" cy="${f(y)}" rx="12" ry="20" fill="${c}"/><circle cx="${f(x)}" cy="${f(y - 26)}" r="8" fill="#f1c9a5"/><path d="M${f(x - 8)} ${f(y - 28)} Q${f(x)} ${f(y - 42)} ${f(x + 8)} ${f(y - 28)}Z" fill="${i % 2 ? '#c4202f' : '#2b2b4a'}"/>${i % 3 === 0 ? `<path d="M${f(x + 10)} ${f(y - 10)} l12 -26" stroke="${c}" stroke-width="5" stroke-linecap="round"/>` : ''}</g>`);
    }
    /* DJ booth / lodge on the right */
    add(`<g filter="url(#b-sh)">
      <rect x="1250" y="660" width="290" height="190" rx="6" fill="url(#b-booth)"/>
      <path d="M1236 664 L1395 600 L1554 664Z" fill="#c4202f"/><path d="M1232 666 L1395 598 L1558 666" stroke="#fff" stroke-width="9" fill="none" stroke-linejoin="round"/>
      <rect x="1280" y="700" width="230" height="70" rx="4" fill="#ffcf70" opacity=".9"/><rect x="1280" y="700" width="230" height="70" rx="4" fill="#ff7ad9" opacity=".25"/>
      <rect x="1270" y="770" width="250" height="40" fill="#2a1d3c"/><circle cx="1350" cy="790" r="12" fill="#111"/><circle cx="1440" cy="790" r="12" fill="#111"/><circle cx="1350" cy="790" r="4" fill="#ff5d4d"/><circle cx="1440" cy="790" r="4" fill="#6cc8ff"/>
      <rect x="1210" y="760" width="44" height="90" rx="4" fill="#1a1426"/><circle cx="1232" cy="786" r="13" fill="#2f2640"/><circle cx="1232" cy="826" r="10" fill="#2f2640"/>
      <rect x="1536" y="760" width="44" height="90" rx="4" fill="#1a1426"/><circle cx="1558" cy="786" r="13" fill="#2f2640"/><circle cx="1558" cy="826" r="10" fill="#2f2640"/>
    </g>`);
    add(lightString(1240, 664, 1395, 602, -10, 9, 1, 3.2) + lightString(1395, 602, 1550, 664, -10, 9, 5, 3.2));
    for (let i = 0; i < 10; i++) add(bulb(1262 + i * 28, 852, BULB[(i * 3) % 7], 3));

    /* snowman in goggles + boards stuck in the snow */
    add(`<g transform="translate(1100 900)"><ellipse cx="0" cy="40" rx="70" ry="10" fill="#cfc6e6"/><circle cx="0" cy="0" r="50" fill="#fbf7fb"/><circle cx="0" cy="-74" r="36" fill="#fbf7fb"/><circle cx="0" cy="-128" r="26" fill="#fbf7fb"/>
      <rect x="-24" y="-138" width="48" height="12" rx="6" fill="#2b2b4a"/><rect x="-18" y="-136" width="16" height="8" rx="4" fill="#7fe0ff"/><rect x="2" y="-136" width="16" height="8" rx="4" fill="#7fe0ff"/>
      <path d="M-24 -150 Q0 -180 24 -150Z" fill="#c4202f"/><path d="M-26 -150 h52" stroke="#fff" stroke-width="7" stroke-linecap="round"/><circle cx="20" cy="-172" r="6" fill="#fff"/>
      <path d="M0 -120 l18 5 l-18 4Z" fill="#f08a2a"/><path d="M-30 -104 Q0 -92 30 -104 L32 -94 Q0 -82 -32 -94Z" fill="#1fa37a"/><circle cx="0" cy="-70" r="4" fill="#222"/><circle cx="0" cy="-52" r="4" fill="#222"/>
      <path d="M-34 -80 L-80 -110 M34 -80 L84 -100" stroke="#6b4a2e" stroke-width="5" stroke-linecap="round"/></g>`);
    [[960, '#e0392f', -8], [990, '#2a6fd6', 6], [1020, '#f2a81d', -2]].forEach(([x, c, r]) => add(`<rect x="${x}" y="810" width="22" height="130" rx="11" fill="${c}" transform="rotate(${r} ${x} 940)"/><rect x="${x + 4}" y="850" width="14" height="6" fill="#111" transform="rotate(${r} ${x} 940)"/>`));

    /* foreground + side pines */
    add(`<path d="M0 930 Q400 900 800 920 Q1200 940 1600 912 V1000 H0Z" fill="#efe6f4"/>`);
    [[30, 600, 220], [110, 560, 160], [1560, 610, 230], [1490, 560, 150]].forEach(([x, b, h]) => add(pine(x, b, h)));
    for (let i = 0; i < 16; i++) add(bulb(rr(0, 70), rr(420, 590), BULB[i % 7], 3) + bulb(rr(1520, 1600), rr(420, 600), BULB[(i + 2) % 7], 3));

    add(`<rect width="${W}" height="${H}" fill="url(#b-vig)"/>`);
    return { svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${out.join('')}</svg>`, lights, candles };
  }

  /* ---------- animation: a rider swinging wall to wall, boosting out of each lip ---------- */
  const P = {};
  const path = (k) => P[k] || (P[k] = new Path2D(RD[k]));
  const D = 0.36;
  function boost(ctx, t) {
    const s = sec(D);
    const swing = Math.sin(t * 0.9) * 1.32; // |swing| > 1 = in the air above a lip
    const side = Math.sign(swing) || 1, a = Math.abs(swing);
    let x, y, rot;
    if (a <= 1) {
      x = 800 + swing * s.lh * 0.92;
      y = s.fy - Math.pow(a, 3) * (s.fy - s.ly) - 4;
      rot = side * Math.pow(a, 2) * 70;
    } else {
      const k = (a - 1) / 0.32; // 0 at the lip, 1 at the top of the air
      x = 800 + side * (s.lh * 0.92 + 18 * k);
      y = s.ly - 4 - Math.sin(k * Math.PI / 2) * 160;
      rot = side * (70 + k * 290); // a full spin at the top
    }
    // spray when on the wall
    if (a > 0.6 && a < 1.05) {
      ctx.fillStyle = 'rgba(255,255,255,.7)';
      for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.arc(x - side * (8 + i * 6), y + 6 - i * 2, 4 - i * 0.5, 0, 7); ctx.fill(); }
    }
    ctx.translate(x, y); ctx.rotate((rot * Math.PI) / 180); ctx.scale(1.25, 1.25);
    ctx.fillStyle = '#7a2be2'; ctx.fill(path('board'));
    ctx.fillStyle = '#c4202f'; ctx.fill(path('legs'));
    ctx.fillStyle = '#1fa37a'; ctx.fill(path('torso'));
    ctx.strokeStyle = '#1fa37a'; ctx.lineWidth = 5.5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(4, -30); ctx.lineTo(16, -6); ctx.moveTo(-4, -30); ctx.lineTo(-20, -40); ctx.stroke();
    ctx.fillStyle = '#f1c9a5'; ctx.beginPath(); ctx.arc(2, -44, 6.5, 0, 7); ctx.fill();
    ctx.fillStyle = '#d3202f'; ctx.fill(path('hat'));
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(15, -59, 3.4, 0, 7); ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-5, -46); ctx.quadraticCurveTo(3, -49, 10, -46); ctx.stroke();
  }
  function beams(ctx, t) {
    ctx.globalCompositeOperation = 'lighter';
    [['255,90,200', 0], ['90,200,255', 2.1], ['255,220,90', 4.2]].forEach(([c, ph], i) => {
      const a = -Math.PI / 2 + Math.sin(t * 0.7 + ph) * 0.75;
      const ox = 1330 + i * 60, oy = 700;
      const len = 520, spread = 0.09;
      const g = ctx.createLinearGradient(ox, oy, ox + Math.cos(a) * len, oy + Math.sin(a) * len);
      g.addColorStop(0, `rgba(${c},.35)`); g.addColorStop(1, `rgba(${c},0)`);
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.moveTo(ox, oy);
      ctx.lineTo(ox + Math.cos(a - spread) * len, oy + Math.sin(a - spread) * len);
      ctx.lineTo(ox + Math.cos(a + spread) * len, oy + Math.sin(a + spread) * len);
      ctx.closePath(); ctx.fill();
    });
  }

  A.designs.snowboard = {
    id: 'snowboard',
    name: 'Halfpipe Holiday',
    blurb: 'Snowboarders catching air over a festive terrain park.',
    width: W, height: H, build,
    title: { path: 'M500 104 Q800 132 1100 104', size: 44, maxWidth: 520, fill: '#fff4dc', stroke: '#5a0816' },
    effects: [
      { type: 'custom', draw: beams },
      { type: 'glow', x: 470, y: 44, r: 200, color: '255,240,200', a: 0.25, speed: 0.8 },
      { type: 'glow', x: 1130, y: 44, r: 200, color: '255,240,200', a: 0.25, speed: 0.9 },
      { type: 'star', x: 800, y: 305, r: 60 },
      { type: 'twinkle' },
      { type: 'custom', draw: boost },
      { type: 'snow', rect: [0, 0, 1600, 1000], count: 80 },
    ],
    layout: 'snowboard',
    keepOut: [[440, 24, 720, 156], [548, 420, 504, 290]],
    day24: { x: 1300, y: 690, w: 170, h: 140 },
    numStyles: ['n-red', 'n-tag', 'n-swash', 'n-gold', 'n-cream'],
  };
})();
