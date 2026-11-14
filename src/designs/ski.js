/* Design — "Bluebird Powder Day"
   A mountain resort under a clear blue sky: corduroy runs, carving skiers, a chairlift
   that really runs, a gondola, and a timber A-frame lodge with the fire going. */
(function () {
  const A = (window.AYY = window.AYY || {});
  A.designs = A.designs || {};
  const W = 1600, H = 1000;
  const f = (n) => Math.round(n * 10) / 10;
  const LIFT = { b: [236, 792], t: [990, 330] };
  const lerp = (u) => [LIFT.b[0] + (LIFT.t[0] - LIFT.b[0]) * u, LIFT.b[1] + (LIFT.t[1] - LIFT.b[1]) * u];

  // skier shapes (facing right, origin = under the boots); shared by the art and the animation
  const SK = {
    ski1: 'M-30 0 L28 0 Q36 0 38 -6',
    ski2: 'M-34 -5 L24 -5 Q32 -5 34 -11',
    legs: 'M-8 -4 L-2 -22 L10 -30 L16 -24 L6 -16 L4 -2Z',
    torso: 'M-4 -26 Q2 -50 14 -54 Q22 -52 22 -44 L12 -24Z',
    hat: 'M11 -62 Q12 -72 19 -71 Q27 -70 26 -62Z',
  };

  function build() {
    const R = A.util.rng(9123);
    const rr = (a, b) => a + R() * (b - a);
    const pick = (arr) => arr[Math.floor(R() * arr.length)];
    const lights = [], candles = [], out = [];
    const add = (s) => out.push(s);
    const BULB = ['#ffd36b', '#ff5d4d', '#6cc8ff', '#8ff07a', '#ff9be3', '#fff1b8', '#ffa94d'];
    const JACKETS = ['#e0392f', '#f2a81d', '#2a6fd6', '#1fa37a', '#c23aa0', '#ff6a3d', '#2b2b6e'];

    function bulb(x, y, c, r = 3.4) {
      lights.push({ x, y, c, r });
      return `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r * 2.4)}" fill="${c}" opacity=".25"/><ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(r * 0.8)}" ry="${f(r * 1.15)}" fill="${c}"/>`;
    }
    function lightString(x0, y0, x1, y1, sag, n, off = 0, r = 3.2) {
      const cx = (x0 + x1) / 2, cy = Math.max(y0, y1) + sag;
      let s = `<path d="M${x0} ${y0} Q${cx} ${cy} ${x1} ${y1}" stroke="#2a2a22" stroke-width="1.5" fill="none"/>`;
      for (let i = 1; i < n; i++) {
        const t = i / n;
        s += bulb((1 - t) * (1 - t) * x0 + 2 * (1 - t) * t * cx + t * t * x1, (1 - t) * (1 - t) * y0 + 2 * (1 - t) * t * cy + t * t * y1 + 4, BULB[(i + off) % 7], r);
      }
      return s;
    }
    function pine(x, base, h, col = '#1f4a3a', snow = '#f4f8ff', dark = '#143428') {
      let s = `<rect x="${f(x - h * 0.03)}" y="${f(base - h * 0.1)}" width="${f(h * 0.06)}" height="${f(h * 0.12)}" fill="#4a2c1a"/>`;
      for (let k = 0; k < 4; k++) {
        const ty = base - h + k * h * 0.2, w = h * (0.13 + k * 0.08), th = h * 0.32;
        s += `<path d="M${f(x)} ${f(ty)} L${f(x - w)} ${f(ty + th)} Q${f(x)} ${f(ty + th + h * 0.05)} ${f(x + w)} ${f(ty + th)}Z" fill="${col}"/>`;
        s += `<path d="M${f(x)} ${f(ty)} L${f(x + w)} ${f(ty + th)} Q${f(x + w * 0.5)} ${f(ty + th + h * 0.03)} ${f(x + w * 0.1)} ${f(ty + th * 0.9)}Z" fill="${dark}" opacity=".6"/>`;
        s += `<path d="M${f(x)} ${f(ty)} L${f(x - w * 0.62)} ${f(ty + th * 0.6)} Q${f(x - w * 0.35)} ${f(ty + th * 0.72)} ${f(x - w * 0.12)} ${f(ty + th * 0.55)} Q${f(x + w * 0.18)} ${f(ty + th * 0.7)} ${f(x + w * 0.5)} ${f(ty + th * 0.5)}Z" fill="${snow}"/>`;
      }
      return s;
    }
    function skier(x, y, s, dir, jacket, pants, hat) {
      return `<g transform="translate(${f(x)} ${f(y)}) scale(${f(s * dir)} ${f(s)})">
        <ellipse cx="-30" cy="-2" rx="14" ry="6" fill="#fff" opacity=".85"/><circle cx="-44" cy="-8" r="5" fill="#fff" opacity=".7"/><circle cx="-36" cy="-14" r="3.5" fill="#fff" opacity=".6"/>
        <path d="${SK.ski1}" stroke="#1a1a1a" stroke-width="3.5" fill="none" stroke-linecap="round"/><path d="${SK.ski2}" stroke="#333" stroke-width="3.5" fill="none" stroke-linecap="round"/>
        <path d="${SK.legs}" fill="${pants}"/><path d="${SK.torso}" fill="${jacket}"/>
        <path d="M16 -46 L27 -34" stroke="${jacket}" stroke-width="6" stroke-linecap="round"/><path d="M27 -34 L2 2" stroke="#555" stroke-width="1.6"/>
        <circle cx="18" cy="-60" r="7" fill="#f1c9a5"/><path d="${SK.hat}" fill="${hat}"/><circle cx="18" cy="-72" r="3.2" fill="#fff"/><rect x="17" y="-63" width="10" height="4" rx="2" fill="#ffb84d"/>
      </g>`;
    }
    const inPoly = (pt, poly) => { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, yi] = poly[i], [xj, yj] = poly[j]; if ((yi > pt[1]) !== (yj > pt[1]) && pt[0] < ((xj - xi) * (pt[1] - yi)) / (yj - yi) + xi) c = !c; } return c; };

    add(`<defs>
      <linearGradient id="s-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0f4597"/><stop offset=".5" stop-color="#3f8ad8"/><stop offset="1" stop-color="#bfe2f8"/></linearGradient>
      <radialGradient id="s-sun" cx="1390" cy="120" r="360" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#fffbe8" stop-opacity="1"/><stop offset=".08" stop-color="#fff6d0" stop-opacity=".8"/><stop offset=".35" stop-color="#d9ecff" stop-opacity=".25"/><stop offset="1" stop-color="#d9ecff" stop-opacity="0"/></radialGradient>
      <linearGradient id="s-slope" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f6faff"/><stop offset="1" stop-color="#dfeaf8"/></linearGradient>
      <pattern id="s-cord" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(-8)"><rect width="10" height="10" fill="#fbfdff"/><rect width="10" height="2" fill="#dbe7f6"/></pattern>
      <linearGradient id="s-log" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9a5f34"/><stop offset="1" stop-color="#6a3c1e"/></linearGradient>
      <linearGradient id="s-glass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe8a8"/><stop offset=".6" stop-color="#ffb04a"/><stop offset="1" stop-color="#e8762a"/></linearGradient>
      <linearGradient id="s-wood" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a8703f"/><stop offset=".5" stop-color="#8a5530"/><stop offset="1" stop-color="#5e3418"/></linearGradient>
      <linearGradient id="s-woodd" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6e4020"/><stop offset="1" stop-color="#3e2210"/></linearGradient>
      <linearGradient id="s-gold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff1b0"/><stop offset=".45" stop-color="#e2b04a"/><stop offset="1" stop-color="#9c6b1c"/></linearGradient>
      <filter id="s-sh" x="-20%" y="-20%" width="140%" height="160%"><feDropShadow dx="0" dy="6" stdDeviation="6" flood-color="#0c2a55" flood-opacity=".35"/></filter>
      <radialGradient id="s-vig" cx="800" cy="500" r="1050" gradientUnits="userSpaceOnUse"><stop offset=".62" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#06173a" stop-opacity=".45"/></radialGradient>
    </defs>`);

    /* sky and sun */
    add(`<rect width="${W}" height="600" fill="url(#s-sky)"/><rect width="${W}" height="600" fill="url(#s-sun)"/><circle cx="1390" cy="120" r="34" fill="#fffdf2"/>`);
    for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; add(`<path d="M${f(1390 + Math.cos(a) * 46)} ${f(120 + Math.sin(a) * 46)} L${f(1390 + Math.cos(a) * 96)} ${f(120 + Math.sin(a) * 96)}" stroke="#fffbe8" stroke-width="3" opacity=".35" stroke-linecap="round"/>`); }

    /* far range */
    const far = [[0, 430], [110, 340], [200, 386], [320, 262], [420, 316], [540, 176], [660, 300], [740, 262], [840, 340], [950, 236], [1060, 310], [1170, 214], [1280, 300], [1360, 262], [1470, 330], [1600, 290]];
    add(`<path d="M${far.map((p) => p.join(' ')).join(' L')} V560 H0Z" fill="#eef5fd"/>`);
    for (let i = 1; i < far.length - 1; i++) {
      const [px, py] = far[i], [vx, vy] = far[i + 1];
      if (py < far[i - 1][1] && py < vy) {
        add(`<path d="M${px} ${py} L${vx} ${vy} L${f(px + (vx - px) * 0.25)} ${vy + 110}Z" fill="#bdd0ea"/>`);
        add(`<path d="M${px} ${py} l-12 30 l8 -4 l-6 22 M${px + 6} ${py + 10} l10 26" stroke="#7d93b4" stroke-width="2.5" fill="none" opacity=".6"/>`);
      }
    }
    /* the home mountain */
    add(`<path d="M0 520 Q240 430 470 400 Q640 378 760 352 Q840 334 900 350 Q1050 390 1250 420 Q1450 446 1600 430 V1000 H0Z" fill="url(#s-slope)"/>`);
    add(`<path d="M760 352 Q840 334 900 350 Q1050 390 1250 420 L1250 470 Q1050 440 900 400Z" fill="#d6e3f4" opacity=".7"/>`);
    // groomed runs (corduroy)
    const runs = [
      [[600, 386], [700, 380], [720, 520], [640, 700], [600, 1000], [380, 1000], [470, 720], [560, 520]],
      [[880, 360], [960, 372], [990, 560], [1060, 760], [980, 760], [900, 560]],
      [[300, 470], [360, 450], [330, 640], [250, 820], [170, 820], [240, 640]],
    ];
    runs.forEach((p) => add(`<path d="M${p.map((q) => q.join(' ')).join(' L')}Z" fill="url(#s-cord)"/>`));
    // carving tracks on the runs
    add(`<path d="M640 420 Q600 470 650 520 Q700 570 640 620 Q590 680 630 740" stroke="#c9d9ee" stroke-width="3" fill="none"/><path d="M930 400 Q900 450 950 500 Q990 560 950 620" stroke="#c9d9ee" stroke-width="3" fill="none"/>`);
    // forests between the runs (more and bigger lower down)
    const trees = [];
    for (let k = 0; k < 900 && trees.length < 150; k++) {
      const x = rr(0, W), y = rr(420, 780);
      if (inPoly([x, y], runs[0]) || inPoly([x, y], runs[1]) || inPoly([x, y], runs[2])) continue;
      if (x > 1040 && y > 600) continue; // lodge clearing
      const topY = 520 - (x < 470 ? (470 - x) * -0.35 : 0);
      if (y < (x < 760 ? 520 - (x / 760) * 130 : 360 + (x - 760) * 0.12) + 20) continue;
      const h = 30 + (y - 420) * 0.22;
      if (trees.some((t) => Math.abs(t[0] - x) < h * 0.3 && Math.abs(t[1] - y) < h * 0.35)) continue;
      trees.push([x, y, h]);
    }
    trees.sort((a, b) => a[1] - b[1]).forEach(([x, y, h]) => add(pine(x, y, h)));

    /* gondola line on the right */
    add(`<path d="M1230 640 L1560 250" stroke="#3a3a3a" stroke-width="2"/><path d="M1246 646 L1576 256" stroke="#3a3a3a" stroke-width="2"/>`);
    [[1300, 557], [1420, 415], [1520, 297]].forEach(([x, y], i) => add(`<g transform="translate(${x} ${y})"><path d="M0 0 v18" stroke="#333" stroke-width="2"/><rect x="-14" y="18" width="28" height="26" rx="5" fill="${['#d6312b', '#f2a81d', '#2a6fd6'][i]}"/><rect x="-10" y="22" width="20" height="10" rx="2" fill="#cfe6ff"/></g>`));
    // top station
    add(`<g transform="translate(990 330)"><rect x="-34" y="-30" width="68" height="40" fill="url(#s-log)"/><path d="M-42 -30 L0 -56 L42 -30Z" fill="#7a2c22"/><path d="M-44 -30 L0 -58 L44 -30" stroke="#fff" stroke-width="6" fill="none"/><rect x="-10" y="-20" width="20" height="16" fill="url(#s-glass)"/></g>`);

    /* chairlift cables + towers (the chairs ride in the animation layer) */
    const [bx, by] = LIFT.b, [tx, ty] = LIFT.t;
    add(`<path d="M${bx} ${by - 60} L${tx} ${ty - 60}" stroke="#2c2c2c" stroke-width="2"/><path d="M${bx + 14} ${by - 52} L${tx + 14} ${ty - 52}" stroke="#2c2c2c" stroke-width="2"/>`);
    [0.12, 0.3, 0.48, 0.66, 0.84].forEach((u) => {
      const [x, y] = lerp(u);
      const len = 64 + u * 10;
      add(`<rect x="${f(x + 3)}" y="${f(y - 60)}" width="6" height="${f(len)}" fill="#5c6670"/><rect x="${f(x - 8)}" y="${f(y - 64)}" width="34" height="5" fill="#3e464f"/><ellipse cx="${f(x + 6)}" cy="${f(y + 4)}" rx="12" ry="3" fill="#c4d4ea"/>`);
    });
    // bottom station
    add(`<g transform="translate(${bx} ${by})" filter="url(#s-sh)"><rect x="-50" y="-58" width="90" height="62" fill="url(#s-log)"/><path d="M-58 -58 L-5 -90 L48 -58Z" fill="#7a2c22"/><path d="M-60 -58 L-5 -92 L50 -58" stroke="#fff" stroke-width="7" fill="none"/><rect x="-36" y="-44" width="24" height="20" fill="url(#s-glass)"/><rect x="0" y="-44" width="24" height="20" fill="url(#s-glass)"/><circle cx="20" cy="-60" r="16" fill="none" stroke="#333" stroke-width="4"/></g>`);
    add(lightString(bx - 56, by - 58, bx - 5, by - 90, 2, 5, 0, 2.8) + lightString(bx - 5, by - 90, bx + 46, by - 58, 2, 5, 3, 2.8));

    /* skiers carving down the runs */
    [[620, 470, 0.7, 1], [690, 600, 0.95, -1], [560, 780, 1.25, 1], [470, 900, 1.5, -1], [935, 460, 0.75, -1], [1010, 640, 1.0, 1], [300, 560, 0.8, -1], [230, 740, 1.1, 1]].forEach(([x, y, s, d], i) => add(skier(x, y, s, d, JACKETS[i % 7], i % 2 ? '#24304a' : '#3a3a3a', JACKETS[(i + 3) % 7])));

    /* trail sign */
    add(`<g transform="translate(118 900)" filter="url(#s-sh)"><rect x="-5" y="-150" width="10" height="160" fill="#6a3c1e"/>
      <rect x="-70" y="-150" width="140" height="34" rx="4" fill="url(#s-wood)"/><circle cx="-46" cy="-133" r="10" fill="#1f9a4a"/><rect x="-28" y="-138" width="80" height="8" rx="3" fill="#f3e6cc" opacity=".8"/>
      <rect x="-70" y="-110" width="140" height="34" rx="4" fill="url(#s-wood)"/><rect x="-56" y="-103" width="20" height="20" fill="#1f5fc4"/><rect x="-28" y="-98" width="70" height="8" rx="3" fill="#f3e6cc" opacity=".8"/>
      <rect x="-70" y="-70" width="140" height="34" rx="4" fill="url(#s-wood)"/><path d="M-46 -66 l10 13 l-10 13 l-10 -13Z" fill="#111"/><path d="M-26 -66 l10 13 l-10 13 l-10 -13Z" fill="#111"/><rect x="-8" y="-58" width="60" height="8" rx="3" fill="#f3e6cc" opacity=".8"/>
      <path d="M-74 -152 Q0 -162 74 -152" stroke="#fff" stroke-width="7" fill="none"/><path d="M-60 -116 l120 0" stroke="#fff" stroke-width="3" opacity=".7"/>
    </g>`);

    /* the lodge */
    add(`<g filter="url(#s-sh)">
      <rect x="1040" y="748" width="440" height="100" fill="url(#s-woodd)"/>
      <path d="M1260 540 L1040 840 L1480 840Z" fill="url(#s-log)"/>
      ${Array.from({ length: 12 }, (_, i) => `<path d="M${1260 - i * 18.3} ${540 + i * 25} H${1260 + i * 18.3}" stroke="#5a3218" stroke-width="2" opacity=".55"/>`).join('')}
      <path d="M1260 600 L1170 790 L1350 790Z" fill="url(#s-glass)"/>
      <path d="M1260 600 V790 M1215 695 H1305 M1193 742 H1327" stroke="#5a3218" stroke-width="5"/>
      <path d="M1250 522 L1022 846 L1046 846 L1260 548 L1474 846 L1498 846 L1270 522Z" fill="#7a2c22"/>
      <path d="M1250 518 L1018 846 M1270 518 L1502 846" stroke="#fff" stroke-width="10" stroke-linecap="round"/>
      <rect x="1380" y="560" width="36" height="110" fill="#8a8f99"/><rect x="1374" y="552" width="48" height="12" fill="#6a6f78"/><path d="M1374 554 q24 -10 48 0" stroke="#fff" stroke-width="6" fill="none"/>
      <rect x="1030" y="830" width="460" height="12" fill="#5a3218"/>
      ${Array.from({ length: 16 }, (_, i) => `<rect x="${1036 + i * 29}" y="842" width="6" height="34" fill="#5a3218"/>`).join('')}
      <rect x="1030" y="870" width="460" height="8" fill="#5a3218"/>
    </g>`);
    add(lightString(1050, 836, 1258, 548, -40, 14, 0, 3.2));
    add(lightString(1262, 548, 1470, 836, -40, 14, 4, 3.2));
    add(lightString(1036, 842, 1484, 842, 14, 18, 2, 3));
    // wreath on the gable
    {
      let s = '';
      for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2; s += `<circle cx="${f(1260 + Math.cos(a) * 15)}" cy="${f(578 + Math.sin(a) * 15)}" r="7" fill="${pick(['#1d5a35', '#24683f'])}"/>`; }
      add(s + `<path d="M1252 590 l-6 16 M1268 590 l6 16" stroke="#c4202f" stroke-width="5"/><circle cx="1260" cy="592" r="5" fill="#c4202f"/>`);
    }
    // skis and boards racked by the deck
    [[1500, '#e0392f'], [1514, '#2a6fd6'], [1528, '#f2a81d'], [1546, '#1fa37a'], [1562, '#c23aa0']].forEach(([x, c], i) => add(`<rect x="${x}" y="${740 + (i % 2) * 8}" width="8" height="120" rx="4" fill="${c}" transform="rotate(${-4 + i * 2} ${x} 860)"/>`));
    add(`<rect x="1490" y="800" width="96" height="8" fill="#5a3218"/>`);
    // decorated tree by the lodge
    add(pine(1000, 890, 190, '#1e5a35'));
    for (let i = 0; i < 18; i++) add(bulb(rr(960, 1040), rr(730, 880), BULB[i % 7], 3));

    /* foreground snow + crossed skis */
    add(`<path d="M0 900 Q300 870 640 896 Q980 920 1300 892 Q1460 880 1600 900 V1000 H0Z" fill="#fbfdff"/><path d="M0 900 Q300 870 640 896 Q980 920 1300 892 Q1460 880 1600 900" stroke="#d6e3f4" stroke-width="5" fill="none"/>`);
    add(`<g transform="translate(330 940)"><rect x="-4" y="-110" width="9" height="120" rx="4" fill="#e0392f" transform="rotate(-14)"/><rect x="-4" y="-110" width="9" height="120" rx="4" fill="#2a6fd6" transform="rotate(14)"/><path d="M-50 -100 L-30 10 M50 -100 L30 10" stroke="#555" stroke-width="2.5"/><circle cx="-31" cy="-4" r="7" fill="none" stroke="#555" stroke-width="2"/><circle cx="31" cy="-4" r="7" fill="none" stroke="#555" stroke-width="2"/><ellipse cx="0" cy="12" rx="60" ry="8" fill="#dfe8f6"/></g>`);
    for (let i = 0; i < 18; i++) add(`<ellipse cx="${f(rr(0, W))}" cy="${f(rr(920, 990))}" rx="${f(rr(20, 70))}" ry="${f(rr(3, 6))}" fill="#dce6f5" opacity=".7"/>`);

    /* carved wooden title sign */
    add(`<g filter="url(#s-sh)">
      <path d="M560 30 V70 M1040 30 V70" stroke="#c9a46a" stroke-width="4"/>
      <path d="M548 98 L452 92 L480 136 L452 182 L560 170Z" fill="url(#s-woodd)"/>
      <path d="M1052 98 L1148 92 L1120 136 L1148 182 L1040 170Z" fill="url(#s-woodd)"/>
      <path d="M520 76 L560 104 L560 160 L520 150Z" fill="#2e180a"/><path d="M1080 76 L1040 104 L1040 160 L1080 150Z" fill="#2e180a"/>
      <path d="M520 76 Q800 18 1080 76 L1080 150 Q800 92 520 150Z" fill="url(#s-wood)"/>
      <path d="M540 96 Q800 44 1060 96 M540 132 Q800 80 1060 132" stroke="#5a3218" stroke-width="1.5" fill="none" opacity=".5"/>
      <path d="M520 78 Q800 18 1080 78" stroke="#fff" stroke-width="9" fill="none" stroke-linecap="round"/>
      <circle cx="540" cy="110" r="4" fill="url(#s-gold)"/><circle cx="1060" cy="110" r="4" fill="url(#s-gold)"/>
    </g>`);
    add(`<rect width="${W}" height="${H}" fill="url(#s-vig)"/>`);
    return { svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${out.join('')}</svg>`, lights, candles };
  }

  /* ---------- animation ---------- */
  const P = {};
  const path = (k) => P[k] || (P[k] = new Path2D(SK[k]));
  const COLORS = ['#e0392f', '#f2a81d', '#2a6fd6', '#1fa37a', '#c23aa0', '#ff6a3d'];
  function chairlift(ctx, t) {
    const [bx, by] = LIFT.b, [tx, ty] = LIFT.t;
    const N = 9;
    for (let side = 0; side < 2; side++) {
      for (let i = 0; i < N; i++) {
        let u = ((t * 0.012 + i / N) % 1);
        if (side) u = 1 - u;
        const x = bx + (tx - bx) * u + (side ? 14 : 0), y = by + (ty - by) * u - 60 + (side ? 8 : 0);
        ctx.strokeStyle = '#333'; ctx.lineWidth = 1.6;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + 30); ctx.stroke();
        ctx.fillStyle = '#3b4652'; ctx.fillRect(x - 13, y + 30, 26, 4); ctx.fillRect(x - 13, y + 18, 3, 14);
        if (!side) {
          for (let r = 0; r < 2; r++) {
            const cx = x - 7 + r * 12, c = COLORS[(i * 2 + r) % COLORS.length];
            ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(cx, y + 24, 5, 8, 0, 0, 7); ctx.fill();
            ctx.fillStyle = '#f1c9a5'; ctx.beginPath(); ctx.arc(cx, y + 13, 4, 0, 7); ctx.fill();
            ctx.fillStyle = COLORS[(i + r + 3) % COLORS.length]; ctx.beginPath(); ctx.arc(cx, y + 11, 4.2, Math.PI, 0); ctx.fill();
            ctx.strokeStyle = '#222'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cx - 6, y + 40 + r); ctx.lineTo(cx + 12, y + 44 + r); ctx.stroke();
          }
        }
      }
    }
  }
  function carver(ctx, t) {
    // a skier linking turns down the open run, looping every ~7s
    const k = (t / 7) % 1;
    const y = 510 + k * 190;
    const x = 700 + Math.sin(k * Math.PI * 5) * 90;
    const dir = Math.cos(k * Math.PI * 5) >= 0 ? 1 : -1;
    const s = 0.9 + k * 0.5;
    const lean = Math.sin(k * Math.PI * 5) * 0.25;
    ctx.globalAlpha = Math.min(1, k * 8, (1 - k) * 8);
    // spray trail
    for (let j = 1; j < 14; j++) {
      const kk = k - j * 0.004;
      if (kk < 0) break;
      ctx.fillStyle = `rgba(255,255,255,${0.5 - j * 0.03})`;
      ctx.beginPath(); ctx.arc(700 + Math.sin(kk * Math.PI * 5) * 90, 510 + kk * 190, 5 - j * 0.25, 0, 7); ctx.fill();
    }
    ctx.translate(x, y); ctx.rotate(lean); ctx.scale(s * dir, s);
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#1a1a1a'; ctx.lineWidth = 3.5; ctx.stroke(path('ski1'));
    ctx.strokeStyle = '#333'; ctx.stroke(path('ski2'));
    ctx.fillStyle = '#24304a'; ctx.fill(path('legs'));
    ctx.fillStyle = '#e0392f'; ctx.fill(path('torso'));
    ctx.strokeStyle = '#e0392f'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(16, -46); ctx.lineTo(27, -34); ctx.stroke();
    ctx.strokeStyle = '#555'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(27, -34); ctx.lineTo(2, 2); ctx.stroke();
    ctx.fillStyle = '#f1c9a5'; ctx.beginPath(); ctx.arc(18, -60, 7, 0, 7); ctx.fill();
    ctx.fillStyle = '#ffffff'; ctx.fill(path('hat')); ctx.fillStyle = '#c4202f'; ctx.beginPath(); ctx.arc(18, -72, 3.4, 0, 7); ctx.fill();
    ctx.fillStyle = '#ffb84d'; ctx.fillRect(17, -63, 10, 4);
  }

  A.designs.ski = {
    id: 'ski',
    name: 'Bluebird Powder Day',
    blurb: 'Chairlifts, fresh tracks and a lodge with a roaring fire.',
    width: W, height: H, build,
    title: { path: 'M560 120 Q800 64 1040 120', size: 44, maxWidth: 440, fill: '#fff6dc', stroke: '#3a1d0a' },
    numStyles: ['n-red', 'n-swash', 'n-gold', 'n-red', 'n-tag', 'n-swash'],
    effects: [
      { type: 'glow', x: 1390, y: 120, r: 220, color: '255,250,220', a: 0.25, speed: 0.5 },
      { type: 'glow', x: 1260, y: 720, r: 170, color: '255,170,80', a: 0.35, speed: 2.2 },
      { type: 'smoke', x: 1398, y: 548, rate: 2, rise: 22, size: 9, color: '240,244,252', a: 0.5 },
      { type: 'twinkle' },
      { type: 'custom', draw: chairlift },
      { type: 'custom', draw: carver },
    ],
    layout: 'ski',
    keepOut: [[440, 18, 720, 172], [586, 470, 236, 250]],
    day24: { x: 1175, y: 625, w: 170, h: 150 },
  };
})();
